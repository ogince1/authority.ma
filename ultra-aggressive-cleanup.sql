-- Script SQL ultra-agressif pour supprimer TOUT ce qui pourrait causer des problèmes
-- ATTENTION: Ce script supprime tout ce qui pourrait référencer campaign_id

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

-- 2. Supprimer TOUTES les fonctions qui pourraient référencer campaign_id
DO $$ 
DECLARE
    function_record RECORD;
BEGIN
    -- Supprimer toutes les fonctions qui contiennent campaign_id
    FOR function_record IN 
        SELECT routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND (
            routine_name LIKE '%campaign%' 
            OR routine_name LIKE '%purchase%'
            OR routine_name LIKE '%link%'
            OR routine_definition LIKE '%campaign_id%'
        )
    LOOP
        EXECUTE 'DROP ' || function_record.routine_type || ' IF EXISTS ' || function_record.routine_name || '() CASCADE';
        RAISE NOTICE 'Fonction supprimée: %', function_record.routine_name;
    END LOOP;
END $$;

-- 3. Supprimer TOUTES les contraintes de vérification
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

-- 4. Supprimer les contraintes de clés étrangères problématiques
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS link_purchase_requests_campaign_id_fkey CASCADE;

-- 5. Vérifier qu'il ne reste plus rien
SELECT 'Triggers restants:' as info;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'link_purchase_requests';

SELECT 'Fonctions restantes:' as info;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND (routine_name LIKE '%campaign%' OR routine_name LIKE '%purchase%' OR routine_name LIKE '%link%');

SELECT 'Contraintes restantes:' as info;
SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'link_purchase_requests';
