-- Ajouter les champs prix et nouveau à la table websites
ALTER TABLE websites 
ADD COLUMN IF NOT EXISTS new_article_price INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS is_new_article BOOLEAN DEFAULT true;

-- Commenter les colonnes
COMMENT ON COLUMN websites.new_article_price IS 'Prix pour les nouveaux articles sur ce site (en MAD)';
COMMENT ON COLUMN websites.is_new_article IS 'Indique si ce site accepte les nouveaux articles';

-- Mettre à jour les sites existants avec des valeurs par défaut
UPDATE websites 
SET 
  new_article_price = 80,
  is_new_article = true
WHERE new_article_price IS NULL OR is_new_article IS NULL;
