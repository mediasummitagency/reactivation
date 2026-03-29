import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const STOP_KEYWORDS = new Set([
  "stop",
  "unsubscribe",
  "stop all",
  "cancel",
  "end",
  "quit",
]);

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const eventType: string = payload?.type ?? "";
  const sb = getSupabase();

  // ── Delivery status update ────────────────────────────────────────────────
  if (eventType === "message.delivery.updated") {
    const providerId: string | null = payload?.data?.object?.id ?? null;
    const status: string | null = payload?.data?.object?.status ?? null;

    if (!providerId || !status) {
      return NextResponse.json({ ok: false, reason: "missing providerId or status" });
    }

    if (status === "delivered" || status === "failed") {
      const { error } = await sb
        .from("messages")
        .update({ status })
        .eq("provider_id", providerId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, handled: "delivery" });
  }

  // ── Inbound message — opt-out keyword check ───────────────────────────────
  if (eventType === "message.received") {
    const fromNumber: string | null = payload?.data?.object?.from ?? null;
    const content: string | null = payload?.data?.object?.content ?? null;

    if (!fromNumber || !content) {
      return NextResponse.json({ ok: false, reason: "missing from or content" });
    }

    const keyword = content.trim().toLowerCase();

    if (STOP_KEYWORDS.has(keyword)) {
      const { error } = await sb
        .from("clients")
        .update({ opted_out: true })
        .eq("phone", fromNumber);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, handled: "opt-out", phone: fromNumber });
    }

    // Log the inbound reply so the team can see it in the message log
    const { data: clientRow } = await sb
      .from("clients")
      .select("id, profile_id")
      .eq("phone", fromNumber)
      .maybeSingle();

    if (clientRow) {
      await sb.from("messages").insert({
        profile_id: clientRow.profile_id,
        client_id: clientRow.id,
        template: "",
        body: content.trim(),
        direction: "inbound",
        status: "received",
      });
    }

    return NextResponse.json({ ok: true, handled: "inbound-reply" });
  }

  // Unknown event — always return 200 so OpenPhone doesn't retry
  return NextResponse.json({ ok: true, handled: "unknown-event" });
}
