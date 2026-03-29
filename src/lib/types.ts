export interface Client {
  id: string;
  first_name: string;
  phone: string;
  last_visit: string | null;
  cadence_days: number;
  status: string;
  tech: string | null;
  opted_out?: boolean;
  booked_at?: string | null;
  link_clicked_at?: string | null;
  created_at: string;
  // computed client-side
  days_since?: number;
  visit_status?: "overdue" | "due" | "ok" | "unknown";
}

export interface Message {
  id: string;
  client_id: string;
  template: string;
  body: string;
  sent_at: string;
  provider_id: string | null;
  status: string;
  direction?: "outbound" | "inbound";
  // joined
  first_name?: string;
  phone?: string;
}

export interface Settings {
  business_name: string;
  provider_name: string;
  booking_link: string;
  drip_sequence: DripStep[];
  techs: string[];
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  demo_mode?: boolean;
  templates?: Record<string, string>;
}

export interface Profile {
  id: string;
  name: string;
  provider_name: string;
  booking_link: string;
  drip_sequence: DripStep[];
  techs: string[];
  demo_mode?: boolean;
  created_at: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
}

export interface DripStep {
  delay: number;
  unit?: "minutes" | "hours" | "days";
  template: string;
}

export interface DripJob {
  id: string;
  client_id: string;
  template: string;
  scheduled_at: string;
  sent_at: string | null;
  status: "pending" | "sent" | "failed";
  created_at: string;
}

export interface Stats {
  total_clients: number;
  total_sent: number;
  sent_today: number;
  opt_outs: number;
  response_rate: number;
  replies: number;
  booked: number;
}

export type TemplateName =
  | "slot_fill"
  | "reactivation"
  | "cadence_reminder"
  | "soft_follow_up";
