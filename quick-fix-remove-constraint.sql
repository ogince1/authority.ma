-- 🚀 SOLUTION RAPIDE - Supprimer la contrainte qui bloque

-- Supprimer la contrainte de clé étrangère
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS link_purchase_requests_link_listing_id_fkey;

-- Ajouter un commentaire pour documenter
COMMENT ON COLUMN link_purchase_requests.link_listing_id IS 
'ATTENTION: Ce champ peut contenir soit un link_listing_id (articles existants) soit un website_id (nouveaux articles). Pas de contrainte FK pour permettre les 2 cas.';

-- Vérifier que la contrainte est bien supprimée
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE '%link_purchase_requests%listing%';

