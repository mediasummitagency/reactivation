import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { Settings } from "@/lib/types";

// Settings are now stored per-profile. The ?profile=<id> query param selects
// which profile to read/write. Falls back to the first profile if omitted.

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profile");
  const sb = getSupabase();

  let query = sb.from("profiles").select("*");
  if (profileId) {
    query = query.eq("id", profileId);
  } else {
    query = query.order("created_at", { ascending: true }).limit(1);
  }

  const { data, error } = await query.single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    business_name: data.name,
    provider_name: data.provider_name,
    booking_link: data.booking_link,
    drip_sequence: data.drip_sequence ?? [],
    techs: data.techs ?? [],
    logo_url: data.logo_url ?? "",
    primary_color: data.primary_color ?? "#0F172A",
    accent_color: data.accent_color ?? "#3B82F6",
    demo_mode: data.demo_mode ?? false,
    templates: data.templates ?? null,
  } satisfies Settings);
}

export async function PUT(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profile");
  const body = await req.json() as Partial<Settings> & { profile_id?: string };
  const id = profileId ?? body.profile_id;

  if (!id) return NextResponse.json({ error: "profile required" }, { status: 400 });

  const sb = getSupabase();
  const update: Record<string, unknown> = {};
  if (body.business_name !== undefined) update.name = body.business_name;
  if (body.provider_name !== undefined) update.provider_name = body.provider_name;
  if (body.booking_link !== undefined) update.booking_link = body.booking_link;
  if (body.drip_sequence !== undefined) update.drip_sequence = body.drip_sequence;
  if (body.techs !== undefined) update.techs = body.techs;
  if (body.logo_url !== undefined) update.logo_url = body.logo_url;
  if (body.primary_color !== undefined) update.primary_color = body.primary_color;
  if (body.accent_color !== undefined) update.accent_color = body.accent_color;
  if (body.demo_mode !== undefined) update.demo_mode = body.demo_mode;
  if (body.templates !== undefined) update.templates = body.templates;

  const { error } = await sb.from("profiles").update(update).eq("id", id);
  if (error) {
    console.error("[settings PUT] supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
