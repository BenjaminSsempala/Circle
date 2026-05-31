-- Add selected_works jsonb array to the artists extended profile
ALTER TABLE artists ADD COLUMN IF NOT EXISTS selected_works jsonb DEFAULT '[]';
