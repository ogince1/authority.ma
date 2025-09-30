-- Script pour ajouter les nouveaux statuts pour le processus de confirmation en deux étapes
-- À exécuter dans Supabase SQL Editor

-- Ajouter les nouveaux statuts possibles pour link_purchase_requests
-- Les statuts existants: pending, accepted, rejected, confirmed, cancelled
-- Nouveaux statuts à ajouter:

-- 1. accepted_waiting_article: Demande acceptée par l'éditeur, en attente de rédaction d'article par l'admin
-- 2. article_ready: Article rédigé par l'admin, en attente de placement par l'éditeur  
-- 3. placement_pending: Éditeur doit ajouter l'URL de placement
-- 4. placement_completed: URL de placement ajoutée, demande finalisée

-- Note: Ces statuts seront gérés côté application, pas de contrainte de base de données nécessaire
-- Mais on peut ajouter des commentaires pour documentation

COMMENT ON COLUMN link_purchase_requests.status IS 'Statuts possibles: pending, accepted, accepted_waiting_article, article_ready, placement_pending, placement_completed, rejected, confirmed, cancelled';

-- Ajouter une colonne pour stocker l'URL de placement
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS placement_url TEXT,
ADD COLUMN IF NOT EXISTS placement_notes TEXT;

-- Commenter les nouvelles colonnes
COMMENT ON COLUMN link_purchase_requests.placement_url IS 'URL de la page où le lien a été placé par l''éditeur';
COMMENT ON COLUMN link_purchase_requests.placement_notes IS 'Notes additionnelles sur le placement du lien';
