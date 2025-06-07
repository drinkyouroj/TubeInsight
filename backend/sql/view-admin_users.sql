CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.status,
  p.avatar_url,
  u.last_sign_in_at,
  u.created_at,
  u.updated_at
FROM 
  auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
WHERE 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'content_moderator')
  );