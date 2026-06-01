create table if not exists events (
  id                uuid primary key default gen_random_uuid(),
  artist_id         uuid references artists(id) on delete cascade not null,
  title             text not null,
  date              date not null,
  time              text,
  venue             text,
  city              text,
  ticket_url        text,
  poster_url        text,
  short_description text,
  full_info         text,
  contacts          jsonb default '[]',
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table events enable row level security;

create policy "Events are publicly readable"
  on events for select using (true);

create policy "Artists manage own events"
  on events for all
  using (exists (
    select 1 from artists where artists.id = events.artist_id
    and artists.user_id = auth.uid()
  ));

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();
