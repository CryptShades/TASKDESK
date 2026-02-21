# Taskdesk

Taskdesk is a high-performance campaign and task management system designed for Founders and SDR teams to manage complex marketing execution with realtime risk detection.

## 🚀 Tech Stack

- **Web**: Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Mobile**: Expo (React Native), Expo Router, Zustand
- **Backend/Auth**: Supabase (PostgreSQL, Realtime, RLS, Storage)
- **Infrastructure**: Vercel (Web/Crons), EAS (Mobile)
- **Testing**: Vitest, JSDOM

## 📁 Project Structure

- `apps/web`: Next.js frontend and background worker crons.
- `apps/mobile`: Expo mobile application.
- `docs/`: Production checklists and architecture notes.
- `supabase/`: Migrations and TypeScript types.

## 🛠️ Local Development

1. **Prerequisites**: Node 20+, pnpm 9+, Supabase CLI.
2. **Clone & Setup**:
   ```bash
   git clone <repo-url>
   pnpm install
   ```
3. **Environment**:
   - `cp apps/web/.env.example apps/web/.env.local`
   - `cp apps/mobile/.env.example apps/mobile/.env`
   - Populate variables with your Supabase credentials.
4. **Database**:
   ```bash
   supabase db push
   ```
5. **Run**:
   ```bash
   pnpm dev
   ```

## ⚙️ Background Engines

The risk and reminder engines run as serverless crons on Vercel.

- **Risk Engine**: `0 * * * *` (Hourly)
- **Reminders**: `0 * * * *` (Hourly)

To trigger manually for testing:
`POST /api/cron/risk-engine` with `Authorization: Bearer <CRON_SECRET>`

## 🚢 Deployment

- **Web**: Auto-deploy to Vercel on push to `main`.
- **Mobile**:
  - `pnpm --filter mobile build:preview` (EAS Build)
  - `pnpm --filter mobile submit` (App Stores)

---

© 2026 Taskdesk Team
