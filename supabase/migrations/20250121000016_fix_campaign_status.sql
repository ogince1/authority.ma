-- Migration pour corriger les statuts de campagne
-- Ajouter le statut 'active' manquant et améliorer le workflow

-- 1. Supprimer l'ancienne contrainte de statut
ALTER TABLE campaigns 
DROP CONSTRAINT IF EXISTS campaigns_status_check;

-- 2. Ajouter la nouvelle contrainte avec tous les statuts
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('draft', 'pending_editor_approval', 'approved', 'active', 'rejected', 'completed', 'paused'));

-- 3. Ajouter des colonnes pour améliorer le suivi des campagnes
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS spent_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS target_urls TEXT[],
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id_status ON campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- 5. Fonction pour calculer automatiquement le montant dépensé
CREATE OR REPLACE FUNCTION update_campaign_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le montant dépensé de la campagne
  UPDATE campaigns 
  SET spent_amount = (
    SELECT COALESCE(SUM(proposed_price), 0)
    FROM link_purchase_requests 
    WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
    AND status = 'accepted'
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour automatiser la mise à jour du montant dépensé
DROP TRIGGER IF EXISTS trigger_update_campaign_spent ON link_purchase_requests;
CREATE TRIGGER trigger_update_campaign_spent
  AFTER INSERT OR UPDATE OR DELETE ON link_purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_spent_amount();

-- 7. Fonction pour obtenir les statistiques complètes de campagne
CREATE OR REPLACE FUNCTION get_campaign_complete_stats(campaign_uuid UUID)
RETURNS TABLE(
  total_requests INTEGER,
  pending_requests INTEGER,
  accepted_requests INTEGER,
  rejected_requests INTEGER,
  total_spent DECIMAL(10,2),
  total_budget DECIMAL(10,2),
  completion_rate DECIMAL(5,2),
  average_price DECIMAL(10,2),
  links_placed INTEGER,
  active_links INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_requests,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_requests,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_requests,
    COALESCE(SUM(proposed_price) FILTER (WHERE status = 'accepted'), 0) as total_spent,
    (SELECT budget FROM campaigns WHERE id = campaign_uuid) as total_budget,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0 
    END as completion_rate,
    CASE 
      WHEN COUNT(*) > 0 THEN AVG(proposed_price)
      ELSE 0 
    END as average_price,
    COUNT(*) FILTER (WHERE status = 'accepted' AND placed_url IS NOT NULL)::INTEGER as links_placed,
    COUNT(*) FILTER (WHERE status = 'accepted' AND placed_url IS NOT NULL)::INTEGER as active_links
  FROM link_purchase_requests 
  WHERE campaign_id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Mettre à jour les campagnes existantes pour avoir des valeurs par défaut
UPDATE campaigns 
SET 
  budget = 0,
  spent_amount = 0,
  performance_metrics = '{}',
  updated_at = NOW()
WHERE budget IS NULL OR spent_amount IS NULL;

-- 9. Commentaires pour documenter les statuts
COMMENT ON COLUMN campaigns.status IS 'Statuts possibles: draft, pending_editor_approval, approved, active, rejected, completed, paused';
COMMENT ON COLUMN campaigns.budget IS 'Budget total alloué à la campagne';
COMMENT ON COLUMN campaigns.spent_amount IS 'Montant déjà dépensé (calculé automatiquement)';
COMMENT ON COLUMN campaigns.performance_metrics IS 'Métriques de performance au format JSON'; 