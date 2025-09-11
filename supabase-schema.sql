-- Schema Database per Sistema Gestione Utenti e Dati Fondi Accessori
-- Eseguire questo script nella dashboard Supabase SQL Editor

-- 1. Crea enum per i ruoli utente
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 2. Abilita estensione per UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Tabella profili utenti
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trigger per creazione automatica profilo utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 5. Trigger che si attiva quando un nuovo utente si registra
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();

-- 6. Funzione per verificare se un utente è admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = uid AND p.role = 'admin'
    )
$$;

-- 7. Tabella per i dati annuali degli utenti
CREATE TABLE public.annual_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    year INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, year)
);

-- 8. Indice per performance
CREATE INDEX ON public.annual_entries(user_id, year);

-- 9. Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.annual_entries
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();

-- 10. ABILITARE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_entries ENABLE ROW LEVEL SECURITY;

-- 11. POLITICHE RLS per tabella profiles
-- Gli utenti possono vedere solo il proprio profilo
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (id = auth.uid());

-- Gli admin possono vedere tutti i profili
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Gli utenti possono aggiornare solo il proprio profilo (tranne il ruolo)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Solo gli admin possono modificare i ruoli
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 12. POLITICHE RLS per tabella annual_entries
-- Gli utenti possono vedere solo i propri dati annuali
CREATE POLICY "Users can view own entries"
    ON public.annual_entries FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Gli utenti possono inserire solo i propri dati
CREATE POLICY "Users can insert own entries"
    ON public.annual_entries FOR INSERT
    WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Gli utenti possono aggiornare solo i propri dati
CREATE POLICY "Users can update own entries"
    ON public.annual_entries FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Gli utenti possono eliminare solo i propri dati
CREATE POLICY "Users can delete own entries"
    ON public.annual_entries FOR DELETE
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 13. OPZIONALE: Creare il primo utente admin
-- DOPO aver fatto login con il primo utente, esegui:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'tua-email@admin.com';

-- 14. Test delle tabelle (opzionale)
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.annual_entries;