-- ===== CORRECTION SIMPLE DES POLITIQUES RLS POUR LES TRIGGERS =====
-- À exécuter dans l'interface SQL de Supabase Cloud

-- 1. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "allow_trigger_balance_update" ON users;
DROP POLICY IF EXISTS "allow_balance_updates_from_triggers" ON users;

-- 2. Créer une politique simple qui permet aux triggers de fonctionner
CREATE POLICY "allow_balance_updates" ON users
  FOR UPDATE
  TO public
  USING (
    -- Permettre la mise à jour si :
    -- 1. C'est l'utilisateur lui-même
    auth.uid() = id
    OR
    -- 2. OU si c'est un utilisateur authentifié (pour les triggers)
    auth.role() = 'authenticated'
  );

-- 3. Recréer les fonctions trigger avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION check_balance_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé', NEW.user_id;
  END IF;
  
  NEW.balance_before := current_balance;
  
  -- Calculer le nouveau solde
  IF NEW.type IN ('deposit', 'refund') THEN
    NEW.balance_after := current_balance + NEW.amount;
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    NEW.balance_after := current_balance - NEW.amount;
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant: % - % = %', current_balance, NEW.amount, NEW.balance_after;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour avec SECURITY DEFINER (contourne RLS)
  UPDATE users 
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé pour mise à jour', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer les triggers
DROP TRIGGER IF EXISTS trigger_check_balance_before_transaction ON credit_transactions;
DROP TRIGGER IF EXISTS trigger_update_user_balance_after_transaction ON credit_transactions;

CREATE TRIGGER trigger_check_balance_before_transaction
  BEFORE INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_before_transaction();

CREATE TRIGGER trigger_update_user_balance_after_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_transaction();

-- 5. Fonction de test simple
CREATE OR REPLACE FUNCTION test_triggers_simple(
  user_email TEXT,
  amount DECIMAL
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_old_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Récupérer l'utilisateur
  SELECT id, balance INTO v_user_id, v_old_balance 
  FROM users WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN 'Utilisateur non trouvé: ' || user_email;
  END IF;
  
  -- Créer une transaction de test
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status
  ) VALUES (
    v_user_id,
    'deposit',
    amount,
    'Test triggers simple',
    'MAD',
    'completed'
  );
  
  -- Récupérer le nouveau solde
  SELECT balance INTO v_new_balance FROM users WHERE id = v_user_id;
  
  RETURN 'SUCCESS: ' || v_old_balance || ' -> ' || v_new_balance || ' MAD';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION test_triggers_simple(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION test_triggers_simple(TEXT, DECIMAL) TO anon;

-- 6. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ CORRECTION RLS SIMPLE TERMINÉE';
  RAISE NOTICE 'Pour tester: SELECT test_triggers_simple(''ogincema@gmail.com'', 1.0);';
END;
$$;
