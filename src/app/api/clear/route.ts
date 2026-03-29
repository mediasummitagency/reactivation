import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const profileId = body.profile_id as string | undefined;

  if (!profileId) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const mode = (body.mode ?? "all") as "messages" | "all";

  const sb = getSupabase();
  // Delete in FK order; scoped to the active profile only
  await sb.from("drip_jobs").delete().eq("profile_id", profileId);
  await sb.from("messages").delete().eq("profile_id", profileId);
  if (mode === "all") {
    await sb.from("clients").delete().eq("profile_id", profileId);
  }
  return NextResponse.json({ ok: true });
}
