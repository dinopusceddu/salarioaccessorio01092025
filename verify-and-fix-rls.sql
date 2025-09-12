-- VERIFY AND FIX RLS SECURITY
-- Execute this in Supabase SQL Editor

-- 1. Check RLS flags on tables
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('profiles','annual_entries','entities');

-- 2. Check existing policies
SELECT 
  c.relname as table_name,
  p.polname as policy_name,
  p.cmd as command_type
FROM pg_policy p 
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname IN ('profiles','annual_entries','entities');

-- 3. Check grants to anon/authenticated
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' 
  AND table_name IN ('profiles','annual_entries','entities')
  AND grantee IN ('anon','authenticated');

-- 4. Count data in tables
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'annual_entries', count(*) FROM public.annual_entries
UNION ALL
SELECT 'entities', count(*) FROM public.entities;

-- 5. FORCE RLS and revoke unsafe grants
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.annual_entries FORCE ROW LEVEL SECURITY;

-- Create entities table if missing
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tipologia TEXT,
  altro_tipologia TEXT,
  numero_abitanti INTEGER,
  ipa_code TEXT,
  tax_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  pec TEXT,
  website TEXT,
  municipality TEXT,
  province TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.entities FORCE ROW LEVEL SECURITY;

-- 6. Revoke all grants from anon/authenticated (start clean)
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.annual_entries FROM anon, authenticated;
REVOKE ALL ON public.entities FROM anon, authenticated;

-- 7. Grant only SELECT/INSERT/UPDATE/DELETE to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annual_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entities TO authenticated;

-- 8. Create minimal RLS policies (deny by default, allow own data)
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own entries" ON public.annual_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.annual_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.annual_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.annual_entries;

-- Create new policies
CREATE POLICY profiles_select_own ON public.profiles 
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles 
  FOR UPDATE USING (id = auth.uid() OR public.is_admin(auth.uid())) 
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY entities_all_own ON public.entities
  FOR ALL USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY annual_entries_all_own ON public.annual_entries
  FOR ALL USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 9. Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';

-- 10. Final verification query
SELECT 'RLS Setup Complete' as status;