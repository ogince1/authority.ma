-- Migration pour le système de workflow avec confirmation
-- Date: 2025-01-21

-- Ajouter les nouveaux statuts pour les demandes d'achat
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS link_purchase_requests_status_check;

ALTER TABLE link_purchase_requests 
ADD CONSTRAINT link_purchase_requests_status_check 
CHECK (status IN (
  'pending',           -- En attente de réponse de l'éditeur
  'accepted',          -- Acceptée par l'éditeur, en attente de confirmation de l'annonceur
  'rejected',          -- Rejetée par l'éditeur
  'negotiating',       -- En négociation
  'pending_confirmation', -- Acceptée, en attente de confirmation de placement par l'annonceur
  'confirmed',         -- Confirmée par l'annonceur, paiement effectué
  'auto_confirmed'     -- Confirmée automatiquement après 48h
));

-- Ajouter les nouveaux champs pour le workflow
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_transaction_id UUID REFERENCES credit_transactions(id);

-- Ajouter un index pour les demandes en attente de confirmation
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_confirmation_deadline 
ON link_purchase_requests(confirmation_deadline) 
WHERE status = 'pending_confirmation';

-- Fonction pour mettre à jour le statut quand l'éditeur accepte
CREATE OR REPLACE FUNCTION accept_purchase_request(
  p_request_id UUID,
  p_placed_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Récupérer les détails de la demande
  SELECT * INTO v_request 
  FROM link_purchase_requests 
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
  -- Mettre à jour le statut et les champs
  UPDATE link_purchase_requests 
  SET 
    status = 'pending_confirmation',
    accepted_at = NOW(),
    confirmation_deadline = NOW() + INTERVAL '48 hours',
    placed_url = COALESCE(p_placed_url, placed_url),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour confirmer le placement par l'annonceur
CREATE OR REPLACE FUNCTION confirm_link_placement(
  p_request_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
  v_transaction_id UUID;
BEGIN
  -- Récupérer les détails de la demande
  SELECT * INTO v_request 
  FROM link_purchase_requests 
  WHERE id = p_request_id AND status = 'pending_confirmation';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà confirmée';
  END IF;
  
  -- Vérifier que le délai n'est pas dépassé
  IF v_request.confirmation_deadline < NOW() THEN
    RAISE EXCEPTION 'Délai de confirmation dépassé';
  END IF;
  
  -- Traiter le paiement
  SELECT process_link_purchase(p_request_id, 'balance') INTO v_transaction_id;
  
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

-- Fonction pour la confirmation automatique après 48h
CREATE OR REPLACE FUNCTION auto_confirm_expired_requests()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_request RECORD;
  v_transaction_id UUID;
BEGIN
  -- Traiter toutes les demandes expirées
  FOR v_request IN 
    SELECT * FROM link_purchase_requests 
    WHERE status = 'pending_confirmation' 
    AND confirmation_deadline < NOW()
  LOOP
    -- Traiter le paiement
    SELECT process_link_purchase(v_request.id, 'balance') INTO v_transaction_id;
    
    -- Mettre à jour le statut
    UPDATE link_purchase_requests 
    SET 
      status = 'auto_confirmed',
      auto_confirmed_at = NOW(),
      payment_transaction_id = v_transaction_id,
      updated_at = NOW()
    WHERE id = v_request.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Créer un job pour exécuter la confirmation automatique (à configurer dans pg_cron si disponible)
-- Pour l'instant, cette fonction sera appelée manuellement ou via une tâche externe

-- Ajouter des commentaires pour la documentation
COMMENT ON FUNCTION accept_purchase_request(UUID, TEXT) IS 'Accepte une demande d''achat et la met en attente de confirmation';
COMMENT ON FUNCTION confirm_link_placement(UUID) IS 'Confirme le placement d''un lien par l''annonceur et traite le paiement';
COMMENT ON FUNCTION auto_confirm_expired_requests() IS 'Confirme automatiquement les demandes expirées après 48h';
