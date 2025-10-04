-- Fix placed_at constraint in link_purchase_requests table
-- Date: 2025-01-21

-- Supprimer la contrainte problématique
ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS check_placed_at_consistency;

-- Créer une nouvelle contrainte plus permissive
ALTER TABLE link_purchase_requests ADD CONSTRAINT check_placed_at_consistency 
CHECK (
  (placed_at IS NULL AND placed_url IS NULL) OR 
  (placed_at IS NOT NULL AND placed_url IS NOT NULL)
);
