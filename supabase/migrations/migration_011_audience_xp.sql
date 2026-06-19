-- Moments table (artist-written experience stories)
CREATE TABLE IF NOT EXISTS moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  story text NOT NULL CHECK (char_length(story) <= 1000),
  occasion_type text CHECK (occasion_type IN ('birthday','corporate','wedding','workshop','festival','school','private','other')),
  photo_url text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moments are publicly readable" ON moments FOR SELECT USING (true);
CREATE POLICY "Artists manage their own moments" ON moments FOR ALL
  USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = moments.artist_id AND artists.user_id = auth.uid()));

-- booking_contexts on artists (most booked for tags)
ALTER TABLE artists ADD COLUMN IF NOT EXISTS booking_contexts text[] DEFAULT '{}';

-- mood on reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS mood text
  CHECK (mood IN ('magical','meaningful','energetic','professional','inspiring'));

-- memory_card_url and booking_type on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS memory_card_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text
  CHECK (booking_type IN ('performance','workshop','commissioned_piece','mentorship','other'));

-- saved_artists table
CREATE TABLE IF NOT EXISTS saved_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (audience_id, artist_id)
);
ALTER TABLE saved_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audience manages their own saved artists" ON saved_artists FOR ALL USING (auth.uid() = audience_id);
CREATE POLICY "Saved artists are readable by owner" ON saved_artists FOR SELECT USING (auth.uid() = audience_id);
