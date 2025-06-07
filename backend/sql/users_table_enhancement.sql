-- Add to existing users table in Supabase
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'analyst', 'moderator', 'admin'));
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;