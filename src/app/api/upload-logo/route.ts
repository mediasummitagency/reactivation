import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const profileId = formData.get("profile_id") as string | null;

  if (!file || !profileId) {
    return NextResponse.json({ error: "file and profile_id required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Images only" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${profileId}/logo.${ext}`;
  const bytes = await file.arrayBuffer();

  const sb = getSupabase();
  const { error } = await sb.storage.from("logos").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = sb.storage.from("logos").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
