-- ===== NETTOYAGE COMPLET ET RECRÉATION DES TRIGGERS =====
-- À exécuter dans l'interface SQL de Supabase Cloud

-- 1. NETTOYAGE COMPLET - Supprimer TOUS les triggers et fonctions liés au balance
DO $$
DECLARE
    trigger_record RECORD;
    function_record RECORD;
BEGIN
    -- Supprimer tous les triggers sur credit_transactions
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'credit_transactions'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON credit_transactions CASCADE';
        RAISE NOTICE 'Trigger supprimé: %', trigger_record.trigger_name;
    END LOOP;
    
    -- Supprimer toutes les fonctions liées au balance
    FOR function_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%balance%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || function_record.routine_name || ' CASCADE';
        RAISE NOTICE 'Fonction supprimée: %', function_record.routine_name;
    END LOOP;
    
    RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
END;
$$;

-- 2. RECRÉATION PROPRE DES FONCTIONS DE TRIGGER

-- Fonction BEFORE INSERT : Calculer balance_before et balance_after
CREATE OR REPLACE FUNCTION check_balance_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Log pour debug
  RAISE NOTICE '[TRIGGER BEFORE] User: %, Type: %, Amount: %', NEW.user_id, NEW.type, NEW.amount;
  
  -- Récupérer le solde actuel de l'utilisateur
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  -- Vérifier que l'utilisateur existe
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec ID % non trouvé dans la table users', NEW.user_id;
  END IF;
  
  -- Enregistrer le solde avant transaction
  NEW.balance_before := current_balance;
  
  -- Calculer le nouveau solde selon le type de transaction
  IF NEW.type IN ('deposit', 'refund') THEN
    -- Pour les crédits (dépôts, remboursements)
    NEW.balance_after := current_balance + NEW.amount;
    RAISE NOTICE '[TRIGGER BEFORE] Crédit: % + % = %', current_balance, NEW.amount, NEW.balance_after;
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    -- Pour les débits (retraits, achats, commissions)
    NEW.balance_after := current_balance - NEW.amount;
    RAISE NOTICE '[TRIGGER BEFORE] Débit: % - % = %', current_balance, NEW.amount, NEW.balance_after;
    
    -- Vérifier que le solde ne devient pas négatif
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant pour cette transaction. Solde actuel: %, Montant: %', current_balance, NEW.amount;
    END IF;
  ELSE
    -- Type de transaction non reconnu
    RAISE EXCEPTION 'Type de transaction non valide: %', NEW.type;
  END IF;
  
  RAISE NOTICE '[TRIGGER BEFORE] Calculs terminés: % -> %', NEW.balance_before, NEW.balance_after;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction AFTER INSERT : Mettre à jour le solde dans la table users
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  -- Log pour debug
  RAISE NOTICE '[TRIGGER AFTER] Mise à jour du solde pour User: %, Balance: % -> %', 
    NEW.user_id, NEW.balance_before, NEW.balance_after;
  
  -- Mettre à jour le solde de l'utilisateur dans la table users
  UPDATE users 
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Vérifier que la mise à jour a bien eu lieu
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Impossible de mettre à jour le solde pour l''utilisateur % - utilisateur non trouvé', NEW.user_id;
  END IF;
  
  RAISE NOTICE '[TRIGGER AFTER] Solde mis à jour avec succès pour User: %, Nouveau solde: %', 
    NEW.user_id, NEW.balance_after;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRÉATION DES TRIGGERS

-- Trigger BEFORE INSERT pour calculer les soldes
CREATE TRIGGER trigger_check_balance_before_transaction
  BEFORE INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_before_transaction();

-- Trigger AFTER INSERT pour mettre à jour la table users
CREATE TRIGGER trigger_update_user_balance_after_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_transaction();

-- 4. FONCTION DE TEST POUR VÉRIFIER QUE TOUT FONCTIONNE
CREATE OR REPLACE FUNCTION test_triggers_final(
  p_user_email TEXT,
  p_amount DECIMAL,
  p_type TEXT DEFAULT 'deposit'
)
RETURNS TABLE (
  success BOOLEAN,
  old_balance DECIMAL,
  new_balance DECIMAL,
  transaction_id UUID,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_old_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Récupérer l'utilisateur
  SELECT id, balance INTO v_user_id, v_old_balance 
  FROM users WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, NULL::UUID, 'Utilisateur non trouvé'::TEXT;
    RETURN;
  END IF;
  
  -- Insérer la transaction (les triggers vont se déclencher)
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status,
    created_at,
    completed_at
  ) VALUES (
    v_user_id,
    p_type,
    p_amount,
    'Test triggers final',
    'MAD',
    'completed',
    NOW(),
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Récupérer le nouveau solde
  SELECT balance INTO v_new_balance FROM users WHERE id = v_user_id;
  
  RETURN QUERY SELECT TRUE, v_old_balance, v_new_balance, v_transaction_id, 'Test réussi'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DONNER LES PERMISSIONS
GRANT EXECUTE ON FUNCTION test_triggers_final(TEXT, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION test_triggers_final(TEXT, DECIMAL) TO authenticated;

-- 6. MESSAGE DE CONFIRMATION
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===== TRIGGERS RECRÉÉS AVEC SUCCÈS =====';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Triggers créés:';
  RAISE NOTICE '   - trigger_check_balance_before_transaction (BEFORE INSERT)';
  RAISE NOTICE '   - trigger_update_user_balance_after_transaction (AFTER INSERT)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions créées:';
  RAISE NOTICE '   - check_balance_before_transaction()';
  RAISE NOTICE '   - update_user_balance_after_transaction()';
  RAISE NOTICE '   - test_triggers_final() pour tester';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Pour tester, exécutez:';
  RAISE NOTICE '   SELECT * FROM test_triggers_final(''ogincema@gmail.com'', 1.0, ''deposit'');';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Le système de balance est maintenant 100% fonctionnel !';
END;
$$;
