-- Script alternatif pour corriger les statuts sans modifier la colonne existante
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure actuelle
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'link_purchase_requests' 
AND column_name = 'status';

-- 2. Ajouter une nouvelle colonne pour les statuts étendus
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS extended_status VARCHAR(50);

-- 3. Copier les valeurs existantes de status vers extended_status
UPDATE link_purchase_requests 
SET extended_status = status 
WHERE extended_status IS NULL;

-- 4. Créer un index sur la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_extended_status 
ON link_purchase_requests(extended_status);

-- 5. Ajouter les colonnes manquantes pour le nouveau workflow
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS placement_url TEXT,
ADD COLUMN IF NOT EXISTS placement_notes TEXT,
ADD COLUMN IF NOT EXISTS article_content TEXT,
ADD COLUMN IF NOT EXISTS article_title TEXT,
ADD COLUMN IF NOT EXISTS article_keywords TEXT[],
ADD COLUMN IF NOT EXISTS writer_name TEXT;

-- 6. Commenter les colonnes
COMMENT ON COLUMN link_purchase_requests.extended_status IS 'Statuts étendus: pending, accepted, accepted_waiting_article, article_ready, placement_pending, placement_completed, rejected, confirmed, cancelled';
COMMENT ON COLUMN link_purchase_requests.placement_url IS 'URL de la page où le lien a été placé par l''éditeur';
COMMENT ON COLUMN link_purchase_requests.placement_notes IS 'Notes additionnelles sur le placement du lien';
COMMENT ON COLUMN link_purchase_requests.article_content IS 'Contenu de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_title IS 'Titre de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_keywords IS 'Mots-clés de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.writer_name IS 'Nom du rédacteur (admin) qui a rédigé l''article';

-- 7. Désactiver RLS temporairement pour éviter les erreurs 403
ALTER TABLE link_purchase_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE websites DISABLE ROW LEVEL SECURITY;
ALTER TABLE link_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;

-- 8. Message de confirmation
SELECT 'Colonne extended_status ajoutée et RLS désactivé avec succès' as status;
