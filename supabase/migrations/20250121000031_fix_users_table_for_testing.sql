-- Fix users table to allow test user creation
-- Date: 2025-01-21

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS create_test_user(UUID, VARCHAR, VARCHAR, VARCHAR, DECIMAL, VARCHAR, VARCHAR, VARCHAR);

-- Créer une fonction pour insérer des utilisateurs de test
CREATE OR REPLACE FUNCTION create_test_user(
  p_id UUID,
  p_name VARCHAR(255),
  p_email VARCHAR(255),
  p_role VARCHAR(20),
  p_balance DECIMAL(10,2),
  p_phone VARCHAR(20) DEFAULT NULL,
  p_website VARCHAR(255) DEFAULT NULL,
  p_company_name VARCHAR(255) DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  -- Insérer l'utilisateur en contournant RLS
  INSERT INTO users (id, name, email, role, balance, phone, website, company_name)
  VALUES (p_id, p_name, p_email, p_role, p_balance, p_phone, p_website, p_company_name);
  
  RETURN json_build_object('success', true, 'user_id', p_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_test_user TO anon, authenticated;

-- Créer les utilisateurs de test directement
SELECT create_test_user(
  '9bb8b817-0916-483d-a8dc-4d29382e12a9'::UUID,
  'Test Advertiser',
  'advertiser@test.com',
  'advertiser',
  10000.00,
  '+212 6 12 34 56 78',
  'https://test-company.com',
  'Test Company'
);

SELECT create_test_user(
  '187fba7a-38bf-4280-a069-656240b1c630'::UUID,
  'Test Publisher',
  'publisher@test.com',
  'publisher',
  5000.00,
  '+212 6 98 76 54 32',
  'https://test-publisher.com',
  'Test Publisher Company'
);
