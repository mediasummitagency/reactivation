import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Client } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert a phone string to E.164 (+1XXXXXXXXXX). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

/** Normalise common date formats to YYYY-MM-DD. */
export function normalizeDate(raw: string): string {
  if (!raw) return "";
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // M/D/YY or M/D/YYYY
  const parts = raw.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Last-resort: native Date parser handles ISO with time, long-form English, etc.
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return raw;
}

/** Days since last visit (returns -1 if no visit date). */
export function daysSince(lastVisit: string | null): number {
  if (!lastVisit) return -1;
  const ms = Date.now() - new Date(lastVisit).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Compute visit status based on days since last visit. */
export function computeStatus(client: Client): Client["visit_status"] {
  const days = daysSince(client.last_visit);
  if (days === -1) return "unknown";
  if (days > client.cadence_days) return "overdue";
  if (days >= client.cadence_days - 5) return "due";
  return "ok";
}

/** Attach computed fields to a list of clients. */
export function withComputedFields(clients: Client[]): Client[] {
  return clients.map((c) => ({
    ...c,
    days_since: daysSince(c.last_visit),
    visit_status: computeStatus(c),
  }));
}

/** Format a date string for display. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a datetime string for the message log. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
