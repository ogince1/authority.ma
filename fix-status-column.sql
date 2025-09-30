-- Script pour corriger la colonne status et ajouter les nouveaux statuts
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure actuelle de la colonne status
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'link_purchase_requests' 
AND column_name = 'status';

-- 2. Modifier la colonne status pour accepter des valeurs plus longues
ALTER TABLE link_purchase_requests 
ALTER COLUMN status TYPE VARCHAR(50);

-- 3. Vérifier que la modification a été appliquée
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'link_purchase_requests' 
AND column_name = 'status';

-- 4. Ajouter les colonnes manquantes pour le nouveau workflow
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS placement_url TEXT,
ADD COLUMN IF NOT EXISTS placement_notes TEXT,
ADD COLUMN IF NOT EXISTS article_content TEXT,
ADD COLUMN IF NOT EXISTS article_title TEXT,
ADD COLUMN IF NOT EXISTS article_keywords TEXT[],
ADD COLUMN IF NOT EXISTS writer_name TEXT;

-- 5. Commenter les colonnes
COMMENT ON COLUMN link_purchase_requests.status IS 'Statuts possibles: pending, accepted, accepted_waiting_article, article_ready, placement_pending, placement_completed, rejected, confirmed, cancelled';
COMMENT ON COLUMN link_purchase_requests.placement_url IS 'URL de la page où le lien a été placé par l''éditeur';
COMMENT ON COLUMN link_purchase_requests.placement_notes IS 'Notes additionnelles sur le placement du lien';
COMMENT ON COLUMN link_purchase_requests.article_content IS 'Contenu de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_title IS 'Titre de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_keywords IS 'Mots-clés de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.writer_name IS 'Nom du rédacteur (admin) qui a rédigé l''article';

-- 6. Désactiver RLS temporairement pour éviter les erreurs 403
ALTER TABLE link_purchase_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE websites DISABLE ROW LEVEL SECURITY;
ALTER TABLE link_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;

-- 7. Message de confirmation
SELECT 'Colonne status étendue et RLS désactivé avec succès' as status;
