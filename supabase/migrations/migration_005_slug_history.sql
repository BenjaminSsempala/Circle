-- Slug history for 301 redirects when artists change their handle
create table if not exists slug_history (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid references artists(id) on delete cascade not null,
  old_slug    text not null,
  created_at  timestamptz default now(),
  unique (old_slug)
);

alter table slug_history enable row level security;

create policy "Slug history is publicly readable"
  on slug_history for select using (true);

create policy "Artists manage own slug history"
  on slug_history for insert
  using (exists (
    select 1 from artists where artists.id = slug_history.artist_id
    and artists.user_id = auth.uid()
  ));
