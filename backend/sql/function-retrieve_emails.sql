-- SQL function to safely retrieve user emails from auth.users
-- This needs to be executed on your Supabase instance with appropriate permissions

create or replace function public.get_users_with_emails(user_ids uuid[])
returns json as $$
declare
  result json;
begin
  -- Only superuser/service role can access auth.users directly
  select json_agg(json_build_object('id', u.id, 'email', u.email))
  into result
  from auth.users u
  where u.id = any(user_ids);
  
  return result;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.get_users_with_emails(uuid[]) to authenticated;
grant execute on function public.get_users_with_emails(uuid[]) to service_role;