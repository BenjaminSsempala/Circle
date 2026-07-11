-- Add profile visibility toggle for artists.
-- When false, artist is hidden from /discover but their direct link still works.
ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Partial index for the discover page query
CREATE INDEX IF NOT EXISTS idx_artists_is_visible ON artists(is_visible) WHERE is_visible = true;
