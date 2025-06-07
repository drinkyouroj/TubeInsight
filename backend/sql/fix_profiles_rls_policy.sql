-- Fix the infinite recursion in profiles RLS policy
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Option 1: Create a temporary bypass to allow backend service access
-- This is useful for allowing your backend service to access profiles without recursion
CREATE POLICY "Service role can access all profiles" 
ON public.profiles 
FOR ALL 
-- This uses the special service_role() check that's already built into Supabase
USING (auth.jwt() ->> 'role' = 'service_role');

-- Option 2: Create a policy that uses auth.users instead of profiles to determine admin status
-- Note: This requires that you store role information in auth.users.raw_user_meta_data or app_metadata
CREATE POLICY "Admins can view all profiles through user metadata" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    -- Check admin status through user metadata instead of profiles table
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      raw_user_meta_data->>'role' IN ('super_admin', 'content_moderator')
      -- OR, if roles are stored in app_metadata instead
      -- OR raw_app_meta_data->>'role' IN ('super_admin', 'content_moderator')
    )
  )
);

-- Option 3: Use explicit user IDs for admin users
-- This is a simpler approach if you only have a few admin users
CREATE POLICY "Specific admin users can access all profiles"
ON public.profiles
FOR ALL
USING (
  -- Replace these UUIDs with actual admin user IDs from your system
  auth.uid() IN (
    '00000000-0000-0000-0000-000000000000',  -- Replace with actual admin UUID
    '11111111-1111-1111-1111-111111111111'   -- Replace with another admin UUID
  )
);

-- Make sure to comment out or remove the options you don't want to use
-- and keep only the one that works best for your application.
