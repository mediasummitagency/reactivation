import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { send } from "@/lib/sms";

/**
 * Called by Vercel Cron every minute.
 * Processes all pending drip jobs whose scheduled_at <= now.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret (skip check when CRON_SECRET is not configured — dev/demo)
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("Authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();
  const now = new Date().toISOString();

  const { data: jobs, error } = await sb
    .from("drip_jobs")
    .select("id, profile_id, client_id, template")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!jobs?.length) return NextResponse.json({ processed: 0 });

  const results = await Promise.allSettled(
    jobs.map(async (job) => {
      // Fetch client
      const { data: client } = await sb
        .from("clients")
        .select("first_name, phone, tech")
        .eq("id", job.client_id)
        .single();

      if (!client) {
        await sb
          .from("drip_jobs")
          .update({ status: "failed", sent_at: now })
          .eq("id", job.id);
        return;
      }

      const { ok } = await send(
        job.client_id,
        client.first_name,
        client.phone,
        job.template,
        client.tech,
        job.profile_id
      );

      await sb
        .from("drip_jobs")
        .update({ status: ok ? "sent" : "failed", sent_at: now })
        .eq("id", job.id);
    })
  );

  const processed = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ processed });
}
