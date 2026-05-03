# EastFork Go-Live Tracker

A shared issue tracker for EastFork's ERP go-live, built with Next.js 15, Tailwind CSS, and Supabase. No login required — share the link and anyone can log or update issues.

---

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In your project dashboard, open **SQL Editor**.
3. Paste the contents of `supabase-migration.sql` and click **Run**.
4. Navigate to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 4. Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Option B — Vercel Dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

---

## Customization

To update the team member list, edit the constant at the top of `app/page.tsx`:

```ts
const STELLAR_TEAM = ['Arline', 'Nicole']
```
