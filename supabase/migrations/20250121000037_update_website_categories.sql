-- Migration pour mettre à jour les catégories de sites web
-- Date: 2025-01-21

-- Étape 1: Supprimer l'ancienne contrainte CHECK si elle existe
ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_category_check;

-- Étape 2: Mettre à jour les catégories existantes vers les nouvelles catégories
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

-- Étape 3: Ajouter la nouvelle contrainte CHECK après la mise à jour des données
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

-- Étape 4: Mettre à jour les commentaires de la colonne
COMMENT ON COLUMN websites.category IS 'Catégorie du site web selon la nouvelle classification';
