-- Migration pour corriger les problèmes de timestamp
-- Date: 2025-01-21

-- Corriger le type de timestamp pour placed_at
ALTER TABLE link_purchase_requests 
ALTER COLUMN placed_at TYPE TIMESTAMP WITH TIME ZONE;

-- Ajouter une contrainte pour s'assurer que placed_at est cohérent
ALTER TABLE link_purchase_requests 
ADD CONSTRAINT check_placed_at_consistency 
CHECK (
  (status = 'accepted' AND placed_at IS NOT NULL AND placed_url IS NOT NULL) OR
  (status != 'accepted' AND placed_at IS NULL)
);

-- Fonction pour mettre à jour automatiquement placed_at lors de l'acceptation
CREATE OR REPLACE FUNCTION update_placed_at_on_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'accepted', définir placed_at automatiquement
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.placed_at = COALESCE(NEW.placed_at, NOW());
  END IF;
  
  -- Si le statut n'est plus 'accepted', effacer placed_at
  IF NEW.status != 'accepted' AND OLD.status = 'accepted' THEN
    NEW.placed_at = NULL;
    NEW.placed_url = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour automatiser la mise à jour de placed_at
DROP TRIGGER IF EXISTS trigger_update_placed_at ON link_purchase_requests;
CREATE TRIGGER trigger_update_placed_at
  BEFORE UPDATE ON link_purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_placed_at_on_acceptance(); 