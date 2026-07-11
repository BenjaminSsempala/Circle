-- Fix: Don't overwrite display_name/legal_name if already set by the user.
-- Only populate them on first insert or if they're still empty.
-- Always keep email in sync.

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
