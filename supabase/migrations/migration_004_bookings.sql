-- Bookings table — state machine skeleton (full payment/contract wiring in Block 3)
create table if not exists bookings (
  id                  uuid primary key default gen_random_uuid(),
  artist_id           uuid references artists(id) on delete cascade not null,
  organiser_id        uuid references auth.users(id) on delete set null,
  organiser_name      text,
  event_name          text,
  event_description   text,
  event_date          timestamptz,
  duration            text,
  amount              numeric,
  currency            text default 'UGX',
  state               text default 'REQUESTED' check (state in (
    'REQUESTED','CONTRACT_SIGNED','PAYMENT_HELD','GIG_ACTIVE',
    'CHECKED_IN','CONFIRMING','COMPLETED','AUTO_RELEASED',
    'CANCELLED','REFUNDED','DECLINED'
  )),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table bookings enable row level security;

create policy "Artists can view own bookings"
  on bookings for select
  using (artist_id in (select id from artists where user_id = auth.uid()));

create policy "Organisers can view own bookings"
  on bookings for select
  using (organiser_id = auth.uid());
