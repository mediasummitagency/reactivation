import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { blast } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_ids, template, profile_id } = body as {
    client_ids: string[];
    template: string;
    profile_id: string;
  };

  if (!client_ids?.length || !template) {
    return NextResponse.json(
      { error: "client_ids and template are required" },
      { status: 400 }
    );
  }
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data: clients, error } = await sb
    .from("clients")
    .select("id, first_name, phone, tech")
    .in("id", client_ids)
    .eq("profile_id", profile_id);

  if (error || !clients) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 500 });
  }

  const result = await blast(clients, template, profile_id);
  return NextResponse.json(result);
}
