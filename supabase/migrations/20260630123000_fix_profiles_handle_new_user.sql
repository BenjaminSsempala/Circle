-- Add legal_name to auto-created profile rows and keep it synced on auth user upsert
-- This migration updates the trigger used by auth.users signups.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, legal_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    legal_name = EXCLUDED.legal_name,
    email = EXCLUDED.email;

  RETURN new;
END;
$$;
