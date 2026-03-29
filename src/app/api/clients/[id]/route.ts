import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizePhone, normalizeDate } from "@/lib/utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { first_name, phone, last_visit, cadence_days, tech, booked_at } = body;

  const sb = getSupabase();

  // booked_at-only update (from "Mark as booked" action)
  if (booked_at !== undefined && !first_name && !phone) {
    const { data, error } = await sb
      .from("clients")
      .update({ booked_at: booked_at ?? null })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await sb
    .from("clients")
    .update({
      first_name: first_name?.trim(),
      phone: phone ? normalizePhone(phone) : undefined,
      last_visit: last_visit ? normalizeDate(last_visit) : null,
      cadence_days: cadence_days ? parseInt(cadence_days, 10) : 21,
      tech: tech?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabase();
  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
