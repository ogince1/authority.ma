-- Migration pour ajouter le champ placed_url à link_purchase_requests
-- Ce champ permettra à l'éditeur d'indiquer l'URL où le lien a été placé

ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS placed_url TEXT,
ADD COLUMN IF NOT EXISTS placed_at TIMESTAMP WITH TIME ZONE;

-- Ajouter une contrainte pour s'assurer que placed_url est une URL valide
ALTER TABLE link_purchase_requests 
ADD CONSTRAINT valid_placed_url 
CHECK (placed_url IS NULL OR placed_url ~ '^https?://');

-- Ajouter un index pour optimiser les requêtes sur placed_url
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_placed_url 
ON link_purchase_requests(placed_url) 
WHERE placed_url IS NOT NULL;

-- Ajouter un index pour les demandes acceptées avec URL placée
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_accepted_with_url 
ON link_purchase_requests(status, placed_url) 
WHERE status = 'accepted' AND placed_url IS NOT NULL; 