-- Add brand_terms JSONB column to bookings for brand collaboration bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS brand_terms jsonb;
