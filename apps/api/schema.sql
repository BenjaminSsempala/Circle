-- ============================================================
-- The Circle — Auth + Profile Schema
-- Run in Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  role                text check (role in ('artist', 'organiser')),
  email               text default '' unique,
  phone               text default '',
  onboarding_complete boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile row on every signup (email + Google OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Artists extended profile
create extension if not exists "pgcrypto";

create table if not exists artists (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  slug                text unique not null,
  name                text not null,
  pronouns            text,
  tagline             text,
  bio                 text,
  profile_photo       text,
  feature_media       text,
  art_forms           text[] default '{}',
  languages           text[] default '{}',
  city                text,
  country             text,
  actives_since       int,
  social_links        jsonb default '{}',
  completed_bookings  int default 0,
  member_since        date default current_date,
  is_verified         boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table artists enable row level security;
create policy "Artist profiles are publicly readable" on artists for select using (true);
create policy "Artists can update own profile" on artists for update using (auth.uid() = user_id);
create policy "Artists can insert own profile" on artists for insert with check (auth.uid() = user_id);

-- Packages
create table if not exists packages (
  id                  uuid primary key default gen_random_uuid(),
  artist_id           uuid references artists(id) on delete cascade not null,
  name                text not null,
  description         text,
  duration            text,
  price               numeric not null,
  currency            text default 'UGX',
  tier                text check (tier in ('free','standard','premium')) default 'standard',
  logistics_inclusive boolean default false,
  included_items      jsonb default '[]',
  is_active           boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table packages enable row level security;
create policy "Packages are publicly readable" on packages for select using (true);
create policy "Artists manage own packages" on packages for all
  using (exists (select 1 from artists where artists.id = packages.artist_id and artists.user_id = auth.uid()));
