-- Function to get the current user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON AS $$
  SELECT row_to_json(p.*)
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to update a user's role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
) 
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    UPDATE public.profiles
    SET role = new_role
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only super admins can update user roles';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;