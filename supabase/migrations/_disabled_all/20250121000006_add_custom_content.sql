-- Migration pour ajouter le champ custom_content
-- Date: 2025-01-21

-- Ajouter le champ custom_content à la table link_purchase_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    -- Ajouter la colonne custom_content si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'link_purchase_requests' 
                   AND column_name = 'custom_content') THEN
      ALTER TABLE link_purchase_requests 
      ADD COLUMN custom_content TEXT;
    END IF;
    
    -- Ajouter la colonne content_option si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'link_purchase_requests' 
                   AND column_name = 'content_option') THEN
      ALTER TABLE link_purchase_requests 
      ADD COLUMN content_option VARCHAR(20) DEFAULT 'platform' 
      CHECK (content_option IN ('platform', 'custom'));
    END IF;
  END IF;
END $$;
