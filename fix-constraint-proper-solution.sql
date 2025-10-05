-- 🔧 SOLUTION PROPRE - Supprimer la contrainte stricte et gérer les 2 cas

-- 1. Supprimer la contrainte de clé étrangère stricte
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS link_purchase_requests_link_listing_id_fkey;

-- 2. Ajouter des colonnes séparées pour distinguer les 2 types
ALTER TABLE link_purchase_requests 
ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_new_article BOOLEAN DEFAULT false;

-- 3. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_website_id 
ON link_purchase_requests(website_id);

CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_is_new_article 
ON link_purchase_requests(is_new_article);

-- 4. Ajouter une contrainte de validation logique
ALTER TABLE link_purchase_requests
ADD CONSTRAINT check_listing_or_website CHECK (
  (is_new_article = true AND website_id IS NOT NULL AND link_listing_id IS NULL) OR
  (is_new_article = false AND link_listing_id IS NOT NULL AND website_id IS NULL)
);

-- 5. Commentaires pour clarté
COMMENT ON COLUMN link_purchase_requests.website_id IS 'ID du website pour les nouveaux articles (si is_new_article = true)';
COMMENT ON COLUMN link_purchase_requests.is_new_article IS 'true = nouveau article (utilise website_id), false = article existant (utilise link_listing_id)';
COMMENT ON COLUMN link_purchase_requests.link_listing_id IS 'ID de l''annonce pour les articles existants (si is_new_article = false)';

-- 6. OU SOLUTION ALTERNATIVE PLUS SIMPLE : Rendre la contrainte optionnelle
-- (Décommenter si vous préférez cette approche)

/*
-- Alternative : Garder link_listing_id mais sans contrainte stricte
-- Le code frontend gère la logique

-- Supprimer la contrainte
ALTER TABLE link_purchase_requests 
DROP CONSTRAINT IF EXISTS link_purchase_requests_link_listing_id_fkey;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN link_purchase_requests.link_listing_id IS 
'Pour nouveaux articles: website_id (pas de contrainte FK). Pour articles existants: link_listing_id';
*/

COMMIT;

