-- Migration pour créer les fonctions RPC de gestion des triggers

-- Fonction pour vérifier les triggers d'une table
CREATE OR REPLACE FUNCTION get_table_triggers(table_name text)
RETURNS TABLE (
  trigger_name text,
  event_manipulation text,
  action_timing text,
  action_statement text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.trigger_name::text,
    t.event_manipulation::text,
    t.action_timing::text,
    t.action_statement::text
  FROM information_schema.triggers t
  WHERE t.event_object_table = table_name
  ORDER BY t.trigger_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les fonctions de trigger
CREATE OR REPLACE FUNCTION get_trigger_functions()
RETURNS TABLE (
  function_name text,
  function_type text,
  return_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text as function_name,
    CASE 
      WHEN p.prokind = 'f' THEN 'function'
      WHEN p.prokind = 'p' THEN 'procedure'
      WHEN p.prokind = 'a' THEN 'aggregate'
      WHEN p.prokind = 'w' THEN 'window'
      ELSE 'other'
    END::text as function_type,
    pg_catalog.format_type(p.prorettype, NULL)::text as return_type
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname LIKE '%trigger%'
  ORDER BY p.proname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour recréer le trigger de mise à jour des soldes
CREATE OR REPLACE FUNCTION recreate_balance_trigger()
RETURNS text AS $$
BEGIN
  -- Supprimer le trigger existant s'il existe
  DROP TRIGGER IF EXISTS trigger_update_user_balance_after_transaction ON credit_transactions;
  
  -- Recréer la fonction de trigger
  CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Mettre à jour le solde de l'utilisateur
    UPDATE users 
    SET balance = NEW.balance_after,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Recréer le trigger
  CREATE TRIGGER trigger_update_user_balance_after_transaction
    AFTER INSERT ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance_after_transaction();

  RETURN 'Trigger recréé avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier l'état des triggers
CREATE OR REPLACE FUNCTION check_trigger_status()
RETURNS TABLE (
  table_name text,
  trigger_name text,
  is_enabled boolean,
  function_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.event_object_table::text as table_name,
    t.trigger_name::text,
    CASE WHEN t.action_timing IS NOT NULL THEN true ELSE false END as is_enabled,
    t.action_statement::text as function_name
  FROM information_schema.triggers t
  WHERE t.event_object_table IN ('credit_transactions', 'users', 'link_purchase_transactions')
  ORDER BY t.event_object_table, t.trigger_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour tester le trigger de balance
CREATE OR REPLACE FUNCTION test_balance_trigger(user_id uuid, amount decimal)
RETURNS TABLE (
  before_balance decimal,
  after_balance decimal,
  transaction_id uuid
) AS $$
DECLARE
  current_balance decimal;
  new_balance decimal;
  test_transaction_id uuid;
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO current_balance FROM users WHERE id = user_id;
  
  -- Calculer le nouveau solde
  new_balance := current_balance + amount;
  
  -- Créer une transaction de test
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status,
    balance_before,
    balance_after,
    created_at,
    completed_at
  ) VALUES (
    user_id,
    'deposit',
    amount,
    'Test trigger balance',
    'MAD',
    'completed',
    current_balance,
    new_balance,
    NOW(),
    NOW()
  ) RETURNING id INTO test_transaction_id;
  
  -- Récupérer le solde final
  SELECT balance INTO current_balance FROM users WHERE id = user_id;
  
  RETURN QUERY
  SELECT 
    current_balance - amount as before_balance,
    current_balance as after_balance,
    test_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réparer les triggers manquants
CREATE OR REPLACE FUNCTION repair_missing_triggers()
RETURNS text AS $$
DECLARE
  result text := '';
BEGIN
  -- Vérifier et recréer le trigger de balance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_user_balance_after_transaction'
  ) THEN
    PERFORM recreate_balance_trigger();
    result := result || 'Trigger de balance recréé. ';
  END IF;
  
  -- Vérifier et recréer le trigger de vérification de solde
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_check_balance_before_transaction'
  ) THEN
    -- Recréer la fonction de vérification
    CREATE OR REPLACE FUNCTION check_balance_before_transaction()
    RETURNS TRIGGER AS $$
    DECLARE
      current_balance DECIMAL(10,2);
    BEGIN
      -- Récupérer le solde actuel
      SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
      
      -- Calculer le nouveau solde
      IF NEW.type IN ('deposit', 'refund') THEN
        NEW.balance_after := current_balance + NEW.amount;
      ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
        NEW.balance_after := current_balance - NEW.amount;
        
        -- Vérifier que le solde ne devient pas négatif
        IF NEW.balance_after < 0 THEN
          RAISE EXCEPTION 'Solde insuffisant pour cette transaction';
        END IF;
      END IF;
      
      NEW.balance_before := current_balance;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Recréer le trigger
    CREATE TRIGGER trigger_check_balance_before_transaction
      BEFORE INSERT ON credit_transactions
      FOR EACH ROW
      EXECUTE FUNCTION check_balance_before_transaction();
      
    result := result || 'Trigger de vérification recréé. ';
  END IF;
  
  IF result = '' THEN
    result := 'Tous les triggers sont déjà présents.';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_table_triggers(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trigger_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION recreate_balance_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION check_trigger_status() TO authenticated;
GRANT EXECUTE ON FUNCTION test_balance_trigger(uuid, decimal) TO authenticated;
GRANT EXECUTE ON FUNCTION repair_missing_triggers() TO authenticated;
