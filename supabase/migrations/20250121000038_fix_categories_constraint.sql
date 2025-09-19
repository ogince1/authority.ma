-- Migration pour corriger le problème de contrainte des catégories
-- Date: 2025-01-21

-- Créer une fonction pour mettre à jour les catégories
CREATE OR REPLACE FUNCTION update_website_categories()
RETURNS void AS $$
BEGIN
  -- Supprimer temporairement la contrainte CHECK
  ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_category_check;
  
  -- Mettre à jour les catégories
  UPDATE websites SET category = CASE
    WHEN category = 'blog' THEN 'various'
    WHEN category = 'ecommerce' THEN 'shopping_deals'
    WHEN category = 'actualites' THEN 'news_media'
    WHEN category = 'lifestyle' THEN 'beauty_fashion_lifestyle'
    WHEN category = 'tech' THEN 'computers_technology'
    WHEN category = 'business' THEN 'business_consumer_services'
    WHEN category = 'sante' THEN 'health_wellness'
    WHEN category = 'education' THEN 'reference_education'
    WHEN category = 'immobilier' THEN 'business_consumer_services'
    WHEN category = 'automobile' THEN 'auto_vehicles'
    WHEN category = 'voyage' THEN 'travel_tourism'
    WHEN category = 'cuisine' THEN 'food_drink'
    WHEN category = 'sport' THEN 'sports_fitness'
    WHEN category = 'culture' THEN 'arts_entertainment'
    WHEN category = 'politique' THEN 'law_government'
    WHEN category = 'economie' THEN 'finance_economy'
    ELSE 'various'
  END;
  
  -- Remettre la contrainte CHECK
  ALTER TABLE websites ADD CONSTRAINT websites_category_check 
  CHECK (category IN (
    'adults_only',
    'arts_entertainment',
    'auto_vehicles',
    'beauty_fashion_lifestyle',
    'business_consumer_services',
    'community_society',
    'computers_technology',
    'finance_economy',
    'food_drink',
    'gambling',
    'games',
    'health_wellness',
    'heavy_industry_engineering',
    'hobbies_leisure',
    'home_garden',
    'jobs_career',
    'law_government',
    'news_media',
    'pets_animals',
    'reference_education',
    'science_nature',
    'science_education',
    'shopping_deals',
    'sports_fitness',
    'travel_tourism',
    'various',
    'world_regional'
  ));
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction
SELECT update_website_categories();

-- Supprimer la fonction temporaire
DROP FUNCTION update_website_categories();
