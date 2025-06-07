-- For existing users without profiles, you could run this in Supabase SQL editor
INSERT INTO public.profiles (id, role)
SELECT id, 'user' as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);