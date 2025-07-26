-- Migration pour supprimer complètement le système de chat
-- Date: 2025-01-21
-- Description: Suppression de toutes les tables, types, index et policies liés au chat

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

-- Note: Les triggers et fonctions liés au chat sont automatiquement supprimés avec la table 