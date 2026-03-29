import { getSupabase } from "./supabase";
import { TEMPLATES, SMS_PROVIDER } from "./config";
import type { TemplateName } from "./types";

interface Settings {
  business_name: string;
  provider_name: string;
  booking_link: string;
  templates?: Record<string, string> | null;
}

async function getSettings(profileId: string): Promise<Settings> {
  const sb = getSupabase();
  const { data } = await sb.from("profiles").select("name, provider_name, booking_link, templates").eq("id", profileId).single();
  return {
    business_name: data?.name ?? "My Business",
    provider_name: data?.provider_name ?? "",
    booking_link: data?.booking_link ?? "",
    templates: data?.templates ?? null,
  };
}

/** Render a template string with client and business variables. */
export function renderTemplate(
  templateName: TemplateName | string,
  firstName: string,
  techName: string | null,
  settings: Settings
): string {
  const templateMap = settings.templates ?? TEMPLATES;
  const raw = templateMap[templateName as TemplateName] ?? TEMPLATES[templateName as TemplateName] ?? templateName;
  return raw
    .replace(/\{first_name\}/g, firstName)
    .replace(/\{tech_name\}/g, techName || settings.provider_name)
    .replace(/\{business_name\}/g, settings.business_name)
    .replace(/\{provider_name\}/g, settings.provider_name)
    .replace(/\{booking_link\}/g, settings.booking_link);
}

async function sendOpenPhone(
  to: string,
  body: string
): Promise<{ ok: boolean; id: string | null; error?: string }> {
  const apiKey = process.env.OPENPHONE_API_KEY!;
  const from = process.env.OPENPHONE_FROM_NUMBER!;

  const res = await fetch("https://api.openphone.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ to: [to], from, content: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, id: null, error: text };
  }

  const json = await res.json();
  const id =
    json?.data?.id ??
    json?.id ??
    null;
  return { ok: true, id };
}

async function sendTwilio(
  to: string,
  body: string
): Promise<{ ok: boolean; id: string | null; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, id: null, error: text };
  }

  const json = await res.json();
  return { ok: true, id: json.sid ?? null };
}

const STOP_FOOTER = "\n\nReply STOP to unsubscribe.";

/** Build a click-tracking URL that wraps the real booking link. */
function buildTrackingUrl(bookingLink: string, clientId: string, profileId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!appUrl || !bookingLink) return bookingLink;
  return `${appUrl}/api/track?c=${encodeURIComponent(clientId)}&p=${encodeURIComponent(profileId)}&url=${encodeURIComponent(bookingLink)}`;
}

/** Send a single SMS and log it to the messages table. */
export async function send(
  clientId: string,
  firstName: string,
  phone: string,
  templateName: string,
  tech: string | null = null,
  profileId: string = ""
): Promise<{ ok: boolean; body: string; error?: string }> {
  // Skip opted-out clients
  const sb = getSupabase();
  const { data: clientRow } = await sb.from("clients").select("opted_out").eq("id", clientId).single();
  if (clientRow?.opted_out) return { ok: false, body: "", error: "opted_out" };

  const settings = await getSettings(profileId);

  // Wrap booking link in tracking URL so clicks can be recorded
  const trackedSettings = settings.booking_link
    ? { ...settings, booking_link: buildTrackingUrl(settings.booking_link, clientId, profileId) }
    : settings;

  const body = renderTemplate(templateName, firstName, tech, trackedSettings) + STOP_FOOTER;

  const result =
    SMS_PROVIDER === "twilio"
      ? await sendTwilio(phone, body)
      : await sendOpenPhone(phone, body);

  // Log regardless of delivery status
  await sb.from("messages").insert({
    profile_id: profileId || null,
    client_id: clientId,
    template: templateName,
    body,
    provider_id: result.id,
    status: result.ok ? "sent" : "failed",
  });

  return { ok: result.ok, body, error: result.error };
}

/** Send the same template to multiple clients. */
export async function blast(
  clients: { id: string; first_name: string; phone: string; tech: string | null }[],
  templateName: string,
  profileId: string = ""
): Promise<{ sent: number; total: number; results: { name: string; ok: boolean; error?: string }[] }> {
  const results = await Promise.all(
    clients.map(async (c) => {
      const { ok, error } = await send(c.id, c.first_name, c.phone, templateName, c.tech, profileId);
      return { name: c.first_name, ok, error };
    })
  );

  return {
    sent: results.filter((r) => r.ok).length,
    total: results.length,
    results,
  };
}
