-- Script SQL final et simple pour supprimer les triggers problématiques
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer tous les triggers sur link_purchase_requests
DROP TRIGGER IF EXISTS update_campaign_metrics ON link_purchase_requests;
DROP TRIGGER IF EXISTS sync_campaign_status ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_link_purchase_status ON link_purchase_requests;
DROP TRIGGER IF EXISTS notify_publisher ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_purchase_metrics ON link_purchase_requests;
DROP TRIGGER IF EXISTS check_placed_at_consistency ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_updated_at ON link_purchase_requests;
DROP TRIGGER IF EXISTS validate_link_placement ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_purchase_request_status ON link_purchase_requests;

-- 2. Supprimer toutes les fonctions associées
DROP FUNCTION IF EXISTS update_campaign_metrics();
DROP FUNCTION IF EXISTS sync_campaign_status();
DROP FUNCTION IF EXISTS update_link_purchase_status();
DROP FUNCTION IF EXISTS notify_publisher();
DROP FUNCTION IF EXISTS update_purchase_ens qui utlise CAT =W ....metrics();
DROP FUNCTION IF EXISTS check_placed_at_consistency();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS validate_link_placement();
DROP FUNCTION IF EXISTS update_purchase_request_status();

-- 3. Supprimer les contraintes
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS check_placed_at_consistency;
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS link_purchase_requests_campaign_id_fkey;

-- 4. Vérifier les triggers restants
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'link_purchase_requests';

-- 5. Vérifier les fonctions restantes
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%campaign%' OR routine_name LIKE '%purchase%';
