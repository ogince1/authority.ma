-- Create auth users and corresponding users records
-- Date: 2025-01-21

-- Insérer dans auth.users d'abord
INSERT INTO auth.users (
  id,
  instance_id,
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
) VALUES 
(
  '9bb8b817-0916-483d-a8dc-4d29382e12a9',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'advertiser@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test Advertiser"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
(
  '187fba7a-38bf-4280-a069-656240b1c630',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'publisher@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test Publisher"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Maintenant insérer dans la table users
INSERT INTO users (
  id,
  name,
  email,
  role,
  balance,
  phone,
  website,
  company_name
) VALUES 
(
  '9bb8b817-0916-483d-a8dc-4d29382e12a9',
  'Test Advertiser',
  'advertiser@test.com',
  'advertiser',
  10000.00,
  '+212 6 12 34 56 78',
  'https://test-company.com',
  'Test Company'
),
(
  '187fba7a-38bf-4280-a069-656240b1c630',
  'Test Publisher',
  'publisher@test.com',
  'publisher',
  5000.00,
  '+212 6 98 76 54 32',
  'https://test-publisher.com',
  'Test Publisher Company'
)
ON CONFLICT (id) DO NOTHING;
