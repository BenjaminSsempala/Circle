-- Make stars nullable so mood-only reviews are allowed,
-- and add the mood column the API already writes to.

ALTER TABLE reviews ALTER COLUMN stars DROP NOT NULL;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS mood text
  CHECK (mood IN ('magical', 'meaningful', 'energetic', 'professional', 'inspiring'));

-- Ensure at least one of stars or mood is provided
ALTER TABLE reviews ADD CONSTRAINT reviews_stars_or_mood
  CHECK (stars IS NOT NULL OR mood IS NOT NULL);
