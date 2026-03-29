# Reactivation Demo — Next.js

SMS reactivation dashboard for recurring-service businesses (barbershops, salons). Hosted on Vercel — no local server needed.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind 4** + shadcn/ui
- **Supabase** (hosted Postgres)
- **OpenPhone (Quo)** for SMS, Twilio dormant
- **Vercel Cron** for scheduled drip messages

---

## First-Time Setup

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. In the SQL Editor, run the full contents of `supabase-schema.sql`
3. Copy your credentials from **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (under Service Role — keep secret)

### 2. Add credentials to .env.local

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The OpenPhone and Twilio keys are already populated.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — will prompt for project setup)
vercel

# Add all env vars from .env.local to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENPHONE_API_KEY
vercel env add OPENPHONE_FROM_NUMBER
vercel env add SMS_PROVIDER
vercel env add DEMO_MODE
# Vercel generates CRON_SECRET automatically — no need to add manually

# Deploy to production
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys.

### Custom domain

In the Vercel project dashboard → **Domains** → add your domain.

---

## Before a Demo

1. Open **Settings** (header) → update business name, provider name, booking link if needed
2. Make sure `DEMO_MODE=true` — drip fires in minutes
3. Import clients: click **Import** → drop `data/sample.csv` (8 barbershop clients, 4 overdue)
4. Demo flow:
   - **Send Now:** Select clients → pick template → "Send Now" — all phones buzz
   - **Start Drip:** Select clients → "Start Drip" — fires at T+2, T+10, T+20, T+30 min

---

## Switching to Production

Set `DEMO_MODE=false` in Vercel env vars → redeploy. Drip intervals become days.

---

## File Structure

```
src/
├── app/
│   ├── page.tsx              — Dashboard (main UI)
│   ├── layout.tsx
│   └── api/
│       ├── clients/          — GET list, POST add, [id] PUT/DELETE
│       ├── blast/            — POST: immediate send
│       ├── drip/             — POST: schedule, process/ called by Cron
│       ├── import/           — POST: CSV/vCard upload
│       ├── messages/         — GET: recent log
│       ├── settings/         — GET + PUT
│       ├── stats/            — GET: live counts
│       └── clear/            — POST: demo reset
├── components/
│   ├── dashboard/            — StatsBar, ClientTable, ActionBar, DripPanel, MessageLog
│   ├── modals/               — AddClient, EditClient, Import, Settings
│   └── ui/                   — shadcn primitives (button, badge, card, dialog, etc.)
└── lib/
    ├── types.ts              — TypeScript interfaces
    ├── utils.ts              — cn(), normalizePhone(), daysSince(), etc.
    ├── config.ts             — DEMO_MODE, TEMPLATES, DEFAULT_DRIP_SEQUENCE
    ├── supabase.ts           — Server-side Supabase client
    ├── sms.ts                — OpenPhone + Twilio send functions
    └── ingest.ts             — CSV + vCard parsers
```

