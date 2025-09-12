-- SIMPLIFIED EMERGENCY RLS FIX
-- This version avoids problematic column references

-- 1. Basic table check
SELECT 'Checking tables...' as status;

-- 2. Count data in tables (to see if they exist)
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'annual_entries', count(*) FROM public.annual_entries;

-- 3. Force RLS on existing tables
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.annual_entries FORCE ROW LEVEL SECURITY;

-- 4. Create entities table
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

-- 5. Force RLS on entities
ALTER TABLE public.entities FORCE ROW LEVEL SECURITY;

-- 6. Add entity_id to annual_entries if missing
ALTER TABLE public.annual_entries 
ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE;

-- 7. Drop old constraint and add new one
ALTER TABLE public.annual_entries 
DROP CONSTRAINT IF EXISTS annual_entries_user_id_year_key;

ALTER TABLE public.annual_entries 
ADD CONSTRAINT annual_entries_unique UNIQUE (user_id, entity_id, year);

-- 8. Revoke unsafe grants
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.annual_entries FROM anon, authenticated;
REVOKE ALL ON public.entities FROM anon, authenticated;

-- 9. Grant only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annual_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entities TO authenticated;

-- 10. Drop existing policies (use IF EXISTS)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own entries" ON public.annual_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.annual_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.annual_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.annual_entries;

-- 11. Create simple, secure policies
CREATE POLICY profiles_own_data ON public.profiles 
  FOR ALL USING (id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY entities_own_data ON public.entities
  FOR ALL USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY annual_entries_own_data ON public.annual_entries
  FOR ALL USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 12. Force cache reload
NOTIFY pgrst, 'reload schema';

-- 13. Success message
SELECT 'RLS Security Setup Complete!' as final_status;