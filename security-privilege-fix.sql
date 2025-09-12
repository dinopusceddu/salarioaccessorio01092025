-- CRITICAL PRIVILEGE ESCALATION FIX
-- Replace permissive policies with secure command-specific policies

-- 1. Drop the dangerous FOR ALL policies
DROP POLICY IF EXISTS profiles_own_data ON public.profiles;
DROP POLICY IF EXISTS entities_own_data ON public.entities;
DROP POLICY IF EXISTS annual_entries_own_data ON public.annual_entries;

-- 2. Create SECURE command-specific policies for profiles
-- SELECT: Users can view own profile, admins can view all
CREATE POLICY profiles_select ON public.profiles 
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));

-- UPDATE: Users can update own profile BUT CANNOT change role
CREATE POLICY profiles_update_user ON public.profiles 
  FOR UPDATE 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- UPDATE: Only admins can update any profile (including role changes)
CREATE POLICY profiles_update_admin ON public.profiles 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

-- INSERT: Allow profile creation only for self with user role
CREATE POLICY profiles_insert ON public.profiles 
  FOR INSERT 
  WITH CHECK (id = auth.uid() AND role = 'user');

-- DELETE: Only admins can delete profiles
CREATE POLICY profiles_delete ON public.profiles 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- 3. Create SECURE policies for entities
CREATE POLICY entities_select ON public.entities
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY entities_insert ON public.entities
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY entities_update ON public.entities
  FOR UPDATE 
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY entities_delete ON public.entities
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 4. Create SECURE policies for annual_entries
CREATE POLICY annual_entries_select ON public.annual_entries
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY annual_entries_insert ON public.annual_entries
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY annual_entries_update ON public.annual_entries
  FOR UPDATE 
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY annual_entries_delete ON public.annual_entries
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 5. BACKFILL missing entity_id for existing annual_entries
-- Create a default entity for users who have annual_entries but no entities
INSERT INTO public.entities (id, user_id, name, tipologia)
SELECT 
  gen_random_uuid(),
  ae.user_id,
  'Ente Principale',
  'Comune'
FROM (
  SELECT DISTINCT user_id 
  FROM public.annual_entries 
  WHERE entity_id IS NULL
) ae
LEFT JOIN public.entities e ON e.user_id = ae.user_id
WHERE e.id IS NULL;

-- Update annual_entries to reference the default entity
UPDATE public.annual_entries 
SET entity_id = (
  SELECT e.id 
  FROM public.entities e 
  WHERE e.user_id = annual_entries.user_id 
  LIMIT 1
)
WHERE entity_id IS NULL;

-- 6. Make entity_id NOT NULL now that all rows have it
ALTER TABLE public.annual_entries 
ALTER COLUMN entity_id SET NOT NULL;

-- 7. Add trigger to prevent non-admin role changes
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow role changes only for admins
  IF OLD.role != NEW.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_escalation();

-- 8. Force cache reload
NOTIFY pgrst, 'reload schema';

-- 9. Verification
SELECT 'Security privilege escalation fix completed!' as status;