import { NextRequest, NextResponse } from "next/server";
import { fromCsvText, fromVcfText } from "@/lib/ingest";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const profileId = formData.get("profile_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!profileId) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const text = await file.text();
  const name = file.name.toLowerCase();

  let count = 0;
  if (name.endsWith(".vcf")) {
    count = await fromVcfText(text, profileId);
  } else {
    count = await fromCsvText(text, profileId);
  }

  return NextResponse.json({ imported: count });
}
