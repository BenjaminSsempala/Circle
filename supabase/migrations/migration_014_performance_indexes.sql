-- Performance indexes — run in Supabase SQL editor
-- These cover the most frequently queried columns across bookings, artists,
-- packages, availability, and gig tables.

-- Bookings: artist and audience lookups, state filtering
create index if not exists idx_bookings_artist_id      on bookings(artist_id);
create index if not exists idx_bookings_audience_id    on bookings(audience_id);
create index if not exists idx_bookings_state          on bookings(state);
create index if not exists idx_bookings_artist_state   on bookings(artist_id, state);
create index if not exists idx_bookings_gig_date       on bookings(gig_date);

-- Artists: profile lookups by user and slug
create index if not exists idx_artists_user_id         on artists(user_id);
create index if not exists idx_artists_slug            on artists(slug);

-- Packages: filtered by artist and active status
create index if not exists idx_packages_artist_id      on packages(artist_id);
create index if not exists idx_packages_artist_active  on packages(artist_id, is_active);

-- Availability: blackout + booked date checks per artist
create index if not exists idx_availability_artist_date on availability(artist_id, date);
create index if not exists idx_availability_type        on availability(type);

-- Booking events: timeline lookups per booking
create index if not exists idx_booking_events_booking_id on booking_events(booking_id);

-- Reviews: artist profile page lookups
create index if not exists idx_reviews_ratee_id        on reviews(ratee_id);
create index if not exists idx_reviews_rater_id        on reviews(rater_id);

-- Gig posts: feed and audience lookups
create index if not exists idx_gig_posts_status        on gig_posts(status);
create index if not exists idx_gig_posts_audience_id   on gig_posts(audience_id);
create index if not exists idx_gig_posts_status_visibility on gig_posts(status, visibility);

-- Gig applications: duplicate check + applicant listing
create index if not exists idx_gig_applications_gig_artist on gig_applications(gig_post_id, artist_id);
create index if not exists idx_gig_applications_artist_id  on gig_applications(artist_id);

-- Saved artists: audience saved list
create index if not exists idx_saved_artists_audience_id on saved_artists(audience_id);

-- Contracts: booking lookup
create index if not exists idx_contracts_booking_id    on contracts(booking_id);
