-- Script SQL pour corriger la référence à la table campaigns

-- 1. Mettre à jour toutes les valeurs campaign_id à null
UPDATE link_purchase_requests 
SET campaign_id = NULL 
WHERE campaign_id IS NOT NULL;

-- 2. Supprimer la contrainte de clé étrangère vers campaigns
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS link_purchase_requests_campaign_id_fkey;

-- 3. Supprimer les triggers qui référencent campaigns
DROP TRIGGER IF EXISTS update_campaign_metrics ON link_purchase_requests;
DROP TRIGGER IF EXISTS sync_campaign_status ON link_purchase_requests;

-- 4. Supprimer les fonctions qui référencent campaigns
DROP FUNCTION IF EXISTS update_campaign_metrics();
DROP FUNCTION IF EXISTS sync_campaign_status();

-- 5. Optionnel: Supprimer complètement la colonne campaign_id
-- ALTER TABLE link_purchase_requests DROP COLUMN IF EXISTS campaign_id;

-- 6. Vérifier que la table campaigns n'existe plus
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'campaigns';
