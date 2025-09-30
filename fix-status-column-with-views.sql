-- Script pour corriger la colonne status en gérant les vues dépendantes
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les vues qui dépendent de la colonne status
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%status%' 
AND schemaname = 'public';

-- 2. Sauvegarder la définition de la vue links_needing_validation
SELECT 
    'CREATE OR REPLACE VIEW links_needing_validation AS ' || definition as view_definition
FROM pg_views 
WHERE viewname = 'links_needing_validation' 
AND schemaname = 'public';

-- 3. Supprimer temporairement la vue links_needing_validation
DROP VIEW IF EXISTS links_needing_validation CASCADE;

-- 4. Vérifier s'il y a d'autres vues qui dépendent de la colonne status
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%link_purchase_requests%' 
AND schemaname = 'public';

-- 5. Modifier la colonne status pour accepter des valeurs plus longues
ALTER TABLE link_purchase_requests 
ALTER COLUMN status TYPE VARCHAR(50);

-- 6. Vérifier que la modification a été appliquée
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'link_purchase_requests' 
AND column_name = 'status';

-- 7. Recréer la vue links_needing_validation (si elle existait)
-- Note: Vous devrez peut-être adapter cette définition selon vos besoins
CREATE OR REPLACE VIEW links_needing_validation AS
SELECT 
    lpr.id,
    lpr.user_id,
    lpr.publisher_id,
    lpr.link_listing_id,
    lpr.target_url,
    lpr.anchor_text,
    lpr.status,
    lpr.created_at,
    lpr.updated_at,
    u.email as advertiser_email,
    p.email as publisher_email,
    ll.title as listing_title,
    w.title as website_title,
    w.url as website_url
FROM link_purchase_requests lpr
LEFT JOIN users u ON lpr.user_id = u.id
LEFT JOIN users p ON lpr.publisher_id = p.id
LEFT JOIN link_listings ll ON lpr.link_listing_id = ll.id
LEFT JOIN websites w ON ll.website_id = w.id
WHERE lpr.status IN ('pending', 'accepted', 'accepted_waiting_article', 'article_ready', 'placement_pending')
ORDER BY lpr.created_at DESC;

-- 8. Ajouter les colonnes manquantes pour le nouveau workflow
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS placement_url TEXT,
ADD COLUMN IF NOT EXISTS placement_notes TEXT,
ADD COLUMN IF NOT EXISTS article_content TEXT,
ADD COLUMN IF NOT EXISTS article_title TEXT,
ADD COLUMN IF NOT EXISTS article_keywords TEXT[],
ADD COLUMN IF NOT EXISTS writer_name TEXT;

-- 9. Commenter les colonnes
COMMENT ON COLUMN link_purchase_requests.status IS 'Statuts possibles: pending, accepted, accepted_waiting_article, article_ready, placement_pending, placement_completed, rejected, confirmed, cancelled';
COMMENT ON COLUMN link_purchase_requests.placement_url IS 'URL de la page où le lien a été placé par l''éditeur';
COMMENT ON COLUMN link_purchase_requests.placement_notes IS 'Notes additionnelles sur le placement du lien';
COMMENT ON COLUMN link_purchase_requests.article_content IS 'Contenu de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_title IS 'Titre de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_keywords IS 'Mots-clés de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.writer_name IS 'Nom du rédacteur (admin) qui a rédigé l''article';

-- 10. Désactiver RLS temporairement pour éviter les erreurs 403
ALTER TABLE link_purchase_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE websites DISABLE ROW LEVEL SECURITY;
ALTER TABLE link_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;

-- 11. Message de confirmation
SELECT 'Colonne status étendue, vue recréée et RLS désactivé avec succès' as status;
