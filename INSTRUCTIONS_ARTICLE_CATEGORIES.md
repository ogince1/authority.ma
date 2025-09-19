# Instructions pour ajouter les catégories aux articles

## Problème
Les articles (link_listings) n'ont pas de colonne `category` et doivent hériter automatiquement de la catégorie de leur site web.

## Solution en 2 étapes

### Étape 1: Ajouter la colonne category aux articles
Exécutez cette requête SQL dans l'interface Supabase :

```sql
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
```

**Comment faire :**
1. Allez dans l'interface Supabase
2. Allez dans "SQL Editor"
3. Copiez-collez le code SQL ci-dessus
4. Exécutez la requête

### Étape 2: Synchroniser les catégories existantes
Exécutez le script JavaScript :

```bash
node add-category-to-articles.js
```

Ce script va :
- Vérifier que la colonne existe
- Récupérer tous les articles avec leurs sites web
- Mettre à jour les articles sans catégorie avec la catégorie de leur site web
- Synchroniser les articles qui ont une catégorie différente
- Afficher les statistiques finales

## Fonctionnalités automatiques ajoutées

### 1. Création automatique de catégorie
Quand un éditeur crée un nouvel article, la catégorie sera automatiquement héritée du site web associé.

### 2. Fonction de synchronisation
Une fonction `syncArticleCategoriesWithWebsites()` a été ajoutée dans `src/lib/supabase.ts` pour synchroniser manuellement si nécessaire.

### 3. Mise à jour automatique
La fonction `createLinkListing` a été modifiée pour récupérer automatiquement la catégorie du site web.

## Vérification

Après avoir terminé les 2 étapes, vous pouvez vérifier que :

1. ✅ Tous les articles existants ont la même catégorie que leur site web
2. ✅ Les nouveaux articles créés héritent automatiquement de la catégorie de leur site web
3. ✅ Les filtres par catégorie fonctionnent pour les articles
4. ✅ La cohérence est maintenue entre sites web et articles

## Fichiers modifiés

- `src/lib/supabase.ts` - Fonctions de synchronisation et création automatique
- `supabase/migrations/20250121000041_add_category_to_link_listings.sql` - Migration SQL
- `add-category-to-articles.js` - Script de synchronisation
- `sync-article-categories.js` - Script de vérification (optionnel)

## Avantages

1. **Cohérence** : Les articles ont toujours la même catégorie que leur site web
2. **Automatisation** : Plus besoin de choisir manuellement la catégorie
3. **Maintenance** : Facile de synchroniser si nécessaire
4. **Filtrage** : Possibilité de filtrer les articles par catégorie
