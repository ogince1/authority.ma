-- Fix auth users for proper authentication
-- Date: 2025-01-21

-- Supprimer les utilisateurs existants dans auth.users
DELETE FROM auth.users WHERE email IN ('advertiser@test.com', 'publisher@test.com');

-- Créer les utilisateurs avec la configuration correcte pour l'authentification
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES 
(
  '9bb8b817-0916-483d-a8dc-4d29382e12a9',
  'advertiser@test.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
),
(
  '187fba7a-38bf-4280-a069-656240b1c630',
  'publisher@test.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
);

-- S'assurer que les utilisateurs existent dans public.users
INSERT INTO public.users (id, name, email, role, balance)
VALUES
  ('9bb8b817-0916-483d-a8dc-4d29382e12a9', 'Test Advertiser', 'advertiser@test.com', 'advertiser', 10000.00),
  ('187fba7a-38bf-4280-a069-656240b1c630', 'Test Publisher', 'publisher@test.com', 'publisher', 5000.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  balance = EXCLUDED.balance;
