# Whop Membership Dashboard

Internal dashboard for subscription metrics and membership/payment management, scoped to a configurable date range. All data flows through the [Whop REST API v1](https://docs.whop.com/developer/api/getting-started) — no Whop admin UI dependency.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Add your credentials to `.env.local`:

```env
WHOP_API_KEY=your_company_api_key
WHOP_COMPANY_ID=biz_xxxxxxxxxxxxxx
```

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required API permissions

| Permission | Used for |
|---|---|
| `stats:read` | MRR, total volume |
| `member:basic:read` | Membership list |
| `member:email:read` | User emails |
| `payment:basic:read` | Payment feed |
| `plan:basic:read` | Plan details |
| `access_pass:basic:read` | Product details |
| `member:phone:read` | Payment member details |
| `promo_code:basic:read` | Promo codes on payments |

## Features

- **Date range selector** — Last 7/30/90 days or custom range; applies to all metrics and tables
- **KPI cards** — MRR, total volume, new signups, churn (+ optional churn rate)
- **Membership table** — Paginated list with pause, resume, cancel, uncancel actions
- **Payment feed** — Paginated paid payments with full/partial refund flow
- **Error handling** — 401/403 banners, rate-limit retries (server-side), toast notifications

## Architecture

- **Next.js App Router** with server-side API route handlers
- API key never sent to the browser — all Whop calls go through `/api/*` routes
- **Tailwind CSS**, **TanStack Table** patterns, **react-day-picker** for custom ranges

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
