-- Simplify process_link_purchase function to avoid credit_transactions issues
-- Date: 2025-01-21

-- Recréer la fonction process_link_purchase sans les transactions de crédit pour l'instant
CREATE OR REPLACE FUNCTION process_link_purchase(
  p_purchase_request_id UUID,
  p_advertiser_id UUID,
  p_publisher_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS JSON AS $$
DECLARE
  v_platform_fee DECIMAL(10,2);
  v_publisher_amount DECIMAL(10,2);
  v_transaction_id UUID;
  v_advertiser_balance DECIMAL(10,2);
  v_publisher_balance DECIMAL(10,2);
  v_link_listing_id UUID;
BEGIN
  -- Calculer les montants
  v_platform_fee := p_amount * 0.10; -- 10% de commission
  v_publisher_amount := p_amount - v_platform_fee;
  
  -- Récupérer l'ID du lien
  SELECT link_listing_id INTO v_link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id;
  
  -- Vérifier le solde de l'annonceur
  SELECT balance INTO v_advertiser_balance FROM users WHERE id = p_advertiser_id;
  IF v_advertiser_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Solde insuffisant');
  END IF;
  
  -- Récupérer le solde de l'éditeur avant la transaction
  SELECT balance INTO v_publisher_balance FROM users WHERE id = p_publisher_id;
  
  -- Créer la transaction d'abord
  INSERT INTO link_purchase_transactions (
    purchase_request_id,
    advertiser_id,
    publisher_id,
    link_listing_id,
    amount,
    platform_fee,
    publisher_amount,
    status,
    completed_at
  ) VALUES (
    p_purchase_request_id,
    p_advertiser_id,
    p_publisher_id,
    v_link_listing_id,
    p_amount,
    v_platform_fee,
    v_publisher_amount,
    'completed',
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Débiter l'annonceur
  UPDATE users SET balance = balance - p_amount WHERE id = p_advertiser_id;
  
  -- Créditer l'éditeur
  UPDATE users SET balance = balance + v_publisher_amount WHERE id = p_publisher_id;
  
  -- Mettre à jour le statut de la demande
  UPDATE link_purchase_requests 
  SET status = 'accepted', 
      updated_at = NOW()
  WHERE id = p_purchase_request_id;
  
  -- Créer les transactions de crédit simples (sans related_transaction_id)
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    related_link_listing_id,
    related_purchase_request_id,
    balance_before,
    balance_after
  ) VALUES 
  (p_advertiser_id, 'purchase', p_amount, 'Achat de lien', 
   v_link_listing_id, p_purchase_request_id, v_advertiser_balance, v_advertiser_balance - p_amount),
  (p_publisher_id, 'deposit', v_publisher_amount, 'Vente de lien',
   v_link_listing_id, p_purchase_request_id, v_publisher_balance, v_publisher_balance + v_publisher_amount);
  
  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;
