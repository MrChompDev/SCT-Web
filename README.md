# Southern Cross Towing — Crew Website & Command Dashboard

Full-stack site for the Southern Cross Towing roleplay crew: a public
marketing site (hero, services bento, command roster, on-the-job gallery,
applications, weekly sitreps) plus a protected executive dashboard for
managing content — backed by Supabase and wired to Discord webhooks.

Built with **Next.js 14 (App Router) · Tailwind CSS · Supabase · lucide-react**.

---

## Quick start (no database yet)

```bash
npm install
npm run dev
```

The public site runs immediately with the bundled starter content (your
optimised screenshots live in `public/images/`, the command roster in
`src/lib/data.ts`). The `/admin` dashboard shows a setup notice until
Supabase is connected.

## Phase 2 — connect Supabase (enables dashboard, forms, dynamic content)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the entire `supabase/schema.sql` file.
   This creates all tables, RLS policies, the `site-assets` storage bucket,
   and seeds the settings row + command roster.
3. **Authentication → Providers**: enable **Email**. Optionally enable
   **Discord** (paste a client ID/secret from
   [discord.com/developers](https://discord.com/developers)) for the
   "Continue with Discord" button.
4. **Project Settings → API**: copy the project URL and the `anon` key into
   `.env.local` (copy `.env.example` first):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # optional, bypasses RLS server-side
```

5. Restart `npm run dev`, go to `/login`, and sign up with email/password.
   **The first account to sign in is automatically promoted to executive** —
   the dashboard handles the rest (RBAC: `user` → denied, `executive`/`admin` → access).

Promote additional executives anytime via SQL:

```sql
update public.profiles set role = 'executive' where email = 'their@email.com';
```

## Phase 4 — Discord webhooks

In Discord: **Server Settings → Integrations → Webhooks**, create one per
channel and paste the URLs into `.env.local`:

| Env var                 | Channel        | Fires when                                        |
| ----------------------- | -------------- | ------------------------------------------------- |
| `DISCORD_WEBHOOK_APPLICATIONS` | `#applications` | A crew hopeful submits `/apply` (rich embed with all answers) |
| `DISCORD_WEBHOOK_ANNOUNCEMENTS` | `#announcements` | An executive publishes a sitrep (optional `@everyone` ping) |
| `DISCORD_WEBHOOK_ADMIN_LOGS`   | `#admin-logs`   | Staff/gallery/settings changes, application decisions (silent audit) |

Webhook URLs are only ever used server-side (`src/lib/discord.ts`) — they
never reach the browser.

## Phase 5 — deploy

1. Push to GitHub (the original `Assets/` folder is git-ignored; optimised
   images ship in `public/images/`).
2. Import the repo on [Vercel](https://vercel.com) — zero config needed.
3. Add all the environment variables from `.env.example` in
   **Project → Settings → Environment Variables**, including
   `NEXT_PUBLIC_SITE_URL=https://your-domain.com`.
4. Point your domain's DNS at Vercel, then set the custom domain in the
   project settings.

---

## What's where

```
src/
├── app/
│   ├── (site)/            public pages — home, /apply, /newsletter
│   ├── login/             executive sign-in (email + Discord OAuth)
│   ├── admin/             protected dashboard (RBAC-checked layout)
│   │   ├── staff/         command roster CRUD + avatar uploads
│   │   ├── gallery/       drag-and-drop screenshot manager
│   │   ├── applications/  review: approve / deny with audit trail
│   │   ├── newsletter/    sitrep editor → site + Discord simultaneously
│   │   └── settings/      logo, hero text, recruitment toggle, Discord URL
│   └── api/
│       ├── apply/         public POST → DB insert + #applications webhook
│       ├── auth/callback/ OAuth code exchange
│       └── admin/actions/ executive-verified webhook triggers + audit log
├── components/            Navbar, Footer, sections (Hero, ServicesBento,
│                          StaffGrid, GalleryGrid + lightbox, …), admin UI
├── lib/
│   ├── supabase.ts        browser / server / service-role clients
│   ├── data.ts            DB getters with static fallbacks for pre-DB demo
│   ├── discord.ts         embeds for the three webhook triggers
│   └── roblox.ts          optional Roblox headshot lookup (apply success)
├── middleware.ts  (root)  session refresh + /admin auth guard
supabase/schema.sql        tables, RLS, storage bucket, triggers, seed
```

### Behaviour notes

- **Static fallbacks:** until Supabase is connected (or tables are empty),
  the public site renders the starter roster/gallery. Anything you manage in
  the dashboard replaces it.
- **Uploads** are auto-resized to WebP in the browser before hitting the
  `site-assets` bucket.
- **RBAC:** the `/admin` layout verifies a `profiles.role` of
  `executive`/`admin` server-side on every request — middleware handles the
  session and the unauthenticated redirect.
- **Apply form:** works in four modes — DB + webhook, DB only, webhook only,
  or demo (nothing configured) — and tells the user honestly which happened.
