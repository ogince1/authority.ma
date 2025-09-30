-- ===== CORRECTION COMPLÈTE DES TRIGGERS POUR LE SYSTÈME DE BALANCE =====
-- À exécuter dans l'interface SQL de Supabase

-- 1. Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_update_user_balance_after_transaction ON credit_transactions;
DROP TRIGGER IF EXISTS trigger_check_balance_before_transaction ON credit_transactions;

-- 2. Supprimer les anciennes fonctions s'elles existent
DROP FUNCTION IF EXISTS update_user_balance_after_transaction();
DROP FUNCTION IF EXISTS check_balance_before_transaction();

-- 3. Créer la fonction pour vérifier le solde AVANT insertion
CREATE OR REPLACE FUNCTION check_balance_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Récupérer le solde actuel de l'utilisateur
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  -- Si l'utilisateur n'existe pas, lever une exception
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec ID % non trouvé', NEW.user_id;
  END IF;
  
  -- Calculer le nouveau solde selon le type de transaction
  IF NEW.type IN ('deposit', 'refund') THEN
    -- Pour les crédits (dépôts, remboursements)
    NEW.balance_after := current_balance + NEW.amount;
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    -- Pour les débits (retraits, achats, commissions)
    NEW.balance_after := current_balance - NEW.amount;
    
    -- Vérifier que le solde ne devient pas négatif
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant pour cette transaction. Solde actuel: %, Montant: %', current_balance, NEW.amount;
    END IF;
  ELSE
    -- Type de transaction non reconnu
    RAISE EXCEPTION 'Type de transaction non valide: %', NEW.type;
  END IF;
  
  -- Enregistrer le solde avant transaction
  NEW.balance_before := current_balance;
  
  -- Log pour debug (optionnel, peut être retiré en production)
  RAISE NOTICE 'Transaction préparée - User: %, Type: %, Amount: %, Balance: % -> %', 
    NEW.user_id, NEW.type, NEW.amount, NEW.balance_before, NEW.balance_after;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer la fonction pour mettre à jour le solde APRÈS insertion
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log pour debug (optionnel, peut être retiré en production)
  RAISE NOTICE 'Mise à jour du solde - User: %, Balance: % -> %', 
    NEW.user_id, NEW.balance_before, NEW.balance_after;
  
  -- Mettre à jour le solde de l'utilisateur dans la table users
  UPDATE users 
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Vérifier que la mise à jour a bien eu lieu
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impossible de mettre à jour le solde pour l''utilisateur %', NEW.user_id;
  END IF;
  
  -- Log de confirmation (optionnel, peut être retiré en production)
  RAISE NOTICE 'Solde mis à jour avec succès - User: %, Nouveau solde: %', 
    NEW.user_id, NEW.balance_after;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger BEFORE INSERT pour calculer les soldes
CREATE TRIGGER trigger_check_balance_before_transaction
  BEFORE INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_before_transaction();

-- 6. Créer le trigger AFTER INSERT pour mettre à jour la table users
CREATE TRIGGER trigger_update_user_balance_after_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_transaction();

-- 7. Fonction utilitaire pour tester les triggers
CREATE OR REPLACE FUNCTION test_balance_triggers(
  p_user_id UUID,
  p_type TEXT,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Test trigger'
)
RETURNS TABLE (
  success BOOLEAN,
  old_balance DECIMAL,
  new_balance DECIMAL,
  transaction_id UUID
) AS $$
DECLARE
  v_old_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO v_old_balance FROM users WHERE id = p_user_id;
  
  IF v_old_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, NULL::UUID;
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
    p_user_id,
    p_type,
    p_amount,
    p_description,
    'MAD',
    'completed',
    NOW(),
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Récupérer le nouveau solde
  SELECT balance INTO v_new_balance FROM users WHERE id = p_user_id;
  
  RETURN QUERY SELECT TRUE, v_old_balance, v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour vérifier l'état des triggers
CREATE OR REPLACE FUNCTION check_triggers_status()
RETURNS TABLE (
  trigger_name TEXT,
  table_name TEXT,
  function_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.trigger_name::TEXT,
    t.event_object_table::TEXT,
    t.action_statement::TEXT,
    CASE WHEN t.trigger_name IS NOT NULL THEN TRUE ELSE FALSE END
  FROM information_schema.triggers t
  WHERE t.event_object_table = 'credit_transactions'
    AND t.trigger_name LIKE '%balance%'
  ORDER BY t.trigger_name;
END;
$$ LANGUAGE plpgsql;

-- 9. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION test_balance_triggers(UUID, TEXT, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_triggers_status() TO authenticated;

-- 10. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ TRIGGERS DE BALANCE CONFIGURÉS AVEC SUCCÈS !';
  RAISE NOTICE 'Les triggers suivants ont été créés :';
  RAISE NOTICE '1. trigger_check_balance_before_transaction (BEFORE INSERT)';
  RAISE NOTICE '2. trigger_update_user_balance_after_transaction (AFTER INSERT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions utilitaires disponibles :';
  RAISE NOTICE '- test_balance_triggers() : pour tester les triggers';
  RAISE NOTICE '- check_triggers_status() : pour vérifier l''état des triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'Le système de balance est maintenant entièrement fonctionnel !';
END;
$$;
