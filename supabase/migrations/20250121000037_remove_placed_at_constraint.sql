-- Remove the problematic placed_at constraint completely
-- Date: 2025-01-21

-- Supprimer complètement la contrainte problématique
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS check_placed_at_consistency;
