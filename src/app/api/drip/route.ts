import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_DRIP_SEQUENCE } from "@/lib/config";
import type { DripStep } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_ids, profile_id } = body as { client_ids: string[]; profile_id: string };

  if (!client_ids?.length) {
    return NextResponse.json({ error: "client_ids required" }, { status: 400 });
  }
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const sb = getSupabase();

  // Load drip sequence from the profile
  const { data: profile } = await sb
    .from("profiles")
    .select("drip_sequence, demo_mode")
    .eq("id", profile_id)
    .single();

  let sequence: DripStep[] = DEFAULT_DRIP_SEQUENCE;
  if (profile?.drip_sequence?.length) {
    sequence = profile.drip_sequence as DripStep[];
  }

  const now = new Date();
  const jobs = [];

  for (const clientId of client_ids) {
    for (const step of sequence) {
      const scheduledAt = new Date(now);
      const unit = step.unit ?? (profile?.demo_mode ? "minutes" : "days");
      if (unit === "minutes") {
        scheduledAt.setMinutes(scheduledAt.getMinutes() + step.delay);
      } else if (unit === "hours") {
        scheduledAt.setHours(scheduledAt.getHours() + step.delay);
      } else {
        scheduledAt.setDate(scheduledAt.getDate() + step.delay);
      }

      jobs.push({
        profile_id,
        client_id: clientId,
        template: step.template,
        scheduled_at: scheduledAt.toISOString(),
        status: "pending",
      });
    }
  }

  const { error } = await sb.from("drip_jobs").insert(jobs);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    scheduled: jobs.length,
    delays: sequence.map((s) => ({ delay: s.delay, unit: s.unit ?? (profile?.demo_mode ? "minutes" : "days") })),
  });
}
