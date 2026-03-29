import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizePhone, normalizeDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profile");
  if (!profileId) return NextResponse.json({ error: "profile required" }, { status: 400 });

  const sb = getSupabase();
  const { data, error } = await sb
    .from("clients")
    .select("*")
    .eq("profile_id", profileId)
    .order("first_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { first_name, phone, last_visit, cadence_days, tech, profile_id } = body;

  if (!first_name || !phone) {
    return NextResponse.json({ error: "first_name and phone are required" }, { status: 400 });
  }
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from("clients")
    .upsert({
      profile_id,
      first_name: first_name.trim(),
      phone: normalizePhone(phone),
      last_visit: last_visit ? normalizeDate(last_visit) : null,
      cadence_days: cadence_days ? parseInt(cadence_days, 10) : 21,
      tech: tech?.trim() || null,
    }, { onConflict: "profile_id,phone" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
