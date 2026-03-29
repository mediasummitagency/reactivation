-- Reactivation Demo — Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- For an existing database, run the MIGRATION section at the bottom.

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Each profile = one business. All data (clients, messages, drip jobs) is scoped
-- to a profile so you can demo multiple barbershops independently.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Business',
  provider_name TEXT NOT NULL DEFAULT '',
  booking_link TEXT NOT NULL DEFAULT '',
  drip_sequence JSONB NOT NULL DEFAULT '[]',
  techs JSONB NOT NULL DEFAULT '[]',
  demo_mode BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#0F172A',
  accent_color TEXT NOT NULL DEFAULT '#3B82F6',
  templates JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── clients ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  last_visit DATE,
  cadence_days INTEGER DEFAULT 21,
  status TEXT DEFAULT 'active',
  tech TEXT,
  opted_out BOOLEAN DEFAULT false,
  booked_at TIMESTAMPTZ,
  link_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── messages (SMS log) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  template TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  provider_id TEXT,
  status TEXT DEFAULT 'sent',
  direction TEXT DEFAULT 'outbound'  -- 'outbound' | 'inbound'
);

-- ── settings (key-value — kept for backward compat, no longer written to) ─────
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── drip_jobs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drip_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'sent' | 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_profile
  ON clients(profile_id);

CREATE UNIQUE INDEX IF NOT EXISTS clients_profile_phone_unique
  ON clients(profile_id, phone);

CREATE INDEX IF NOT EXISTS idx_messages_profile
  ON messages(profile_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_drip_jobs_pending
  ON drip_jobs(profile_id, status, scheduled_at)
  WHERE status = 'pending';

-- ── Default profile (fresh install) ──────────────────────────────────────────
INSERT INTO profiles (name, provider_name, booking_link, drip_sequence, techs)
SELECT
  'Cuts by Carlos',
  'Carlos',
  'https://calendly.com/cutsbycarlos',
  '[{"delay":2,"unit":"minutes","template":"slot_fill"},{"delay":10,"unit":"minutes","template":"reactivation"},{"delay":20,"unit":"minutes","template":"cadence_reminder"},{"delay":30,"unit":"minutes","template":"soft_follow_up"}]',
  '[]'
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);


-- ════════════════════════════════════════════════════════════════════════════════
-- MIGRATION — run this block if upgrading an existing database
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Create profiles table (idempotent — already above)

-- 2. Seed a default profile from existing settings (only if profiles is empty)
INSERT INTO profiles (name, provider_name, booking_link, drip_sequence, techs)
SELECT
  COALESCE((SELECT value FROM settings WHERE key = 'business_name'), 'My Business'),
  COALESCE((SELECT value FROM settings WHERE key = 'provider_name'), ''),
  COALESCE((SELECT value FROM settings WHERE key = 'booking_link'), ''),
  COALESCE(
    (SELECT value::jsonb FROM settings WHERE key = 'drip_sequence'),
    '[{"delay":2,"unit":"minutes","template":"slot_fill"},{"delay":10,"unit":"minutes","template":"reactivation"},{"delay":20,"unit":"minutes","template":"cadence_reminder"},{"delay":30,"unit":"minutes","template":"soft_follow_up"}]'::jsonb
  ),
  COALESCE((SELECT value::jsonb FROM settings WHERE key = 'techs'), '[]'::jsonb)
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- 3. Add profile_id columns (idempotent)
ALTER TABLE clients    ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE messages   ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE drip_jobs  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Backfill existing rows to the default profile
UPDATE clients   SET profile_id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1) WHERE profile_id IS NULL;
UPDATE messages  SET profile_id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1) WHERE profile_id IS NULL;
UPDATE drip_jobs SET profile_id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1) WHERE profile_id IS NULL;

-- 5. Add demo_mode toggle to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN NOT NULL DEFAULT false;

-- 6. Add unique phone constraint per profile (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS clients_profile_phone_unique ON clients(profile_id, phone);

-- 7. Add branding + template columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url        TEXT    NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_color   TEXT    NOT NULL DEFAULT '#0F172A';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accent_color    TEXT    NOT NULL DEFAULT '#3B82F6';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS templates       JSONB;

-- 8. Opt-out, booking, and click-tracking columns on clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS opted_out         BOOLEAN   DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS booked_at         TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS link_clicked_at   TIMESTAMPTZ;

-- 9. Inbound message direction on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';
-- Allow template to be empty string for inbound messages
ALTER TABLE messages ALTER COLUMN template SET DEFAULT '';
-- Backfill existing rows (NULL direction = they were sent before this migration)
UPDATE messages SET direction = 'outbound' WHERE direction IS NULL;
