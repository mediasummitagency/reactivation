import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/track?c=<client_id>&p=<profile_id>&url=<encoded_booking_url>
 *
 * Records the booking link click on the client record, then redirects
 * to the actual booking URL. The SMS templates use this as the booking link
 * so we get a signal that the client showed intent to book.
 */
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("c");
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  // Record the click (best-effort, don't block the redirect)
  if (clientId) {
    const sb = getSupabase();
    await sb
      .from("clients")
      .update({ link_clicked_at: new Date().toISOString() })
      .eq("id", clientId)
      .is("link_clicked_at", null); // only record first click
  }

  // Redirect to the real booking page
  return NextResponse.redirect(url, { status: 302 });
}
