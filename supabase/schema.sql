-- ═══════════════════════════════════════════════════════════════════════════
-- SOUTHERN CROSS TOWING — Supabase schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- User roles for the executive dashboard (RBAC)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'user' check (role in ('user', 'executive', 'admin')),
  created_at timestamptz not null default now()
);

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

-- Recruitment applications submitted from /apply
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

-- ─── Helper functions ───────────────────────────────────────────────────────

-- True when the current user holds an executive/admin role
create or replace function public.is_executive()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('executive', 'admin')
  );
$$;

-- Auto-create a profile (role 'user') whenever someone signs up
create or replace function public.handle_new_user()
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bootstrap: the FIRST person to sign in becomes executive automatically.
-- Callable by any authenticated user; only promotes when no executive exists.
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

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.staff_members enable row level security;
alter table public.gallery       enable row level security;
alter table public.site_settings enable row level security;
alter table public.applications  enable row level security;
alter table public.newsletters   enable row level security;
alter table public.audit_logs    enable row level security;

-- profiles
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "exec read profiles" on public.profiles;
create policy "exec read profiles" on public.profiles
  for select using (public.is_executive());
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

-- staff_members: public read, executive manage
drop policy if exists "public read staff" on public.staff_members;
create policy "public read staff" on public.staff_members
  for select using (true);
drop policy if exists "exec insert staff" on public.staff_members;
create policy "exec insert staff" on public.staff_members
  for insert with check (public.is_executive());
drop policy if exists "exec update staff" on public.staff_members;
create policy "exec update staff" on public.staff_members
  for update using (public.is_executive());
drop policy if exists "exec delete staff" on public.staff_members;
create policy "exec delete staff" on public.staff_members
  for delete using (public.is_executive());

-- gallery: public read, executive manage
drop policy if exists "public read gallery" on public.gallery;
create policy "public read gallery" on public.gallery
  for select using (true);
drop policy if exists "exec insert gallery" on public.gallery;
create policy "exec insert gallery" on public.gallery
  for insert with check (public.is_executive());
drop policy if exists "exec update gallery" on public.gallery;
create policy "exec update gallery" on public.gallery
  for update using (public.is_executive());
drop policy if exists "exec delete gallery" on public.gallery;
create policy "exec delete gallery" on public.gallery
  for delete using (public.is_executive());

-- site_settings: public read, executive update
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings
  for select using (true);
drop policy if exists "exec update settings" on public.site_settings;
create policy "exec update settings" on public.site_settings
  for update using (public.is_executive());

-- applications: anyone may apply, only executives may read/review
drop policy if exists "anon submit applications" on public.applications;
create policy "anon submit applications" on public.applications
  for insert with check (true);
drop policy if exists "exec read applications" on public.applications;
create policy "exec read applications" on public.applications
  for select using (public.is_executive());
drop policy if exists "exec review applications" on public.applications;
create policy "exec review applications" on public.applications
  for update using (public.is_executive());

-- newsletters: public reads published posts, executives manage all
drop policy if exists "public read newsletters" on public.newsletters;
create policy "public read newsletters" on public.newsletters
  for select using (published = true or public.is_executive());
drop policy if exists "exec insert newsletters" on public.newsletters;
create policy "exec insert newsletters" on public.newsletters
  for insert with check (public.is_executive());
drop policy if exists "exec delete newsletters" on public.newsletters;
create policy "exec delete newsletters" on public.newsletters
  for delete using (public.is_executive());

-- audit_logs: executives insert + read
drop policy if exists "exec insert audit" on public.audit_logs;
create policy "exec insert audit" on public.audit_logs
  for insert with check (public.is_executive());
drop policy if exists "exec read audit" on public.audit_logs;
create policy "exec read audit" on public.audit_logs
  for select using (public.is_executive());

-- ─── Storage bucket (avatars, gallery, logos) ───────────────────────────────

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "public read site assets" on storage.objects;
create policy "public read site assets" on storage.objects
  for select using (bucket_id = 'site-assets');
drop policy if exists "exec upload site assets" on storage.objects;
create policy "exec upload site assets" on storage.objects
  for insert with check (bucket_id = 'site-assets' and public.is_executive());
drop policy if exists "exec update site assets" on storage.objects;
create policy "exec update site assets" on storage.objects
  for update using (bucket_id = 'site-assets' and public.is_executive());
drop policy if exists "exec delete site assets" on storage.objects;
create policy "exec delete site assets" on storage.objects
  for delete using (bucket_id = 'site-assets' and public.is_executive());

-- ─── Seed data ──────────────────────────────────────────────────────────────

insert into public.site_settings (id, hero_heading, hero_subtext, recruitment_open)
values (
  1,
  'Keeping New South Wales Moving',
  'Southern Cross Towing is the state''s virtual heavy recovery and incident management crew — winch-outs, rollovers, flatbed hauls and full scene control, around the clock.',
  true
)
on conflict (id) do nothing;

insert into public.staff_members (name, rank, division, sort_order) values
  ('Lil_J765',      'Chief Executive',            'Executive',  1),
  ('WilliamNOPQ',   'Chief Operations Officer',   'Operations', 2),
  ('Shawn',         'Staff Development Manager',   'Development',3),
  ('Money_40',      'Operations Manager',         'Operations', 4),
  ('Zandarhip',     'Area of Operations Manager',  'Operations', 5),
  ('Natalspy1234',  'Tech Operations Manager',    'Technology', 6),
  ('N5WP0L1C3',     'Fleet Manager',              'Fleet',      7);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. Next steps:
--
-- 1. Authentication → Providers: enable Email (and optionally Discord).
-- 2. Sign in via /login — the FIRST account is auto-promoted to executive.
-- 3. Promote additional executives anytime:
--      update public.profiles set role = 'executive'
--      where email = 'their@email.com';
-- ═══════════════════════════════════════════════════════════════════════════
