-- Migration pour corriger le type de timestamp de url_validation_date
-- Date: 2025-01-21

-- Corriger le type de timestamp pour url_validation_date
ALTER TABLE link_purchase_requests 
ALTER COLUMN url_validation_date TYPE TIMESTAMP WITH TIME ZONE;

-- S'assurer que la colonne peut être NULL
ALTER TABLE link_purchase_requests 
ALTER COLUMN url_validation_date DROP NOT NULL;

-- Ajouter une contrainte pour s'assurer que url_validation_date est cohérent
ALTER TABLE link_purchase_requests 
ADD CONSTRAINT check_url_validation_date 
CHECK (
  url_validation_date IS NULL OR 
  (url_validation_date IS NOT NULL AND url_validation_date > created_at)
); 