# Flax Ops Portal

Image review portal for Flax Healthy Living outlet operations.

## Stack
- Next.js 14 (App Router)
- Supabase (flags, comments, image metadata)
- Backblaze B2 (image storage)
- Cloudflare Pages (hosting at ops.flaxfoods.in)

## Setup

### 1. Clone and install
```bash
git clone https://github.com/gurmeetflax/flaximages
cd flaximages
npm install
```

### 2. Environment variables
Copy `.env.local` and fill in your values:
```bash
cp .env.local.example .env.local
```

Fill in:
- `B2_KEY_ID` — Backblaze App Key ID
- `B2_APP_KEY` — Backblaze Application Key
- `SLACK_BOT_TOKEN` — Slack bot token (xoxb-...)
- `PORTAL_PASSWORD` — shared password for managers (default: flax2026)

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Cloudflare Pages

1. Go to dash.cloudflare.com → Pages → Create a project
2. Connect GitHub → select `flaximages` repo
3. Build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Build output: `.next`
4. Add environment variables (same as .env.local)
5. Deploy

### 5. Add custom domain
1. Cloudflare Pages → your project → Custom domains
2. Add `ops.flaxfoods.in`
3. Done — Cloudflare handles the DNS automatically since flaxfoods.in is already on Cloudflare

## Features
- Image grid with OK/Flag buttons per image
- Comment required when flagging
- KPI bar per channel showing outlet submissions
- Wastage view — outlet-wise image grouping
- Flagged view — all flagged images with comments
- Outlets dashboard — scores + flagged images per outlet
- Password-protected login

## Channels monitored
- dispatchimages
- wastage
- deepcleaning
- outletchecklists
- naitems
