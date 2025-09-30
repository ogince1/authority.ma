-- Script SQL simple et sûr pour supprimer les triggers problématiques
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les triggers spécifiques connus
DROP TRIGGER IF EXISTS update_campaign_metrics ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS sync_campaign_status ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS update_link_purchase_status ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS notify_publisher ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS update_purchase_metrics ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS check_placed_at_consistency ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS update_updated_at ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS validate_link_placement ON link_purchase_requests CASCADE;
DROP TRIGGER IF EXISTS update_purchase_request_status ON link_purchase_requests CASCADE;

-- 2. Supprimer les fonctions associées
DROP FUNCTION IF EXISTS update_campaign_metrics() CASCADE;
DROP FUNCTION IF EXISTS sync_campaign_status() CASCADE;
DROP FUNCTION IF EXISTS update_link_purchase_status() CASCADE;
DROP FUNCTION IF EXISTS notify_publisher() CASCADE;
DROP FUNCTION IF EXISTS update_purchase_metrics() CASCADE;
DROP FUNCTION IF EXISTS check_placed_at_consistency() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS validate_link_placement() CASCADE;
DROP FUNCTION IF EXISTS update_purchase_request_status() CASCADE;

-- 3. Supprimer les contraintes spécifiques
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS check_placed_at_consistency CASCADE;
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS link_purchase_requests_campaign_id_fkey CASCADE;

-- 4. Vérifier qu'il ne reste plus de triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'link_purchase_requests';

-- 5. Vérifier qu'il ne reste plus de contraintes de vérification
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%link_purchase%'
OR constraint_name LIKE '%placed%'
OR constraint_name LIKE '%campaign%';
