create table gig_posts (
  id                      uuid primary key default gen_random_uuid(),
  audience_id             uuid references auth.users(id) on delete cascade not null,
  title                   text not null,
  discipline              text[] not null,
  slot_duration           text not null,
  budget                  numeric not null,
  currency                text default 'UGX',
  technical_requirements  text,
  description             text,
  gig_date                date,
  venue                   text,
  visibility              text not null check (visibility in ('public', 'targeted')) default 'public',
  status                  text not null check (status in ('open', 'filled', 'cancelled', 'expired')) default 'open',
  selected_artist_id      uuid references artists(id),
  selected_booking_id     uuid references bookings(id),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table gig_posts enable row level security;

create policy "Public gigs are readable by everyone"
  on gig_posts for select using (visibility = 'public' or audience_id = auth.uid());

create policy "Audience manages their own gig posts"
  on gig_posts for all using (auth.uid() = audience_id);

create table gig_applications (
  id                    uuid primary key default gen_random_uuid(),
  gig_post_id           uuid references gig_posts(id) on delete cascade not null,
  artist_id             uuid references artists(id) on delete cascade not null,
  referenced_package_id uuid references packages(id),
  message               text not null check (char_length(message) <= 300),
  status                text not null check (status in ('pending', 'selected', 'declined')) default 'pending',
  applied_at            timestamptz default now(),
  unique (gig_post_id, artist_id)
);

alter table gig_applications enable row level security;

create policy "Artists manage their own applications"
  on gig_applications for all
  using (exists (select 1 from artists where artists.id = gig_applications.artist_id and artists.user_id = auth.uid()));

create policy "Gig poster can read applications to their gig"
  on gig_applications for select
  using (exists (select 1 from gig_posts where gig_posts.id = gig_applications.gig_post_id and gig_posts.audience_id = auth.uid()));

create policy "Gig poster can update application status"
  on gig_applications for update
  using (exists (select 1 from gig_posts where gig_posts.id = gig_applications.gig_post_id and gig_posts.audience_id = auth.uid()));

create table gig_invitations (
  id          uuid primary key default gen_random_uuid(),
  gig_post_id uuid references gig_posts(id) on delete cascade not null,
  artist_id   uuid references artists(id) on delete cascade not null,
  invited_at  timestamptz default now(),
  unique (gig_post_id, artist_id)
);

alter table gig_invitations enable row level security;

create policy "Gig poster manages invitations"
  on gig_invitations for all
  using (exists (select 1 from gig_posts where gig_posts.id = gig_invitations.gig_post_id and gig_posts.audience_id = auth.uid()));

create policy "Invited artists can read their own invitations"
  on gig_invitations for select
  using (exists (select 1 from artists where artists.id = gig_invitations.artist_id and artists.user_id = auth.uid()));

alter table packages add column if not exists source text default 'manual' check (source in ('manual', 'gig_post'));
alter table bookings add column if not exists gig_post_id uuid references gig_posts(id);
