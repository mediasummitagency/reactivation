import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_DRIP_SEQUENCE } from "@/lib/config";

export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name as string)?.trim() || "New Business";
  const provider_name = (body.provider_name as string)?.trim() ?? "";
  const booking_link = (body.booking_link as string)?.trim() ?? "";

  const sb = getSupabase();
  const { data, error } = await sb
    .from("profiles")
    .insert({
      name,
      provider_name,
      booking_link,
      drip_sequence: DEFAULT_DRIP_SEQUENCE,
      techs: [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
