-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for admin table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow admins to read their own data
CREATE POLICY "Admins can read their own data" ON public.admins
  FOR SELECT
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- Default admin (change password immediately after setup!)
-- Email: admin@taxihollongi.com
-- Default Password: Secure@Admin123 (CHANGE THIS!)
INSERT INTO public.admins (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@taxihollongi.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', -- bcrypt hash of "Secure@Admin123"
  'Administrator',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;
