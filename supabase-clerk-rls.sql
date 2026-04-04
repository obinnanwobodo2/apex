-- =========================================================
-- Apex Visuals — Supabase RLS for Clerk JWTs
-- =========================================================
-- Use this when you access Supabase (PostgREST/Realtime/Storage)
-- with Clerk-issued JWTs.
--
-- Requirements:
-- 1) Supabase third-party auth configured for Clerk.
-- 2) Clerk JWT template includes `sub` claim.
-- 3) Your app tables store Clerk user IDs as TEXT.
--
-- NOTE:
-- Prisma direct DB connections do not automatically apply Supabase
-- auth context per user. RLS is most effective for Supabase API access.

create or replace function public.requesting_user_id()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ),
    ''
  );
$$;

-- Profiles
alter table if exists public.profiles enable row level security;
drop policy if exists "Profiles viewable by owner" on public.profiles;
drop policy if exists "Profiles updatable by owner" on public.profiles;
drop policy if exists "Profiles insertable by owner" on public.profiles;

create policy "Profiles viewable by owner" on public.profiles
  for select using (public.requesting_user_id() = id::text);
create policy "Profiles updatable by owner" on public.profiles
  for update using (public.requesting_user_id() = id::text);
create policy "Profiles insertable by owner" on public.profiles
  for insert with check (public.requesting_user_id() = id::text);

-- Subscriptions
alter table if exists public.subscriptions enable row level security;
drop policy if exists "Subscriptions viewable by owner" on public.subscriptions;
drop policy if exists "Subscriptions insertable by service role" on public.subscriptions;
drop policy if exists "Subscriptions updatable by service role" on public.subscriptions;

create policy "Subscriptions viewable by owner" on public.subscriptions
  for select using (public.requesting_user_id() = user_id::text);
create policy "Subscriptions insertable by owner" on public.subscriptions
  for insert with check (public.requesting_user_id() = user_id::text);
create policy "Subscriptions updatable by owner" on public.subscriptions
  for update using (public.requesting_user_id() = user_id::text);

-- Orders (or project requests)
alter table if exists public.orders enable row level security;
drop policy if exists "Orders viewable by owner" on public.orders;
drop policy if exists "Orders insertable by owner" on public.orders;
drop policy if exists "Orders updatable by owner" on public.orders;

create policy "Orders viewable by owner" on public.orders
  for select using (public.requesting_user_id() = user_id::text);
create policy "Orders insertable by owner" on public.orders
  for insert with check (public.requesting_user_id() = user_id::text);
create policy "Orders updatable by owner" on public.orders
  for update using (public.requesting_user_id() = user_id::text);
