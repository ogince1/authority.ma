-- Migration pour restaurer la contrainte des catégories après mise à jour
-- Date: 2025-01-21

-- Recréer la contrainte CHECK avec les nouvelles catégories
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

-- Mettre à jour les commentaires de la colonne
COMMENT ON COLUMN websites.category IS 'Catégorie du site web selon la nouvelle classification';
