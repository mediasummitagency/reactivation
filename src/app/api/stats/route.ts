import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profile");
  if (!profileId) return NextResponse.json({ error: "profile required" }, { status: 400 });

  const sb = getSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const [clientsRes, totalRes, todayRes, optOutsRes, repliesRes, bookedRes] = await Promise.all([
    sb.from("clients").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
    // NULL direction = legacy outbound rows inserted before migration
    sb.from("messages").select("id", { count: "exact", head: true }).eq("profile_id", profileId).neq("direction", "inbound"),
    sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .neq("direction", "inbound")
      .gte("sent_at", `${today}T00:00:00`),
    sb
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("opted_out", true),
    sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("direction", "inbound"),
    sb
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .not("booked_at", "is", null),
  ]);

  return NextResponse.json({
    total_clients: clientsRes.count ?? 0,
    total_sent: totalRes.count ?? 0,
    sent_today: todayRes.count ?? 0,
    opt_outs: optOutsRes.count ?? 0,
    response_rate: 0,
    replies: repliesRes.count ?? 0,
    booked: bookedRes.count ?? 0,
  });
}
