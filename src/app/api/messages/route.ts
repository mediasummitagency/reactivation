import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profile");
  if (!profileId) return NextResponse.json({ error: "profile required" }, { status: 400 });

  const sb = getSupabase();
  const { data, error } = await sb
    .from("messages")
    .select(`
      id, client_id, template, body, sent_at, status, direction,
      clients (first_name, phone)
    `)
    .eq("profile_id", profileId)
    .order("sent_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = (data ?? []).map((m) => ({
    id: m.id,
    client_id: m.client_id,
    template: m.template,
    body: m.body,
    sent_at: m.sent_at,
    status: m.status,
    direction: (m.direction ?? "outbound") as "outbound" | "inbound",
    // @ts-expect-error supabase join shape
    first_name: m.clients?.first_name ?? "Unknown",
    // @ts-expect-error supabase join shape
    phone: m.clients?.phone ?? "",
  }));

  return NextResponse.json(messages);
}
