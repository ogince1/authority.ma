-- Script pour optimiser les performances de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Index pour les requêtes fréquentes sur link_purchase_requests
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_user_id ON link_purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_publisher_id ON link_purchase_requests(publisher_id);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_status ON link_purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_content_option ON link_purchase_requests(content_option);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_created_at ON link_purchase_requests(created_at DESC);

-- 2. Index pour les conversations
CREATE INDEX IF NOT EXISTS idx_conversations_purchase_request_id ON conversations(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_advertiser_id ON conversations(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_conversations_publisher_id ON conversations(publisher_id);

-- 3. Index pour les messages de conversation
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id ON conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_receiver_id ON conversation_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);

-- 4. Index pour les transactions de crédit
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- 5. Index pour les sites web
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);

-- 6. Index pour les listings
CREATE INDEX IF NOT EXISTS idx_link_listings_user_id ON link_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_link_listings_website_id ON link_listings(website_id);
CREATE INDEX IF NOT EXISTS idx_link_listings_status ON link_listings(status);

-- 7. Index pour les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 8. Vérifier les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('link_purchase_requests', 'conversations', 'conversation_messages', 'credit_transactions', 'websites', 'link_listings', 'users')
ORDER BY tablename, indexname;

-- 9. Message de confirmation
SELECT 'Index de performance créés avec succès' as status;
