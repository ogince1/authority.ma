-- Mise à jour des services pour utiliser MAD au lieu d'EUR

-- Mettre à jour la devise par défaut
ALTER TABLE services ALTER COLUMN currency SET DEFAULT 'MAD';

-- Mettre à jour les services existants
UPDATE services SET 
  currency = 'MAD',
  price = CASE 
    WHEN name = 'Pack de liens forums thématisés' THEN 250.00
    WHEN name = 'Soumission dans annuaires généralistes' THEN 2000.00
    WHEN name = 'Backlinks optimisés pour LLMs' THEN 450.00
    WHEN name = 'Audit SEO complet' THEN 900.00
    WHEN name = 'Rédaction de contenu SEO' THEN 1500.00
    ELSE price * 10 -- Conversion approximative EUR vers MAD
  END
WHERE currency = 'EUR' OR currency IS NULL;
