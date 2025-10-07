-- ============================================================
-- FIX URGENT: Problème de paiement éditeur
-- Bug: "Solde insuffisant: 0.00 - 140.00 = -140.00"
-- Date: 2025-01-07
-- ============================================================

-- PROBLÈMES IDENTIFIÉS:
-- 1. Le type 'commission' est traité comme un DÉBIT dans le trigger
-- 2. L'annonceur n'est pas débité lors de la création de la demande
-- 3. Aucun crédit n'est envoyé à l'éditeur lors de l'acceptation

-- ============================================================
-- SOLUTION 1: Corriger le trigger pour traiter 'commission' comme CRÉDIT
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_balance_before_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance NUMERIC(10,2);
BEGIN
  -- Récupérer le solde actuel de l'utilisateur
  SELECT balance INTO current_balance
  FROM users
  WHERE id = NEW.user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', NEW.user_id;
  END IF;
  
  NEW.balance_before := current_balance;
  
  -- Calculer le nouveau solde selon le type
  -- CRÉDITS (+) : deposit, refund, commission, payment_received, earn
  -- DÉBITS (-) : withdrawal, purchase, payment_sent
  
  IF NEW.type IN ('deposit', 'refund', 'commission', 'payment_received', 'earn') THEN
    -- CRÉDIT: Ajouter au solde
    NEW.balance_after := current_balance + NEW.amount;
    
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'payment_sent') THEN
    -- DÉBIT: Soustraire du solde
    NEW.balance_after := current_balance - NEW.amount;
    
    -- Vérifier que le solde ne devient pas négatif
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant: % - % = %', current_balance, NEW.amount, NEW.balance_after;
    END IF;
    
  ELSE
    -- Type non reconnu
    RAISE EXCEPTION 'Type de transaction non valide: %. Types valides: deposit, refund, commission, payment_received, earn, withdrawal, purchase, payment_sent', NEW.type;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- SOLUTION 2: Mettre à jour le trigger après UPDATE de balance
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_balance_after_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour le solde de l'utilisateur
  UPDATE users
  SET 
    balance = NEW.balance_after,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_update_balance_after_transaction ON credit_transactions;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_update_balance_after_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_transaction();

-- ============================================================
-- SOLUTION 3: Fonction helper pour créer transactions
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_payment_transaction(
  p_advertiser_id UUID,
  p_publisher_id UUID,
  p_request_id UUID,
  p_total_amount NUMERIC,
  p_publisher_amount NUMERIC,
  p_platform_commission NUMERIC,
  p_description TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_advertiser_balance NUMERIC;
  v_publisher_balance NUMERIC;
BEGIN
  -- Vérifier le solde de l'annonceur
  SELECT balance INTO v_advertiser_balance
  FROM users
  WHERE id = p_advertiser_id;
  
  IF v_advertiser_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Annonceur non trouvé');
  END IF;
  
  IF v_advertiser_balance < p_total_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Solde insuffisant', 
      'balance', v_advertiser_balance,
      'required', p_total_amount
    );
  END IF;
  
  -- Débiter l'annonceur
  INSERT INTO credit_transactions (
    user_id, type, amount, description,
    related_purchase_request_id, status
  ) VALUES (
    p_advertiser_id, 
    'purchase', 
    p_total_amount, 
    p_description || ' (Paiement annonceur)',
    p_request_id,
    'completed'
  );
  
  -- Créditer l'éditeur
  INSERT INTO credit_transactions (
    user_id, type, amount, description,
    related_purchase_request_id, status,
    commission_amount, net_amount
  ) VALUES (
    p_publisher_id,
    'commission',  -- Maintenant traité comme CRÉDIT
    p_publisher_amount,
    p_description || ' (Paiement éditeur)',
    p_request_id,
    'completed',
    p_platform_commission,
    p_publisher_amount
  );
  
  RETURN json_build_object(
    'success', true,
    'advertiser_debited', p_total_amount,
    'publisher_credited', p_publisher_amount,
    'platform_commission', p_platform_commission
  );
END;
$$;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FIX PAIEMENT ÉDITEUR - APPLIQUÉ';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger corrigé: commission = CRÉDIT';
  RAISE NOTICE '✅ Fonction helper créée pour paiements';
  RAISE NOTICE '✅ Types de transactions validés:';
  RAISE NOTICE '   CRÉDITS: deposit, refund, commission, payment_received, earn';
  RAISE NOTICE '   DÉBITS: withdrawal, purchase, payment_sent';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape: Redéployer le frontend avec le code corrigé';
  RAISE NOTICE '============================================';
END $$;
