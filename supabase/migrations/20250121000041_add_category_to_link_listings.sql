-- Migration pour ajouter la colonne category à la table link_listings
-- Date: 2025-01-21

-- Ajouter la colonne category à link_listings
ALTER TABLE link_listings ADD COLUMN IF NOT EXISTS category TEXT;

-- Ajouter une contrainte CHECK pour les catégories
ALTER TABLE link_listings ADD CONSTRAINT link_listings_category_check 
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

-- Mettre à jour les commentaires
COMMENT ON COLUMN link_listings.category IS 'Catégorie de l\'article, héritée du site web associé';
