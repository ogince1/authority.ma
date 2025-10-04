-- Migration pour corriger le trigger problématique de url_validation_date
-- Date: 2025-01-21

-- Supprimer le trigger problématique s'il existe
DROP TRIGGER IF EXISTS trigger_validate_url_placement ON link_purchase_requests;

-- Supprimer la fonction problématique s'il existe
DROP FUNCTION IF EXISTS validate_url_placement();

-- Recréer la fonction avec le bon type de timestamp
CREATE OR REPLACE FUNCTION validate_url_placement()
RETURNS TRIGGER AS $$
BEGIN
  -- Si une URL est placée, mettre à jour la date de validation
  IF NEW.placed_url IS NOT NULL AND OLD.placed_url IS NULL THEN
    NEW.url_validation_date = NOW();
  END IF;
  
  -- Si l'URL est supprimée, effacer la date de validation
  IF NEW.placed_url IS NULL AND OLD.placed_url IS NOT NULL THEN
    NEW.url_validation_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER trigger_validate_url_placement
  BEFORE UPDATE ON link_purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_url_placement(); 