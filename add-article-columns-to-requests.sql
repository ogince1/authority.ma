-- Script pour ajouter les colonnes de rédaction d'articles aux demandes d'achat de liens
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour la rédaction d'articles dans link_purchase_requests
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS article_content TEXT,
ADD COLUMN IF NOT EXISTS article_title TEXT,
ADD COLUMN IF NOT EXISTS article_keywords TEXT[],
ADD COLUMN IF NOT EXISTS writer_name TEXT;

-- Commenter les colonnes pour la documentation
COMMENT ON COLUMN link_purchase_requests.article_content IS 'Contenu de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_title IS 'Titre de l''article rédigé par la plateforme';
COMMENT ON COLUMN link_purchase_requests.article_keywords IS 'Mots-clés ciblés dans l''article';
COMMENT ON COLUMN link_purchase_requests.writer_name IS 'Nom du rédacteur (admin qui a rédigé l''article)';

-- Créer des index pour faciliter les recherches
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_article_title ON link_purchase_requests(article_title);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_writer_name ON link_purchase_requests(writer_name);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_content_option ON link_purchase_requests(content_option);

-- Mettre à jour les commentaires des colonnes existantes
COMMENT ON COLUMN link_purchase_requests.content_option IS 'Option de contenu: platform (rédigé par la plateforme) ou custom (fourni par l''annonceur)';
COMMENT ON COLUMN link_purchase_requests.custom_content IS 'Contenu personnalisé fourni par l''annonceur (si content_option = custom)';
