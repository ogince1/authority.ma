-- Script pour supprimer complètement le système de chat de la base de données
-- Exécutez ce script dans votre base de données Supabase

-- 1. Supprimer les policies RLS liées au chat
DROP POLICY IF EXISTS "Users can view their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can update chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can delete chat messages" ON chat_messages;

-- 2. Supprimer les index liés à la table chat_messages
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_read;

-- 3. Supprimer la table chat_messages
DROP TABLE IF EXISTS chat_messages;

-- 4. Supprimer le type enum chat_sender
DROP TYPE IF EXISTS chat_sender;

-- 5. Supprimer les triggers liés au chat (s'il y en a)
-- Note: Les triggers seraient automatiquement supprimés avec la table

-- 6. Supprimer les fonctions liées au chat (s'il y en a)
-- Vous pouvez ajouter ici les DROP FUNCTION si nécessaire

-- Vérification que tout a été supprimé
SELECT 
    'Tables restantes avec "chat" dans le nom:' as info,
    table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%chat%' 
    AND table_schema = 'public';

SELECT 
    'Types restants avec "chat" dans le nom:' as info,
    typname 
FROM pg_type 
WHERE typname LIKE '%chat%';

SELECT 
    'Index restants avec "chat" dans le nom:' as info,
    indexname 
FROM pg_indexes 
WHERE indexname LIKE '%chat%' 
    AND schemaname = 'public'; 