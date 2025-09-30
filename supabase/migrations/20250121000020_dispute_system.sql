-- Migration pour un système de dispute et résolution
-- Gestion des réclamations, arbitrage et remboursements automatiques

-- 1. Créer une table pour les disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexte de la dispute
  purchase_request_id UUID REFERENCES link_purchase_requests(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Parties impliquées
  initiator_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Celui qui ouvre la dispute
  respondent_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Celui qui répond
  
  -- Détails de la dispute
  dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN (
    'link_not_placed', 'link_removed', 'wrong_url', 'wrong_anchor_text', 
    'poor_quality', 'late_delivery', 'non_compliance', 'other'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Statut de la dispute
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN (
    'open', 'under_review', 'resolved', 'closed', 'escalated'
  )),
  
  -- Résolution
  resolution_type VARCHAR(50) CHECK (resolution_type IN (
    'refund_full', 'refund_partial', 'replacement', 'compensation', 'dismissed'
  )),
  resolution_amount DECIMAL(10,2),
  resolution_notes TEXT,
  
  -- Arbitrage
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  
  -- Dates importantes
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  evidence_files TEXT[], -- URLs des fichiers de preuve
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer une table pour les messages de dispute
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contenu du message
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'comment' CHECK (message_type IN (
    'comment', 'evidence', 'resolution_proposal', 'admin_decision'
  )),
  
  -- Fichiers attachés
  attachments TEXT[],
  
  -- Visibilité
  is_internal BOOLEAN DEFAULT false, -- Messages visibles seulement par l'admin
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer une table pour les remboursements automatiques
CREATE TABLE IF NOT EXISTS automatic_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES credit_transactions(id) ON DELETE CASCADE,
  
  -- Détails du remboursement
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason VARCHAR(100) NOT NULL,
  refund_type VARCHAR(30) DEFAULT 'automatic' CHECK (refund_type IN (
    'automatic', 'manual', 'partial'
  )),
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processed', 'completed', 'failed'
  )),
  
  -- Métadonnées
  processing_notes TEXT,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_disputes_purchase_request ON disputes(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_disputes_campaign ON disputes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator ON disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_respondent ON disputes(respondent_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_type ON disputes(dispute_type);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_at ON disputes(opened_at);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender_id ON dispute_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_automatic_refunds_dispute_id ON automatic_refunds(dispute_id);
CREATE INDEX IF NOT EXISTS idx_automatic_refunds_status ON automatic_refunds(status);

-- 5. Fonction pour créer une dispute
CREATE OR REPLACE FUNCTION create_dispute(
  p_purchase_request_id UUID,
  p_initiator_id UUID,
  p_dispute_type VARCHAR(50),
  p_title TEXT,
  p_description TEXT,
  p_evidence_files TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  dispute_id UUID;
  purchase_request_record RECORD;
  respondent_id UUID;
BEGIN
  -- Récupérer les informations de la demande d'achat
  SELECT * INTO purchase_request_record
  FROM link_purchase_requests
  WHERE id = p_purchase_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande d''achat non trouvée';
  END IF;
  
  -- Déterminer le répondant (l'autre partie)
  IF p_initiator_id = purchase_request_record.user_id THEN
    respondent_id := purchase_request_record.publisher_id;
  ELSE
    respondent_id := purchase_request_record.user_id;
  END IF;
  
  -- Créer la dispute
  INSERT INTO disputes (
    purchase_request_id, campaign_id, initiator_id, respondent_id,
    dispute_type, title, description, evidence_files
  ) VALUES (
    p_purchase_request_id, purchase_request_record.campaign_id, 
    p_initiator_id, respondent_id, p_dispute_type, p_title, 
    p_description, p_evidence_files
  ) RETURNING id INTO dispute_id;
  
  -- Créer un message initial
  INSERT INTO dispute_messages (
    dispute_id, sender_id, message, message_type
  ) VALUES (
    dispute_id, p_initiator_id, p_description, 'comment'
  );
  
  -- Créer des notifications pour les parties impliquées
  PERFORM create_advanced_notification(
    respondent_id,
    'Nouvelle dispute ouverte',
    'Une dispute a été ouverte concernant votre demande d''achat de lien.',
    'warning',
    'high',
    '/dashboard/disputes/' || dispute_id,
    'dispute_opened',
    jsonb_build_object('dispute_id', dispute_id, 'dispute_type', p_dispute_type)
  );
  
  RETURN dispute_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour résoudre une dispute
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_dispute_id UUID,
  p_resolution_type VARCHAR(50),
  p_resolution_amount DECIMAL DEFAULT NULL,
  p_resolution_notes TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  dispute_record RECORD;
  refund_amount DECIMAL(10,2);
BEGIN
  -- Récupérer les informations de la dispute
  SELECT * INTO dispute_record
  FROM disputes
  WHERE id = p_dispute_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mettre à jour la dispute
  UPDATE disputes 
  SET 
    status = 'resolved',
    resolution_type = p_resolution_type,
    resolution_amount = p_resolution_amount,
    resolution_notes = p_resolution_notes,
    assigned_admin_id = p_admin_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_dispute_id;
  
  -- Créer un remboursement automatique si nécessaire
  IF p_resolution_type IN ('refund_full', 'refund_partial') AND p_resolution_amount > 0 THEN
    -- Récupérer le montant de la transaction originale
    SELECT proposed_price INTO refund_amount
    FROM link_purchase_requests
    WHERE id = dispute_record.purchase_request_id;
    
    -- Ajuster le montant selon le type de remboursement
    IF p_resolution_type = 'refund_full' THEN
      refund_amount := refund_amount;
    ELSE
      refund_amount := LEAST(refund_amount, p_resolution_amount);
    END IF;
    
    -- Créer l'entrée de remboursement automatique
    INSERT INTO automatic_refunds (
      dispute_id, refund_amount, refund_reason, refund_type
    ) VALUES (
      p_dispute_id, refund_amount, 
      'Remboursement automatique - ' || p_resolution_type,
      'automatic'
    );
  END IF;
  
  -- Créer des notifications pour les parties
  PERFORM create_advanced_notification(
    dispute_record.initiator_id,
    'Dispute résolue',
    'Votre dispute a été résolue. Type: ' || p_resolution_type,
    'success',
    'normal',
    '/dashboard/disputes/' || p_dispute_id,
    'dispute_resolved',
    jsonb_build_object('dispute_id', p_dispute_id, 'resolution_type', p_resolution_type)
  );
  
  PERFORM create_advanced_notification(
    dispute_record.respondent_id,
    'Dispute résolue',
    'La dispute a été résolue. Type: ' || p_resolution_type,
    'success',
    'normal',
    '/dashboard/disputes/' || p_dispute_id,
    'dispute_resolved',
    jsonb_build_object('dispute_id', p_dispute_id, 'resolution_type', p_resolution_type)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour traiter les remboursements automatiques
CREATE OR REPLACE FUNCTION process_automatic_refunds()
RETURNS INTEGER AS $$
DECLARE
  refund_record RECORD;
  processed_count INTEGER := 0;
  purchase_request_record RECORD;
BEGIN
  -- Traiter les remboursements en attente
  FOR refund_record IN 
    SELECT ar.*, d.initiator_id, d.respondent_id
    FROM automatic_refunds ar
    JOIN disputes d ON ar.dispute_id = d.id
    WHERE ar.status = 'pending'
  LOOP
    BEGIN
      -- Récupérer les informations de la demande d'achat
      SELECT * INTO purchase_request_record
      FROM link_purchase_requests
      WHERE id = (
        SELECT purchase_request_id 
        FROM disputes 
        WHERE id = refund_record.dispute_id
      );
      
      -- Créer la transaction de remboursement pour l'annonceur
      INSERT INTO credit_transactions (
        user_id, type, amount, description, related_purchase_request_id
      ) VALUES (
        purchase_request_record.user_id,
        'refund',
        refund_record.refund_amount,
        'Remboursement automatique - ' || refund_record.refund_reason,
        purchase_request_record.id
      );
      
      -- Créer la transaction de débit pour l'éditeur
      INSERT INTO credit_transactions (
        user_id, type, amount, description, related_purchase_request_id
      ) VALUES (
        purchase_request_record.publisher_id,
        'commission',
        -refund_record.refund_amount,
        'Remboursement automatique - ' || refund_record.refund_reason,
        purchase_request_record.id
      );
      
      -- Marquer le remboursement comme traité
      UPDATE automatic_refunds 
      SET 
        status = 'completed',
        processed_at = NOW()
      WHERE id = refund_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- En cas d'erreur, marquer comme échoué
      UPDATE automatic_refunds 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        processed_at = NOW()
      WHERE id = refund_record.id;
    END;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour obtenir les statistiques de disputes
CREATE OR REPLACE FUNCTION get_dispute_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  total_disputes INTEGER,
  open_disputes INTEGER,
  resolved_disputes INTEGER,
  escalated_disputes INTEGER,
  total_refunds DECIMAL(10,2),
  average_resolution_time_hours DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_disputes,
    COUNT(*) FILTER (WHERE status = 'open')::INTEGER as open_disputes,
    COUNT(*) FILTER (WHERE status = 'resolved')::INTEGER as resolved_disputes,
    COUNT(*) FILTER (WHERE status = 'escalated')::INTEGER as escalated_disputes,
    COALESCE(SUM(ar.refund_amount) FILTER (WHERE ar.status = 'completed'), 0) as total_refunds,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'resolved') > 0 THEN
        AVG(EXTRACT(EPOCH FROM (resolved_at - opened_at)) / 3600) FILTER (WHERE status = 'resolved')
      ELSE 0 
    END as average_resolution_time_hours
  FROM disputes d
  LEFT JOIN automatic_refunds ar ON d.id = ar.dispute_id
  WHERE user_uuid IS NULL OR initiator_id = user_uuid OR respondent_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 9. Vue pour les disputes nécessitant une attention admin
CREATE OR REPLACE VIEW disputes_needing_admin_attention AS
SELECT 
  d.id,
  d.title,
  d.dispute_type,
  d.status,
  d.opened_at,
  d.initiator_id,
  d.respondent_id,
  u1.name as initiator_name,
  u2.name as respondent_name,
  d.purchase_request_id,
  lpr.proposed_price,
  CASE 
    WHEN d.status = 'open' AND d.opened_at < NOW() - INTERVAL '48 hours' THEN 'high'
    WHEN d.status = 'open' AND d.opened_at < NOW() - INTERVAL '24 hours' THEN 'medium'
    ELSE 'low'
  END as priority
FROM disputes d
JOIN users u1 ON d.initiator_id = u1.id
JOIN users u2 ON d.respondent_id = u2.id
JOIN link_purchase_requests lpr ON d.purchase_request_id = lpr.id
WHERE d.status IN ('open', 'under_review')
ORDER BY 
  CASE 
    WHEN d.status = 'open' AND d.opened_at < NOW() - INTERVAL '48 hours' THEN 1
    WHEN d.status = 'open' AND d.opened_at < NOW() - INTERVAL '24 hours' THEN 2
    ELSE 3
  END,
  d.opened_at ASC;

-- 10. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_disputes_updated_at ON disputes;
CREATE TRIGGER trigger_update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- 12. Commentaires pour documenter le système
COMMENT ON TABLE disputes IS 'Système de disputes et réclamations';
COMMENT ON TABLE dispute_messages IS 'Messages échangés dans le cadre d''une dispute';
COMMENT ON TABLE automatic_refunds IS 'Remboursements automatiques liés aux disputes';
COMMENT ON COLUMN disputes.dispute_type IS 'Type: link_not_placed, link_removed, wrong_url, etc.';
COMMENT ON COLUMN disputes.status IS 'Statut: open, under_review, resolved, closed, escalated';
COMMENT ON COLUMN disputes.resolution_type IS 'Type de résolution: refund_full, refund_partial, replacement, etc.'; 