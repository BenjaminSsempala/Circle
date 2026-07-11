-- Fix handle_new_user trigger to use legal_name metadata and backfill existing rows
-- Safe to run on databases where previous migrations already applied.

BEGIN;

-- 1) Replace the trigger function with corrected logic that preserves existing names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, legal_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    COALESCE(new.raw_user_meta_data->>'legal_name', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = CASE
      WHEN COALESCE(profiles.display_name, '') = '' THEN EXCLUDED.display_name
      ELSE profiles.display_name
    END,
    legal_name = CASE
      WHEN COALESCE(profiles.legal_name, '') = '' THEN EXCLUDED.legal_name
      ELSE profiles.legal_name
    END,
    email = EXCLUDED.email;

  RETURN new;
END;
$$;

-- 2) Preview rows that would be updated by the backfill (run this first to inspect):

-- Count of affected rows
SELECT count(*) AS will_update_count
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE COALESCE(u.raw_user_meta_data->>'legal_name','') <> ''
  AND (
    COALESCE(p.legal_name,'') = COALESCE(u.raw_user_meta_data->>'display_name','')
    OR COALESCE(p.legal_name,'') = ''
  )
  AND COALESCE(p.legal_name,'') <> COALESCE(u.raw_user_meta_data->>'legal_name','');

-- Sample rows (limited) showing current profile legal_name, auth display_name and auth legal_name
SELECT p.id,
       p.legal_name AS profile_legal_name,
       u.raw_user_meta_data->>'display_name' AS auth_display_name,
       u.raw_user_meta_data->>'legal_name' AS auth_legal_name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE COALESCE(u.raw_user_meta_data->>'legal_name','') <> ''
  AND (
    COALESCE(p.legal_name,'') = COALESCE(u.raw_user_meta_data->>'display_name','')
    OR COALESCE(p.legal_name,'') = ''
  )
  AND COALESCE(p.legal_name,'') <> COALESCE(u.raw_user_meta_data->>'legal_name','')
LIMIT 50;

-- 3) Backfill `profiles.legal_name` for rows that were likely populated incorrectly
-- Condition: profile.legal_name equals the user's display_name metadata (the copy-paste symptom)
-- and auth.users.raw_user_meta_data contains a non-empty legal_name value.

UPDATE public.profiles p
SET legal_name = u.raw_user_meta_data->>'legal_name'
FROM auth.users u
WHERE p.id = u.id
  AND COALESCE(u.raw_user_meta_data->>'legal_name', '') <> ''
  AND (
    COALESCE(p.legal_name, '') = COALESCE(u.raw_user_meta_data->>'display_name', '')
    OR COALESCE(p.legal_name, '') = ''
  )
  AND COALESCE(p.legal_name, '') <> COALESCE(u.raw_user_meta_data->>'legal_name', '');

COMMIT;
