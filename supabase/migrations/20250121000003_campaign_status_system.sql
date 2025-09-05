-- Migration pour ajouter le système de statut de campagne
-- et lier les commandes aux campagnes

-- 1. Ajouter une colonne status aux campagnes
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_editor_approval', 'approved', 'rejected', 'completed'));

-- 2. Ajouter une colonne campaign_id aux link_purchase_requests (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    ALTER TABLE link_purchase_requests 
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
    
    -- 3. Créer un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_campaign_id ON link_purchase_requests(campaign_id);
  END IF;
END $$;

-- 4. Mettre à jour les politiques RLS pour inclure campaign_id (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    DROP POLICY IF EXISTS "Users can view their own purchase requests" ON link_purchase_requests;
    CREATE POLICY "Users can view their own purchase requests" ON link_purchase_requests
    FOR SELECT USING (
      auth.uid() = user_id OR 
      auth.uid() = publisher_id OR
      EXISTS (
        SELECT 1 FROM campaigns 
        WHERE campaigns.id = link_purchase_requests.campaign_id 
        AND campaigns.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 5. Fonction pour mettre à jour le statut de la campagne
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une nouvelle demande d'achat avec campaign_id
  IF NEW.campaign_id IS NOT NULL THEN
    -- Mettre à jour le statut de la campagne
    UPDATE campaigns 
    SET status = 'pending_editor_approval',
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  -- Si le statut de la demande change
  IF OLD.status != NEW.status THEN
    -- Mettre à jour le statut de la campagne en fonction des demandes
    UPDATE campaigns 
    SET status = CASE 
      WHEN EXISTS (
        SELECT 1 FROM link_purchase_requests 
        WHERE campaign_id = campaigns.id 
        AND status = 'pending'
      ) THEN 'pending_editor_approval'
      WHEN EXISTS (
        SELECT 1 FROM link_purchase_requests 
        WHERE campaign_id = campaigns.id 
        AND status = 'rejected'
      ) THEN 'rejected'
      WHEN NOT EXISTS (
        SELECT 1 FROM link_purchase_requests 
        WHERE campaign_id = campaigns.id 
        AND status IN ('pending', 'rejected')
      ) THEN 'approved'
      ELSE campaigns.status
    END,
    updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour automatiser la mise à jour du statut (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    DROP TRIGGER IF EXISTS trigger_update_campaign_status ON link_purchase_requests;
    CREATE TRIGGER trigger_update_campaign_status
      AFTER INSERT OR UPDATE ON link_purchase_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_campaign_status();
  END IF;
END $$;

-- 7. Fonction pour obtenir les statistiques de campagne
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_uuid UUID)
RETURNS TABLE(
  total_requests INTEGER,
  pending_requests INTEGER,
  approved_requests INTEGER,
  rejected_requests INTEGER,
  total_spent DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE lpr.status = 'pending')::INTEGER as pending_requests,
    COUNT(*) FILTER (WHERE lpr.status = 'approved')::INTEGER as approved_requests,
    COUNT(*) FILTER (WHERE lpr.status = 'rejected')::INTEGER as rejected_requests,
    COALESCE(SUM(lpr.proposed_price) FILTER (WHERE lpr.status = 'approved'), 0) as total_spent
  FROM link_purchase_requests lpr
  WHERE lpr.campaign_id = campaign_uuid;
END;
$$ LANGUAGE plpgsql; 