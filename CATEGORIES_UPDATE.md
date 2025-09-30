# Mise à jour du système de catégorisation

## Résumé des changements

Le système de catégorisation des sites web a été mis à jour pour utiliser une nouvelle classification plus complète et standardisée.

## Nouvelles catégories

Les anciennes catégories ont été remplacées par :

1. **Adults Only (18+)**
2. **Arts & Entertainment**
3. **Auto & Vehicles**
4. **Beauty, Fashion & Lifestyle**
5. **Business & Consumer Services**
6. **Community & Society**
7. **Computers & Technology**
8. **Finance & Economy**
9. **Food & Drink**
10. **Gambling**
11. **Games**
12. **Health & Wellness**
13. **Heavy Industry & Engineering**
14. **Hobbies & Leisure**
15. **Home & Garden**
16. **Jobs & Career**
17. **Law & Government**
18. **News & Media**
19. **Pets & Animals**
20. **Reference & Education**
21. **Science & Nature**
22. **Science & Education**
23. **Shopping & Deals**
24. **Sports & Fitness**
25. **Travel & Tourism**
26. **Various**
27. **World & Regional**

## Fichiers modifiés

### Types et utilitaires
- `src/types/index.ts` - Mise à jour du type `WebsiteCategory`
- `src/utils/categories.ts` - Nouveau fichier utilitaire centralisé

### Composants frontend
- `src/components/Websites/WebsiteForm.tsx` - Formulaire d'ajout de site web
- `src/components/Admin/WebsitesManagement.tsx` - Gestion admin des sites
- `src/pages/UserWebsitesPage.tsx` - Page des sites utilisateur

### Base de données
- `supabase/migrations/20250121000037_update_website_categories.sql` - Migration SQL

## Migration des données

La migration SQL effectue automatiquement la conversion des anciennes catégories vers les nouvelles :

- `blog` → `various`
- `ecommerce` → `shopping_deals`
- `actualites` → `news_media`
- `lifestyle` → `beauty_fashion_lifestyle`
- `tech` → `computers_technology`
- `business` → `business_consumer_services`
- `sante` → `health_wellness`
- `education` → `reference_education`
- `immobilier` → `business_consumer_services`
- `automobile` → `auto_vehicles`
- `voyage` → `travel_tourism`
- `cuisine` → `food_drink`
- `sport` → `sports_fitness`
- `culture` → `arts_entertainment`
- `politique` → `law_government`
- `economie` → `finance_economy`

## Avantages

1. **Standardisation** : Utilisation d'une classification internationale standard
2. **Centralisation** : Fichier utilitaire unique pour éviter la duplication
3. **Extensibilité** : Facile d'ajouter de nouvelles catégories
4. **Cohérence** : Même système utilisé partout dans l'application
5. **Maintenance** : Plus facile de maintenir et mettre à jour

## Test

Un script de test `test-categories.js` a été créé pour vérifier le bon fonctionnement des nouvelles catégories.
