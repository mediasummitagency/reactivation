import Papa from "papaparse";
import { getSupabase } from "./supabase";
import { normalizePhone, normalizeDate } from "./utils";

interface RawClient {
  first_name?: string;
  name?: string;
  phone?: string;
  last_visit?: string;
  cadence_days?: string;
  tech?: string;
}

/** Parse CSV text and insert clients into the database. Returns count of clients added. */
export async function fromCsvText(text: string, profileId: string): Promise<number> {
  const { data } = Papa.parse<RawClient>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const sb = getSupabase();
  let count = 0;

  for (const row of data) {
    const firstName = (row.first_name ?? row.name ?? "").trim();
    const phone = (row.phone ?? "").trim();
    if (!firstName || !phone) continue;

    await sb.from("clients").upsert({
      profile_id: profileId,
      first_name: firstName,
      phone: normalizePhone(phone),
      last_visit: row.last_visit ? normalizeDate(row.last_visit.trim()) : null,
      cadence_days: row.cadence_days ? parseInt(row.cadence_days, 10) : 21,
      tech: row.tech?.trim() || null,
    }, { onConflict: "profile_id,phone", ignoreDuplicates: true });
    count++;
  }

  return count;
}

/** Parse vCard text and insert clients. Returns count of clients added. */
export async function fromVcfText(text: string, profileId: string): Promise<number> {
  const sb = getSupabase();
  let count = 0;

  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  for (const card of cards) {
    let fullName = "";
    let phone = "";

    for (const line of card.split("\n")) {
      const l = line.trim();
      if (/^FN:/i.test(l)) {
        fullName = l.replace(/^FN:/i, "").trim();
      } else if (/^TEL/i.test(l) && !phone) {
        // Handles TEL:, TEL;TYPE=CELL:, etc.
        phone = l.replace(/^TEL[^:]*:/i, "").trim();
      }
    }

    if (!fullName || !phone) continue;

    const firstName = fullName.split(" ")[0];
    await sb.from("clients").upsert({
      profile_id: profileId,
      first_name: firstName,
      phone: normalizePhone(phone),
    }, { onConflict: "profile_id,phone", ignoreDuplicates: true });
    count++;
  }

  return count;
}
