-- ============================================
-- Modulor Handbook v2 — Supabase Database Setup
-- ============================================
-- Run this in Supabase SQL Editor (supabase.com > project > SQL Editor)
-- Prerequisites:
--   1. Create Supabase project
--   2. Enable Google OAuth in Auth > Providers > Google
--   3. Add redirect URLs in Auth > URL Configuration:
--      - https://modulor-team.vercel.app
--      - https://modulor-leadership.vercel.app
-- ============================================

-- Dominios de email aprobados para acceso
create table if not exists approved_domains (
  id uuid primary key default gen_random_uuid(),
  domain text unique not null,
  created_at timestamptz default now()
);

-- Emails con acceso Leadership (por invitación)
create table if not exists leadership_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  invited_by text,
  created_at timestamptz default now()
);

-- Perfiles de usuario (se crea al primer login)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'team' check (role in ('team', 'leadership', 'admin')),
  last_login timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- RLS Policies
-- ============================================

-- approved_domains
alter table approved_domains enable row level security;

create policy "Authenticated can read domains"
  on approved_domains for select
  to authenticated
  using (true);

create policy "Admin can manage domains"
  on approved_domains for all
  using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );

-- leadership_users
alter table leadership_users enable row level security;

create policy "Authenticated can read leadership"
  on leadership_users for select
  to authenticated
  using (true);

create policy "Admin can manage leadership"
  on leadership_users for all
  using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );

-- user_profiles
alter table user_profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select
  using (id = auth.uid());

create policy "Users can upsert own profile"
  on user_profiles for insert
  with check (id = auth.uid());

create policy "Users can update own login"
  on user_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admin can read all profiles"
  on user_profiles for select
  using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin can update profiles"
  on user_profiles for update
  using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- Initial Data
-- ============================================

-- Approved domains
insert into approved_domains (domain) values
  ('modulorstudios.com'),
  ('modulor.ventures'),
  ('mendesaltaren.com'),
  ('tailor-hub.com'),
  ('fik.life'),
  ('nocodehackers.es'),
  ('sstilagency.com'),
  ('minimum.run')
on conflict (domain) do nothing;

-- First Leadership invitations (add your actual admin emails here)
-- IMPORTANT: Replace with real email addresses before running
insert into leadership_users (email, invited_by) values
  ('salvador@mendesaltaren.com', 'system')
on conflict (email) do nothing;

-- NOTE: The first admin user_profile must be created manually after first login:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'salvador@mendesaltaren.com';
