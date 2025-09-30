-- Script SQL agressif pour supprimer TOUS les triggers et contraintes
-- ATTENTION: Ce script supprime tout ce qui pourrait causer des problèmes

-- 1. Supprimer TOUS les triggers sur link_purchase_requests (approche exhaustive)
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    -- Supprimer tous les triggers existants
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'link_purchase_requests'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON link_purchase_requests CASCADE';
        RAISE NOTICE 'Trigger supprimé: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 2. Supprimer TOUTES les contraintes de vérification
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Supprimer toutes les contraintes de vérification
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'link_purchase_requests' 
        AND constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS "' || constraint_record.constraint_name || '" CASCADE';
        RAISE NOTICE 'Contrainte supprimée: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 3. Supprimer TOUTES les fonctions qui pourraient référencer campaign_id
DROP FUNCTION IF EXISTS update_campaign_metrics() CASCADE;
DROP FUNCTION IF EXISTS sync_campaign_status() CASCADE;
DROP FUNCTION IF EXISTS update_link_purchase_status() CASCADE;
DROP FUNCTION IF EXISTS notify_publisher() CASCADE;
DROP FUNCTION IF EXISTS update_purchase_metrics() CASCADE;
DROP FUNCTION IF EXISTS check_placed_at_consistency() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS validate_link_placement() CASCADE;
DROP FUNCTION IF EXISTS update_purchase_request_status() CASCADE;

-- 4. Supprimer les contraintes de clés étrangères problématiques
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS link_purchase_requests_campaign_id_fkey CASCADE;

-- 5. Vérifier qu'il ne reste plus de triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'link_purchase_requests';

-- 6. Vérifier qu'il ne reste plus de contraintes de vérification
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%link_purchase%'
OR constraint_name LIKE '%placed%'
OR constraint_name LIKE '%campaign%';
