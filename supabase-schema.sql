-- =====================================================
-- Apex Visuals — Supabase Schema
-- Run in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by owner" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles updatable by owner" on public.profiles
  for update using (auth.uid() = id);
create policy "Profiles insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- Subscriptions
-- =====================================================
create table if not exists public.subscriptions (
  id                    text primary key,
  user_id               uuid references auth.users(id) on delete cascade,
  package               text not null,
  amount                numeric not null,
  amount_paid           numeric default 0,
  status                text default 'pending',
  paid                  boolean default false,
  business_name         text,
  contact_person        text,
  phone                 text,
  description           text,
  invoice_number        text,
  paystack_reference    text,
  next_billing_date     timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Subscriptions viewable by owner" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "Subscriptions insertable by service role" on public.subscriptions
  for insert with check (true);
create policy "Subscriptions updatable by service role" on public.subscriptions
  for update using (true);

-- =====================================================
-- Orders (website project requests)
-- =====================================================
create table if not exists public.orders (
  id              text primary key default gen_random_uuid()::text,
  user_id         uuid references auth.users(id) on delete cascade,
  package         text,
  amount          numeric default 0,
  status          text default 'Pending Payment',
  paid            boolean default false,
  paystack_ref    text,
  invoice_number  text,
  business_name   text,
  contact_person  text,
  email           text,
  phone           text,
  description     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Orders viewable by owner" on public.orders
  for select using (auth.uid() = user_id);
create policy "Orders insertable by owner" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "Orders updatable by owner" on public.orders
  for update using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger on_subscriptions_updated
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

create trigger on_orders_updated
  before update on public.orders
  for each row execute procedure public.handle_updated_at();
