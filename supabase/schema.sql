-- ═══════════════════════════════════════════════════════════════════════════
-- SOUTHERN CROSS TOWING — Supabase schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Safe to re-run on an existing project: every statement is idempotent, so
-- running it again just picks up any new columns/policies (it also cleans
-- up the previous version of this schema, including moving the RLS helper
-- functions into the non-exposed `internal` schema).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Non-exposed helper schema ──────────────────────────────────────────────
-- RLS helper functions live here so they can be referenced by policies but
-- NOT invoked over the REST API (PostgREST only exposes `public`).

create schema if not exists internal;

-- anon/authenticated need USAGE + EXECUTE because RLS policies evaluate in
-- their context (e.g. the public newsletters SELECT policy calls
-- internal.can_publish_newsletter() for signed-out visitors). The functions
-- only ever read the caller's own profile row, so this is safe to grant.
grant usage on schema internal to anon, authenticated;
grant execute on all functions in schema internal to anon, authenticated;

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- User roles + granular permissions for the dashboard (RBAC).
-- `role` = trust level (executive/admin get everything);
-- the can_* flags grant individual capabilities to regular users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'user' check (role in ('user', 'executive', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists can_manage_gallery       boolean not null default false;
alter table public.profiles
  add column if not exists can_manage_staff         boolean not null default false;
alter table public.profiles
  add column if not exists can_manage_settings       boolean not null default false;
alter table public.profiles
  add column if not exists can_publish_newsletter   boolean not null default false;
alter table public.profiles
  add column if not exists can_review_applications  boolean not null default false;

-- Command staff shown on the public roster
create table if not exists public.staff_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  rank       text not null,
  division   text not null default 'Operations',
  avatar_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- On-the-job gallery
create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Global site settings (single row, id = 1)
create table if not exists public.site_settings (
  id                integer primary key default 1 check (id = 1),
  logo_url          text,
  hero_heading      text,
  hero_subtext      text,
  discord_url       text,
  recruitment_open  boolean not null default true,
  updated_at        timestamptz not null default now()
);

-- Recruitment applications (legacy — the public form now lives off-site,
-- kept so the dashboard review queue still works if it's ever wired back up)
create table if not exists public.applications (
  id                uuid primary key default gen_random_uuid(),
  roblox_username   text not null,
  discord_username  text not null,
  age               integer,
  timezone          text,
  availability      text,
  experience        text,
  why_join          text,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at        timestamptz not null default now()
);

-- Weekly newsletters / sitreps
create table if not exists public.newsletters (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  author     text,
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Audit trail for dashboard activity
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text,
  action     text not null,
  details    text,
  created_at timestamptz not null default now()
);

create index if not exists idx_applications_status on public.applications (status);
create index if not exists idx_gallery_sort on public.gallery (sort_order);
create index if not exists idx_staff_sort on public.staff_members (sort_order);

-- ─── Cleanup of the previous schema version ────────────────────────────────
-- Policies are dropped FIRST: on an existing install they reference the old
-- public.* helper functions, which can't be dropped while policies depend
-- on them. They are recreated further down against internal.* instead.

drop policy if exists "own profile select"          on public.profiles;
drop policy if exists "own profile insert"           on public.profiles;
drop policy if exists "own profile update"          on public.profiles;
drop policy if exists "exec read profiles"           on public.profiles;
drop policy if exists "exec update profiles"         on public.profiles;
drop policy if exists "public read staff"            on public.staff_members;
drop policy if exists "exec insert staff"            on public.staff_members;
drop policy if exists "exec update staff"            on public.staff_members;
drop policy if exists "exec delete staff"            on public.staff_members;
drop policy if exists "public read gallery"          on public.gallery;
drop policy if exists "exec insert gallery"          on public.gallery;
drop policy if exists "exec update gallery"          on public.gallery;
drop policy if exists "exec delete gallery"         on public.gallery;
drop policy if exists "public read settings"         on public.site_settings;
drop policy if exists "exec update settings"         on public.site_settings;
drop policy if exists "anon submit applications"     on public.applications;
drop policy if exists "exec read applications"      on public.applications;
drop policy if exists "exec review applications"    on public.applications;
drop policy if exists "public read newsletters"      on public.newsletters;
drop policy if exists "exec insert newsletters"      on public.newsletters;
drop policy if exists "exec delete newsletters"     on public.newsletters;
drop policy if exists "exec insert audit"            on public.audit_logs;
drop policy if exists "exec read audit"              on public.audit_logs;
drop policy if exists "public read site assets"      on storage.objects;
drop policy if exists "exec upload site assets"      on storage.objects;
drop policy if exists "exec update site assets"      on storage.objects;
drop policy if exists "exec delete site assets"      on storage.objects;

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.is_executive();
drop function if exists public.can_manage_gallery();
drop function if exists public.can_manage_staff();
drop function if exists public.can_manage_settings();
drop function if exists public.can_publish_newsletter();
drop function if exists public.can_review_applications();
drop function if exists public.has_dashboard_access();
drop function if exists public.handle_new_user();

-- ─── Helper functions (internal schema — not callable over the API) ─────────

-- True when the current user holds an executive/admin role (full access)
create or replace function internal.is_executive()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('executive', 'admin')
  );
$$;

-- Per-capability checks: executives/admins always pass; otherwise the
-- matching flag on the user's own profile row decides.
create or replace function internal.can_manage_gallery()
returns boolean
language sql stable security definer set search_path = public
as $$
  select internal.is_executive()
     or exists (select 1 from public.profiles where id = auth.uid() and can_manage_gallery);
$$;

create or replace function internal.can_manage_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select internal.is_executive()
     or exists (select 1 from public.profiles where id = auth.uid() and can_manage_staff);
$$;

create or replace function internal.can_manage_settings()
returns boolean
language sql stable security definer set search_path = public
as $$
  select internal.is_executive()
     or exists (select 1 from public.profiles where id = auth.uid() and can_manage_settings);
$$;

create or replace function internal.can_publish_newsletter()
returns boolean
language sql stable security definer set search_path = public
as $$
  select internal.is_executive()
     or exists (select 1 from public.profiles where id = auth.uid() and can_publish_newsletter);
$$;

create or replace function internal.can_review_applications()
returns boolean
language sql stable security definer set search_path = public
as $$
  select internal.is_executive()
     or exists (select 1 from public.profiles where id = auth.uid() and can_review_applications);
$$;

-- Any dashboard access at all (executive or at least one capability flag)
create or replace function internal.has_dashboard_access()
returns boolean
language sql stable security definer set search_path = public
as $$
  select internal.is_executive()
     or exists (
       select 1 from public.profiles
       where id = auth.uid()
         and (can_manage_gallery or can_manage_staff or can_manage_settings
              or can_publish_newsletter or can_review_applications)
     );
$$;

-- Auto-create a profile (role 'user', no perms) whenever someone signs up
create or replace function internal.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Deliberately kept in the exposed `public` schema: the app calls it via
-- supabase.rpc() from the /admin layout. Only callable by signed-in users
-- (execute revoked from anon). Note: the Supabase linter will still flag
-- "Signed-In Users Can Execute SECURITY DEFINER Function" for this one —
-- that is intentional, since the bootstrap IS a signed-in-user RPC.
create or replace function public.claim_first_executive()
returns text
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then
    return 'no-auth';
  end if;
  select count(*) into n from public.profiles where role in ('executive', 'admin');
  if n = 0 then
    update public.profiles set role = 'executive' where id = uid;
    if not found then
      insert into public.profiles (id, role) values (uid, 'executive');
    end if;
    return 'promoted';
  end if;
  return 'exists';
end;
$$;

revoke execute on function public.claim_first_executive() from anon;

grant execute on all functions in schema internal to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure internal.handle_new_user();

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.staff_members enable row level security;
alter table public.gallery       enable row level security;
alter table public.site_settings enable row level security;
alter table public.applications  enable row level security;
alter table public.newsletters   enable row level security;
alter table public.audit_logs    enable row level security;

-- profiles: users can read their own row; executives can read every row and
-- manage roles/permissions from the dashboard's Team page.
-- NOTE: there is deliberately NO "update own profile" policy — otherwise a
-- regular user could grant themselves permissions.
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id or internal.is_executive());
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "exec update profiles" on public.profiles
  for update using (internal.is_executive());

-- staff_members: public read, permitted users manage
create policy "public read staff" on public.staff_members
  for select using (true);
create policy "exec insert staff" on public.staff_members
  for insert with check (internal.can_manage_staff());
create policy "exec update staff" on public.staff_members
  for update using (internal.can_manage_staff());
create policy "exec delete staff" on public.staff_members
  for delete using (internal.can_manage_staff());

-- gallery: public read, permitted users manage (photos + captions)
create policy "public read gallery" on public.gallery
  for select using (true);
create policy "exec insert gallery" on public.gallery
  for insert with check (internal.can_manage_gallery());
create policy "exec update gallery" on public.gallery
  for update using (internal.can_manage_gallery());
create policy "exec delete gallery" on public.gallery
  for delete using (internal.can_manage_gallery());

-- site_settings: public read, permitted users update (logo, hero text, toggles)
create policy "public read settings" on public.site_settings
  for select using (true);
create policy "exec update settings" on public.site_settings
  for update using (internal.can_manage_settings());

-- applications: read/review restricted to permitted users. There is
-- deliberately NO public INSERT policy — the application form now lives
-- off-site (melonly.xyz), so nothing should be able to write here.
create policy "exec read applications" on public.applications
  for select using (internal.can_review_applications());
create policy "exec review applications" on public.applications
  for update using (internal.can_review_applications());

-- newsletters: public reads published posts, permitted users manage all
create policy "public read newsletters" on public.newsletters
  for select using (published = true or internal.can_publish_newsletter());
create policy "exec insert newsletters" on public.newsletters
  for insert with check (internal.can_publish_newsletter());
create policy "exec delete newsletters" on public.newsletters
  for delete using (internal.can_publish_newsletter());

-- audit_logs: any dashboard user inserts + reads
create policy "exec insert audit" on public.audit_logs
  for insert with check (internal.has_dashboard_access());
create policy "exec read audit" on public.audit_logs
  for select using (internal.has_dashboard_access());

-- ─── Storage bucket (avatars, gallery, logos) ───────────────────────────────

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- The bucket is PUBLIC, so object URLs (…/storage/v1/object/public/…) are
-- served without any SELECT policy — that's all the public site uses.
-- Deliberately NO broad SELECT policy: it would let anyone list every file
-- in the bucket. Only dashboard users can write.
create policy "exec upload site assets" on storage.objects
  for insert with check (bucket_id = 'site-assets' and internal.has_dashboard_access());
create policy "exec update site assets" on storage.objects
  for update using (bucket_id = 'site-assets' and internal.has_dashboard_access());
create policy "exec delete site assets" on storage.objects
  for delete using (bucket_id = 'site-assets' and internal.has_dashboard_access());

-- ─── Seed data ──────────────────────────────────────────────────────────────

insert into public.site_settings (id, hero_heading, hero_subtext, recruitment_open)
values (
  1,
  'Keeping New South Wales Moving',
  'Southern Cross Towing is the state''s virtual heavy recovery and incident management crew — winch-outs, rollovers, flatbed hauls and full scene control, around the clock.',
  true
)
on conflict (id) do nothing;

-- Only seed the roster on a brand-new install (re-runs are no-ops)
insert into public.staff_members (name, rank, division, sort_order)
select seed.name, seed.rank, seed.division, seed.sort_order
from (
  values
    ('LilJ_765',      'Chief Executive',          'Executive',  1),
    ('williamlmnopq', 'Chief Operations Officer',  'Operations', 2),
    ('Natalspy1234',  'Chief Technologies Officer','Technology', 3),
    ('Zandarhip',     'Executive',                'Executive',  4),
    ('money_406',     'Assistant Executive',      'Executive',  5)
) as seed(name, rank, division, sort_order)
where not exists (select 1 from public.staff_members);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. Next steps:
--
-- 1. Authentication → Sign In / Providers → Email: disable "Confirm email"
--    (recommended for this site — account creation then signs you straight
--    in). See README.md → "Auth troubleshooting" if you prefer keeping it.
-- 2. Optional: enable the Discord provider (README has the walkthrough).
-- 3. Sign in via /login — the FIRST account is auto-promoted to executive.
-- 4. Staff create their own accounts at /login ("Create account"), then an
--    executive grants permissions from the dashboard → Team & Permissions:
--      • Manage Gallery       — swap gallery photos + edit their captions
--      • Manage Staff         — change command names, photos and ranks
--      • Manage Settings      — change the logo + hero text
--      • Publish Newsletters  — post sitreps
--      • Review Applications  — see the (legacy) application queue
-- ═══════════════════════════════════════════════════════════════════════════
