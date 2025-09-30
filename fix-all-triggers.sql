-- Script SQL complet pour supprimer tous les triggers et fonctions problématiques
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer tous les triggers sur link_purchase_requests
DROP TRIGGER IF EXISTS update_campaign_metrics ON link_purchase_requests;
DROP TRIGGER IF EXISTS sync_campaign_status ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_link_purchase_status ON link_purchase_requests;
DROP TRIGGER IF EXISTS notify_publisher ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_purchase_metrics ON link_purchase_requests;
DROP TRIGGER IF EXISTS check_placed_at_consistency ON link_purchase_requests;
DROP TRIGGER IF EXISTS update_updated_at ON link_purchase_requests;

-- 2. Supprimer les fonctions associées
DROP FUNCTION IF EXISTS update_campaign_metrics();
DROP FUNCTION IF EXISTS sync_campaign_status();
DROP FUNCTION IF EXISTS update_link_purchase_status();
DROP FUNCTION IF EXISTS notify_publisher();
DROP FUNCTION IF EXISTS update_purchase_metrics();
DROP FUNCTION IF EXISTS check_placed_at_consistency();

-- 3. Supprimer les contraintes de vérification qui pourraient référencer campaign_id
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS check_placed_at_consistency;

-- 4. Vérifier que la table campaigns n'existe plus
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'campaigns';

-- 5. Vérifier les triggers restants sur link_purchase_requests
-- SELECT trigger_name, event_manipulation, action_statement 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'link_purchase_requests';
