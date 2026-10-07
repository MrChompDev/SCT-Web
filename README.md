# Southern Cross Towing — Crew Website & Command Dashboard

Full-stack site for the Southern Cross Towing roleplay crew: a public
marketing site (hero, services bento, command roster, on-the-job gallery,
applications, weekly sitreps) plus a protected dashboard for managing
content — backed by Supabase and wired to Discord webhooks.

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

## Phase 2 — connect Supabase (enables login, dashboard, dynamic content)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the entire `supabase/schema.sql` file.
   This creates all tables, the granular permission columns, RLS policies,
   the `site-assets` storage bucket, and seeds the settings row + command
   roster. **Safe to re-run** — every statement is idempotent.
3. **Authentication → Providers**: enable **Email**. Optionally enable
   **Discord** (paste a client ID/secret from
   [discord.com/developers](https://discord.com/developers)) for the
   "Continue with Discord" button.
4. **Project Settings → API**: copy the project URL, the anon key (newer
   projects call it the **publishable key** — either env name works), and
   the **service_role key** into `.env.local` (copy `.env.example` first):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # required for the newsletter webhook
```

5. Restart `npm run dev`, go to `/login`, and use **Create account** with
   email/password. Passwords are hashed with bcrypt by Supabase Auth —
   plain-text passwords never touch the database.
   **The first account created is automatically promoted to executive** —
   the dashboard handles the rest.

## Auth troubleshooting

### "Email link is invalid or has expired" (`otp_expired`)

Supabase confirmation links are **single-use**: requesting a new email (or
signing up again with the same address) invalidates every older link, and
each link only works once. If you get this error, click the **newest** email
— or delete the half-created account in Supabase → Authentication → Users
and sign up fresh.

**Recommended for this site:** turn confirmation off entirely —
Supabase → **Authentication → Sign In / Providers → Email → "Confirm
email" OFF**. Account creation then signs you straight in (no email
round-trip at all), which is what the app is tuned for. If you keep it
enabled, also make sure **Authentication → URL Configuration → Site URL**
matches where you actually use the site (`http://localhost:3000` for dev,
your real domain in production).

### Discord login: "Unsupported provider: provider is not enabled"

The Discord button is hidden until the provider is set up. To enable it:

1. Create an app at [discord.com/developers](https://discord.com/developers)
   → your app → **OAuth2**.
2. Under **Redirects**, add:
   `https://vlxwhqhjfwntaqmmorny.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**.
4. Supabase → **Authentication → Providers → Discord** → enable, paste both
   values, save.
5. Paste the same values into `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
   in `.env.local` and restart the dev server — the "Continue with Discord"
   button appears automatically.

## Permissions — who can change what

Staff create their own accounts at `/login`, then an executive grants
capabilities from **Dashboard → Team & Permissions**. Each permission is
enforced twice: in the UI *and* by the database (row-level security), so
granting/revoking takes effect immediately.

| Permission             | What it lets them do                                     |
| ---------------------- | -------------------------------------------------------- |
| **Manage Gallery**     | Swap gallery photos + edit the captions under them       |
| **Manage Staff**      | Change command members' names, photos and ranks           |
| **Manage Settings**   | Change the site logo, hero heading/subtext, toggles      |
| **Publish Newsletters** | Post sitreps to the site + Discord                      |
| **Review Applications** | See/approve/deny the (legacy) application queue         |

Roles: `user` (only what they're granted) → `executive` / `admin`
(everything, including managing the team). The first account bootstraps
as executive automatically.

## Applications — melonly.xyz form

Every "Apply" button on the site points at
`https://melonly.xyz/forms/7483492866371620864`, and the old `/apply` URL
permanently redirects there (for bookmarks). To change the form later,
edit `APPLY_FORM_URL` in `src/lib/constants.ts` — every link updates.

## Phase 4 — Discord webhooks (outbound)

In Discord: **Server Settings → Integrations → Webhooks**, create one per
channel and paste the URLs into `.env.local`:

| Env var                        | Channel          | Fires when                                          |
| ------------------------------ | ---------------- | --------------------------------------------------- |
| `DISCORD_WEBHOOK_ANNOUNCEMENTS`| `#announcements` | An executive publishes a sitrep (optional `@everyone`)|
| `DISCORD_WEBHOOK_ADMIN_LOGS`   | `#admin-logs`    | Staff/gallery/settings/permission changes (silent audit) |
| `DISCORD_WEBHOOK_APPLICATIONS` | `#applications`  | Legacy — only if applications are wired back up      |

Webhook URLs are only ever used server-side (`src/lib/discord.ts`) — they
never reach the browser.

## Newsletter auto-posting (inbound webhook)

Staff can auto-post sitreps to the website from anywhere — a Discord bot,
Zapier/Make automation, a cron script, or plain curl — via:

```
POST https://your-domain.com/api/webhooks/newsletters
Authorization: Bearer <NEWSLETTER_WEBHOOK_SECRET>
Content-Type: application/json

{ "title": "Weekly Sitrep", "body": "Everything going on this week…", "author": "Command Team" }
```

- The secret lives in `NEWSLETTER_WEBHOOK_SECRET` (generate with
  `openssl rand -hex 24`). Send it as a `Bearer` token, an
  `x-webhook-secret` header, or `?secret=` query param.
- The body text also accepts `content`, `text` or `description` keys — and
  a forwarded Discord-webhook shape (`{ embeds: [{ title, description }] }`)
  works as-is, so automation platforms need no transform step.
- Optional flags: `"announce": true` also fires the `#announcements`
  Discord webhook (`"pingEveryone": true` adds the ping);
  `"author": "…"` sets the byline.
- Requires `SUPABASE_SERVICE_ROLE_KEY` to be set (the webhook has no user
  session, so it writes through the service role).

Example:

```bash
curl -X POST http://localhost:3000/api/webhooks/newsletters \
  -H "Authorization: Bearer $NEWSLETTER_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"title":"Weekly Sitrep — Fleet Expansion","body":"Two new wreckers join the rotation this week…","announce":true}'
```

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
│   ├── (site)/            public pages — home, /apply (→ melonly redirect), /newsletter
│   ├── login/             staff sign-in + create account (email + Discord OAuth)
│   ├── admin/             protected dashboard (permission-checked layout)
│   │   ├── staff/         command roster CRUD + avatar uploads
│   │   ├── gallery/       drag-and-drop screenshot + caption manager
│   │   ├── applications/  legacy review queue: approve / deny with audit trail
│   │   ├── newsletter/    sitrep editor → site + Discord simultaneously
│   │   ├── settings/      logo, hero text, recruitment toggle, Discord URL
│   │   └── team/           grant/revoke per-user permissions + roles
│   └── api/
│       ├── webhooks/newsletters/  inbound auto-post webhook (secret-auth)
│       ├── auth/callback/ OAuth code exchange
│       └── admin/actions/ permission-verified webhook triggers + audit log
├── components/            Navbar, Footer, sections (Hero, ServicesBento,
│                          StaffGrid, GalleryGrid + lightbox, …), admin UI
├── lib/
│   ├── supabase.ts        browser / server / service-role clients
│   ├── auth.ts            server-side RBAC helpers (permsFor, getProfile)
│   ├── constants.ts       APPLY_FORM_URL — the one place to change the form
│   ├── data.ts            DB getters with static fallbacks for pre-DB demo
│   └── discord.ts         embeds for the outbound webhook triggers
├── middleware.ts  (root)  session refresh + /admin auth guard
supabase/schema.sql        tables, permission columns, RLS, triggers, seed
```

### Behaviour notes

- **Static fallbacks:** until Supabase is connected (or tables are empty),
  the public site renders the starter roster/gallery. Anything managed in
  the dashboard replaces it.
- **Uploads** are auto-resized to WebP in the browser before hitting the
  `site-assets` bucket.
- **RBAC:** the `/admin` layout verifies the signed-in profile has at least
  one permission server-side on every request; each page re-checks its own
  permission, and the database enforces the same rules via RLS functions
  (`can_manage_gallery()` etc. in `supabase/schema.sql`).
- **Password hashing:** handled entirely by Supabase Auth (bcrypt) — the
  app never stores or sees plaintext passwords.
