-- Function to sync email from auth.users to profiles table
CREATE OR REPLACE FUNCTION public.sync_email_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the email column exists and is being updated, or if it's a new user
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.email IS DISTINCT FROM OLD.email) THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a user is inserted or email is updated in auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_to_profile();

-- Optional: Backfill existing profiles that might be missing emails
-- This should be run once manually if needed.
-- UPDATE public.profiles p
-- SET email = (SELECT raw_user_meta_data->>'email' FROM auth.users u WHERE u.id = p.id)
-- WHERE p.email IS NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id AND u.raw_user_meta_data->>'email' IS NOT NULL);

-- Note: If your profiles.email column doesn't exist, you'll need to add it first:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
