-- Migration pour supprimer temporairement la contrainte des catégories
-- Date: 2025-01-21

-- Supprimer la contrainte CHECK pour permettre la mise à jour des catégories
ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_category_check;
