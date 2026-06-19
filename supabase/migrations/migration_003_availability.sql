-- Availability table for artist blackout dates and booked dates
create table if not exists availability (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid references artists(id) on delete cascade,
  date        date not null,
  type        text check (type in ('blackout', 'booked')),
  booking_id  uuid references bookings(id) on delete set null,
  unique (artist_id, date)
);

alter table availability enable row level security;

create policy "Artists manage own availability"
  on availability for all
  using (exists (
    select 1 from artists where artists.id = availability.artist_id
    and artists.user_id = auth.uid()
  ));

create policy "Availability is publicly readable"
  on availability for select using (true);
