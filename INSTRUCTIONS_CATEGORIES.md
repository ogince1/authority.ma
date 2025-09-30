# Instructions pour corriger les catégories de sites web

## Problème
La contrainte CHECK empêche la mise à jour des catégories existantes car elle ne reconnaît que les nouvelles catégories.

## Solution en 3 étapes

### Étape 1: Supprimer la contrainte CHECK
Exécutez la migration SQL suivante dans l'interface Supabase :

```sql
-- Migration: 20250121000039_remove_category_constraint.sql
ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_category_check;
```

**Comment faire :**
1. Allez dans l'interface Supabase
2. Allez dans "SQL Editor"
3. Copiez-collez le code SQL ci-dessus
4. Exécutez la requête

### Étape 2: Mettre à jour les catégories
Exécutez le script JavaScript :

```bash
node update-categories-final.js
```

Ce script va :
- Mettre à jour toutes les catégories existantes vers les nouvelles
- Afficher le progrès de la mise à jour
- Tester la création d'un nouveau site

### Étape 3: Restaurer la contrainte CHECK
Exécutez la migration SQL suivante dans l'interface Supabase :

```sql
-- Migration: 20250121000040_restore_category_constraint.sql
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
```

## Mapping des catégories

| Ancienne catégorie | Nouvelle catégorie |
|-------------------|-------------------|
| blog | various |
| ecommerce | shopping_deals |
| actualites | news_media |
| lifestyle | beauty_fashion_lifestyle |
| tech | computers_technology |
| business | business_consumer_services |
| sante | health_wellness |
| education | reference_education |
| immobilier | business_consumer_services |
| automobile | auto_vehicles |
| voyage | travel_tourism |
| cuisine | food_drink |
| sport | sports_fitness |
| culture | arts_entertainment |
| politique | law_government |
| economie | finance_economy |

## Vérification

Après avoir terminé les 3 étapes, vous pouvez vérifier que tout fonctionne :

1. Les sites existants ont été mis à jour avec les nouvelles catégories
2. Vous pouvez créer de nouveaux sites avec les nouvelles catégories
3. Les filtres dans l'interface utilisent les nouvelles catégories

## Fichiers créés

- `supabase/migrations/20250121000039_remove_category_constraint.sql`
- `update-categories-final.js`
- `supabase/migrations/20250121000040_restore_category_constraint.sql`
- `src/utils/categories.ts` - Fichier utilitaire centralisé
- `CATEGORIES_UPDATE.md` - Documentation complète
