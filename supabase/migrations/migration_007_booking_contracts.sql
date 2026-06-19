-- Block 3: Booking flow + contract system
-- Replaces the migration_004 bookings skeleton with the full state machine.

-- ── Profiles: capture email for booking notifications ────────────────────────
-- (no service-role key available to read auth.users from the app, so we mirror
-- the email onto profiles at signup and backfill existing rows)
alter table profiles add column if not exists email text;

update profiles set email = auth.users.email
  from auth.users
  where profiles.id = auth.users.id and profiles.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- ── Packages: product type + cancellation terms ──────────────────────────────
alter table packages add column if not exists
  product_type text not null default 'service' check (product_type in ('service','digital','merchandise'));

alter table packages add column if not exists
  cancellation_terms jsonb default '{
    "within_48_hours_refund_pct": 50,
    "within_7_days_refund_pct": 0,
    "more_than_7_days_refund_pct": 100
  }';

-- ── Bookings: drop legacy skeleton and recreate per the new state machine ────
drop table if exists bookings cascade;

create table bookings (
  id                    uuid primary key default gen_random_uuid(),
  artist_id             uuid references artists(id) on delete cascade not null,
  audience_id           uuid references auth.users(id) on delete cascade not null,
  package_id            uuid references packages(id) on delete restrict not null,
  state                 text not null default 'REQUESTED'
                          check (state in (
                            'REQUESTED','ACCEPTED','DECLINED',
                            'CONTRACT_DRAFT','CONTRACT_SENT',
                            'AUDIENCE_UPLOADED','CONTRACT_SIGNED',
                            'PAYMENT_PENDING','PAYMENT_HELD',
                            'GIG_ACTIVE','CHECKED_IN','CONFIRMING',
                            'COMPLETED','AUTO_RELEASED',
                            'DISPUTED','CANCELLED','REFUNDED'
                          )),
  product_type          text not null check (product_type in ('service','digital','merchandise')),
  gig_date              date,
  gig_time              time,
  venue                 text,
  delivery_date         date,
  special_requirements  text,
  audience_notes        text,
  price                 numeric not null,
  currency              text default 'UGX',
  -- captured at booking time (no service-role access to auth.users for contracts/notifications)
  audience_name         text,
  audience_email        text,
  -- per-party confirmation tracking for CONFIRMING -> COMPLETED
  artist_confirmed_at   timestamptz,
  audience_confirmed_at timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table bookings enable row level security;

create policy "Booking parties can read"
  on bookings for select
  using (
    exists (select 1 from artists where artists.id = bookings.artist_id and artists.user_id = auth.uid())
    or auth.uid() = bookings.audience_id
  );

create policy "Audience creates bookings"
  on bookings for insert
  with check (auth.uid() = audience_id);

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

-- Re-link availability.booking_id to the recreated bookings table
alter table availability
  add constraint availability_booking_id_fkey
  foreign key (booking_id) references bookings(id) on delete set null;

-- ── Contracts ─────────────────────────────────────────────────────────────────
create table contracts (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid references bookings(id) on delete cascade not null unique,
  template_type         text not null check (template_type in (
                          'performance','workshop','digital_delivery',
                          'brand_collaboration','mentorship'
                        )),
  content               jsonb not null,
  custom_clauses        jsonb default '[]',
  reference_number      text unique not null,
  generated_pdf_url     text,
  artist_signed_url     text,
  audience_signed_url   text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table contracts enable row level security;

create policy "Contract parties can read"
  on contracts for select
  using (
    exists (
      select 1 from bookings b
      join artists a on a.id = b.artist_id
      where b.id = contracts.booking_id
        and (a.user_id = auth.uid() or b.audience_id = auth.uid())
    )
  );

create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at();

-- ── Booking events (state machine audit trail) ───────────────────────────────
create table booking_events (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references bookings(id) on delete cascade not null,
  from_state  text,
  to_state    text not null,
  actor_id    uuid references auth.users(id),
  note        text,
  created_at  timestamptz default now()
);

alter table booking_events enable row level security;

create policy "Booking parties see events"
  on booking_events for select
  using (
    exists (
      select 1 from bookings b
      join artists a on a.id = b.artist_id
      where b.id = booking_events.booking_id
        and (a.user_id = auth.uid() or b.audience_id = auth.uid())
    )
  );

-- ── Booking reminders (cron-driven notifications) ────────────────────────────
create table booking_reminders (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references bookings(id) on delete cascade,
  send_at     timestamptz not null,
  type        text not null check (type in (
                'rehearsal_1_week','logistics_1_day','audience_1_day'
              )),
  sent        boolean default false
);

alter table booking_reminders enable row level security;
