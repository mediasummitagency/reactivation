import type { TemplateName } from "./types";

/** When true, drip delays are in MINUTES. When false, they are in DAYS. */
export const DEMO_MODE = process.env.DEMO_MODE === "true";

export const SMS_PROVIDER = process.env.SMS_PROVIDER ?? "openphone";

export const TEMPLATES: Record<TemplateName, string> = {
  slot_fill:
    "Hey {first_name}, {tech_name} just opened up a few spots today. Want one? → {booking_link}",
  reactivation:
    "Hey {first_name}, {tech_name} wanted to reach out — {business_name} has some time this week if you're looking. → {booking_link}",
  cadence_reminder:
    "Hey {first_name}, think it's about that time again. Availability this week — easy to grab: {booking_link}",
  soft_follow_up:
    "Still got a couple spots open if you want one, {first_name}. → {booking_link}",
};

export const TEMPLATE_LABELS: Record<string, string> = {
  slot_fill: "Slot Fill",
  reactivation: "Reactivation",
  cadence_reminder: "Cadence Reminder",
  soft_follow_up: "Soft Follow-up",
};

export const DEFAULT_DRIP_SEQUENCE = [
  { delay: 2, unit: "minutes", template: "slot_fill" },
  { delay: 10, unit: "minutes", template: "reactivation" },
  { delay: 20, unit: "minutes", template: "cadence_reminder" },
  { delay: 30, unit: "minutes", template: "soft_follow_up" },
] satisfies import("./types").DripStep[];
