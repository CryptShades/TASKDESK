# 🚀 Taskdesk — How To Run This Project (From Zero)

> Think of this guide like a recipe. Follow every step in order and you'll have the app running. Skip a step and things break — just like skipping an ingredient in a cake.

---

## 🧠 What Is This App?

**Taskdesk** is a tool that helps teams manage tasks and campaigns. It has:
- A **website** (built with Next.js) that you open in a browser
- A **mobile app** (built with Expo) that you run on a phone
- A **database** (Supabase / PostgreSQL) that stores all the data

---

## 🛒 Step 0 — Things You Need To Install First

These are like LEGO sets you need to buy before you can build anything.

### 1. Node.js (version 20 or newer)
Node.js is what runs JavaScript on your computer.

- Go to [https://nodejs.org](https://nodejs.org) and download the **LTS** version
- After installing, open your Terminal and check it works:
```bash
node --version
# Should print something like: v20.x.x or v24.x.x
```

### 2. pnpm (version 9)
pnpm is the tool that downloads and manages all the code libraries this project needs. Think of it like an App Store for code pieces.

```bash
npm install -g pnpm@9
```

Check it works:
```bash
pnpm --version
# Should print: 9.x.x
```

### 3. Git
Git is how you download the project code from the internet.

- On Mac: `xcode-select --install` (runs automatically when you use git for the first time)
- On Windows: Download from [https://git-scm.com](https://git-scm.com)

Check it works:
```bash
git --version
```

### 4. Supabase CLI
Supabase is the online database service. The CLI lets you push your database tables to it.

```bash
npm install -g supabase
```

Check it works:
```bash
supabase --version
```

### 5. A Supabase Account (Free)
- Go to [https://supabase.com](https://supabase.com) and sign up for free
- Click **New Project**, give it a name like `taskdesk`, choose a region close to you, and set a database password
- **Save your database password somewhere safe** — you'll need it later

---

## 📦 Step 1 — Download The Project

Open your Terminal (on Mac: press `Cmd + Space`, type "Terminal", press Enter).

```bash
# Download the project code to your computer
git clone <repo-url>

# Go into the project folder
cd Taskdesk
```

> Replace `<repo-url>` with the actual GitHub URL of this repository.

---

## 📚 Step 2 — Install All Code Libraries

This one command downloads all the code pieces that the project needs. It reads the `package.json` files and grabs everything automatically.

```bash
pnpm install
```

You'll see a lot of text scrolling. That's normal — it's downloading hundreds of small code pieces. Wait for it to finish (usually 1–2 minutes).

---

## 🔑 Step 3 — Set Up Your Secret Keys (Environment Variables)

Your app needs secret keys to talk to Supabase (the database). These are like passwords — never share them publicly.

### 3a. Copy the example file for the website

```bash
cp apps/web/.env.example apps/web/.env.local
```

This creates a new file called `.env.local`. Now open it:

```bash
open apps/web/.env.local
# On Windows: notepad apps\web\.env.local
```

You'll see three lines that look like this:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where do these values come from?**

1. Go to your Supabase project dashboard at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click your project → click **Settings** in the left sidebar → click **API**
3. You'll see:
   - **Project URL** → paste this as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → paste this as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret** key → paste this as `SUPABASE_SERVICE_ROLE_KEY`

Also add a secret for the background jobs (you can make up any random string):

```
CRON_SECRET=any-random-string-you-make-up-like-abc123xyz
```

Your finished file should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CRON_SECRET=mysupersecretcronkey
```

### 3b. Copy the example file for the mobile app

```bash
cp apps/web/.env.example apps/mobile/.env
```

Fill in `apps/mobile/.env` with the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values from above.

---

## 🗄️ Step 4 — Set Up The Database

Your Supabase project is empty right now. You need to push your database tables to it.

### Log into Supabase from your terminal

```bash
supabase login
```

A browser window will open and ask you to log in. Once done, come back to the terminal.

### Link your project

```bash
# Replace YOUR_PROJECT_REF with the value from your Supabase URL
# e.g. if your URL is https://abcdefgh.supabase.co, then ref = abcdefgh
supabase link --project-ref YOUR_PROJECT_REF
```

It will ask for your **database password** — this is the one you saved in Step 0.

### Push the database tables

```bash
supabase db push --db-url "postgresql://postgres:YOUR_DATABASE_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

> Replace `YOUR_DATABASE_PASSWORD` and `YOUR_PROJECT_REF` with your actual values.

This creates all the tables (users, campaigns, tasks, etc.) in your database.

---

## ▶️ Step 5 — Start The Website

```bash
pnpm dev
```

You'll see something like:

```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
```

Open your browser and go to **http://localhost:3000** — you should see the Taskdesk app!

> To stop the server, press `Ctrl + C` in the terminal.

---

## 📱 Step 6 — Run The Mobile App (Optional)

You need one extra tool installed:

```bash
npm install -g expo-cli
```

Then start the mobile app:

```bash
pnpm dev:mobile
```

A QR code will appear in the terminal. To see the app on your phone:

1. Download the **Expo Go** app from the App Store (iPhone) or Play Store (Android)
2. Open Expo Go and scan the QR code
3. The Taskdesk mobile app will load on your phone

---

## ✅ Step 7 — Run The Tests

To make sure everything is working correctly, run the tests:

```bash
# Type-check all code (checks for mistakes, like spell-check but for code)
pnpm typecheck

# Run unit tests for the web app
pnpm --filter web test
```

All tests should pass with no errors.

---

## 🔧 Step 8 — Trigger Background Jobs Manually (Optional)

The app has two background workers that run automatically every hour:

| Worker | What It Does |
|--------|-------------|
| **Risk Engine** | Checks all tasks and marks ones that are late or stuck as "at risk" |
| **Reminder Engine** | Sends notifications to people whose tasks are due soon |

To trigger them manually while developing (make sure your website is running first):

```bash
# Trigger the Risk Engine
curl -X POST http://localhost:3000/api/cron/risk-engine \
  -H "Authorization: Bearer mysupersecretcronkey"

# Trigger the Reminder Engine
curl -X POST http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer mysupersecretcronkey"
```

> Replace `mysupersecretcronkey` with whatever you put as `CRON_SECRET` in Step 3.

---

## 🚢 Step 9 — Deploy To The Internet (When You're Ready)

### Website → Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up
2. Click **Add New Project** → connect your GitHub repo
3. Set the **Root Directory** to `apps/web`
4. Add all your environment variables from `apps/web/.env.local` in the Vercel dashboard under **Settings → Environment Variables**
5. Click **Deploy** — Vercel will give you a live URL like `https://taskdesk.vercel.app`

The background cron jobs (`vercel.json` already configures them) will run automatically every hour on Vercel.

### Mobile App → App Stores

Install EAS CLI first:

```bash
npm install -g eas-cli
eas login
```

Build a preview version (for testing):

```bash
pnpm --filter mobile build:preview
```

Submit to App Stores (when you're ready for production):

```bash
pnpm --filter mobile submit
```

---

## 🆘 Troubleshooting — Things That Might Go Wrong

| Problem | What It Means | Fix |
|---------|--------------|-----|
| `command not found: pnpm` | pnpm isn't installed | Run `npm install -g pnpm@9` |
| `command not found: supabase` | Supabase CLI isn't installed | Run `npm install -g supabase` |
| `Cannot find module` errors | Dependencies aren't installed | Run `pnpm install` again |
| `Invalid API key` on the website | Wrong Supabase keys in `.env.local` | Double-check Step 3 |
| Port 3000 already in use | Something else is using that port | Run `pnpm dev -- -p 3001` to use port 3001 |
| Database errors on first load | Tables not created yet | Repeat Step 4 |
| `ENOENT .env.local not found` | You didn't copy the env file | Run the `cp` command from Step 3 |

---

## 📂 Project Map — What Each Folder Does

```
Taskdesk/
├── apps/
│   ├── web/          ← The website (Next.js)
│   │   ├── src/
│   │   │   ├── app/          ← Pages (what you see in the browser)
│   │   │   ├── components/   ← Reusable UI pieces (buttons, tables, etc.)
│   │   │   ├── services/     ← Business logic (how data is saved/loaded)
│   │   │   └── workers/      ← Background jobs (risk engine, reminders)
│   │   └── supabase/
│   │       └── migrations/   ← Database table definitions (SQL files)
│   └── mobile/       ← The phone app (Expo / React Native)
│       ├── app/              ← Screens
│       └── src/
│           └── components/   ← Reusable phone UI pieces
├── packages/
│   ├── types/        ← Shared TypeScript types (used by both web and mobile)
│   ├── utils/        ← Shared helper functions
│   └── config/       ← Shared config (ESLint, TypeScript, Tailwind)
└── docs/             ← Checklists and architecture notes
```

---

## 🎯 Quick Reference — Commands You'll Use Every Day

```bash
pnpm install           # Install / update dependencies
pnpm dev               # Start the website at http://localhost:3000
pnpm dev:mobile        # Start the mobile app
pnpm typecheck         # Check for TypeScript errors
pnpm --filter web test # Run web tests
pnpm lint              # Check for code style issues
```

---

> If you're still stuck, read the error message carefully — it usually tells you exactly what's wrong and on which line. Google the error message if you don't understand it. You've got this! 💪
