-- EMERGENCY SECURITY LOCKDOWN
-- 1. IMMEDIATE RLS ENABLE to block anonymous access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_entries ENABLE ROW LEVEL SECURITY;

-- 2. Force PostgREST cache reload 
NOTIFY pgrst, 'reload schema';

-- 3. Create missing entities table with RLS
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

-- 4. Add entity_id to annual_entries
ALTER TABLE public.annual_entries 
ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE;

-- 5. Fix unique constraint for entity-centric model
ALTER TABLE public.annual_entries 
DROP CONSTRAINT IF EXISTS annual_entries_user_id_year_key;
ALTER TABLE public.annual_entries 
ADD CONSTRAINT annual_entries_unique UNIQUE (user_id, entity_id, year);

-- 6. Enable RLS on entities
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- 7. STRICT RLS POLICIES (deny by default)
-- Profiles policies
CREATE POLICY profiles_select_own ON public.profiles 
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles 
  FOR UPDATE USING (id = auth.uid() OR public.is_admin(auth.uid())) 
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

-- Entities policies  
CREATE POLICY entities_select_own ON public.entities
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY entities_insert_own ON public.entities
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY entities_update_own ON public.entities
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY entities_delete_own ON public.entities
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Annual_entries policies
CREATE POLICY annual_entries_select_own ON public.annual_entries
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY annual_entries_insert_own ON public.annual_entries
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY annual_entries_update_own ON public.annual_entries
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY annual_entries_delete_own ON public.annual_entries
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 8. Update trigger for entities
CREATE TRIGGER update_entities_updated_at 
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Final cache reload
NOTIFY pgrst, 'reload schema';
