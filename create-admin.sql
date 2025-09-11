-- Script per creare un utente amministratore di default
-- Esegui questo script nel Supabase SQL Editor

-- 1. Inserisci l'utente nella tabella auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  'authenticated',
  'authenticated',
  'admin@salario.local',
  crypt('Admin123!', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Crea il profilo nella tabella profiles
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  'admin@salario.local',
  'Amministratore Sistema',
  'admin'
) ON CONFLICT (id) DO NOTHING;

-- 3. Verifica che l'utente sia stato creato correttamente
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.email = 'admin@salario.local';