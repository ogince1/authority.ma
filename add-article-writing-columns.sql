-- Script pour ajouter les colonnes nécessaires à la rédaction d'articles par la plateforme
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour la rédaction d'articles
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS article_content TEXT,
ADD COLUMN IF NOT EXISTS article_title TEXT,
ADD COLUMN IF NOT EXISTS article_keywords TEXT[],
ADD COLUMN IF NOT EXISTS writer_name TEXT;

-- Commenter les colonnes pour la documentation
COMMENT ON COLUMN service_requests.article_content IS 'Contenu de l''article rédigé par la plateforme';
COMMENT ON COLUMN service_requests.article_title IS 'Titre de l''article rédigé par la plateforme';
COMMENT ON COLUMN service_requests.article_keywords IS 'Mots-clés ciblés dans l''article';
COMMENT ON COLUMN service_requests.writer_name IS 'Nom du rédacteur (admin qui a rédigé l''article)';

-- Créer un index sur les articles pour faciliter les recherches
CREATE INDEX IF NOT EXISTS idx_service_requests_article_title ON service_requests(article_title);
CREATE INDEX IF NOT EXISTS idx_service_requests_writer_name ON service_requests(writer_name);

-- Mettre à jour les commentaires des colonnes existantes
COMMENT ON COLUMN service_requests.placement_details IS 'Détails du placement fournis par le client';
COMMENT ON COLUMN service_requests.execution_notes IS 'Notes d''exécution par l''admin';
COMMENT ON COLUMN service_requests.result_report IS 'Rapport final avec liens créés';
COMMENT ON COLUMN service_requests.result_links IS 'Liens créés par la plateforme (JSON array)';
