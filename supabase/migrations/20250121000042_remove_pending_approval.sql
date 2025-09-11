-- Migration pour supprimer le système d'approbation des sites web
-- Date: 2025-01-21

-- Mettre à jour tous les sites web en attente d'approbation vers actif
UPDATE websites 
SET status = 'active' 
WHERE status = 'pending_approval';

-- Mettre à jour les commentaires
COMMENT ON COLUMN websites.status IS 'Statut du site web: active, inactive, ou suspended (plus de pending_approval)';
