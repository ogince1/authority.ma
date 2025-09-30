-- Fix confirm_link_placement function to use correct process_link_purchase parameters
-- Date: 2025-01-21

-- Corriger la fonction confirm_link_placement pour utiliser les bons paramètres
CREATE OR REPLACE FUNCTION confirm_link_placement(p_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
  v_transaction_id UUID;
  v_result JSON;
BEGIN
  -- Récupérer les détails de la demande
  SELECT * INTO v_request FROM link_purchase_requests WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée';
  END IF;
  
  IF v_request.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'Demande non en attente de confirmation';
  END IF;
  
  -- Vérifier que le délai n'est pas dépassé
  IF v_request.confirmation_deadline < NOW() THEN
    RAISE EXCEPTION 'Délai de confirmation dépassé';
  END IF;
  
  -- Traiter le paiement avec les bons paramètres
  SELECT process_link_purchase(
    p_request_id, 
    v_request.user_id, 
    v_request.publisher_id, 
    v_request.proposed_price
  ) INTO v_result;
  
  -- Vérifier le résultat
  IF (v_result->>'success')::BOOLEAN = false THEN
    RAISE EXCEPTION 'Erreur lors du traitement du paiement: %', v_result->>'message';
  END IF;
  
  -- Récupérer l'ID de la transaction
  v_transaction_id := (v_result->>'transaction_id')::UUID;
  
  -- Mettre à jour le statut
  UPDATE link_purchase_requests 
  SET 
    status = 'confirmed',
    confirmed_at = NOW(),
    payment_transaction_id = v_transaction_id,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Corriger la fonction auto_confirm_expired_requests également
CREATE OR REPLACE FUNCTION auto_confirm_expired_requests()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_request RECORD;
  v_transaction_id UUID;
  v_result JSON;
BEGIN
  -- Traiter toutes les demandes expirées
  FOR v_request IN 
    SELECT * FROM link_purchase_requests 
    WHERE status = 'pending_confirmation' 
    AND confirmation_deadline < NOW()
  LOOP
    -- Traiter le paiement avec les bons paramètres
    SELECT process_link_purchase(
      v_request.id, 
      v_request.user_id, 
      v_request.publisher_id, 
      v_request.proposed_price
    ) INTO v_result;
    
    -- Vérifier le résultat
    IF (v_result->>'success')::BOOLEAN = true THEN
      -- Récupérer l'ID de la transaction
      v_transaction_id := (v_result->>'transaction_id')::UUID;
      
      -- Mettre à jour le statut
      UPDATE link_purchase_requests 
      SET 
        status = 'auto_confirmed',
        auto_confirmed_at = NOW(),
        payment_transaction_id = v_transaction_id,
        updated_at = NOW()
      WHERE id = v_request.id;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
