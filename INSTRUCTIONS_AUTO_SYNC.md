# Instructions pour la synchronisation automatique des catégories d'articles

## ✅ Synchronisation manuelle terminée

La synchronisation des articles existants a été effectuée avec succès :
- **5 articles** ont été mis à jour
- **Tous les articles** ont maintenant la même catégorie que leur site web

## 📊 Résultats de la synchronisation

### Articles mis à jour :
- **OGINCE** articles : `home_garden` → `computers_technology`
- **toutamenager.ma** articles : `beauty_fashion_lifestyle` → `home_garden`

### Répartition finale :
- **home_garden** : 4 articles
- **computers_technology** : 3 articles  
- **health_wellness** : 2 articles

## 🔄 Synchronisation automatique pour l'avenir

Pour que les articles suivent automatiquement les changements de catégories de leurs sites web, appliquez cette migration SQL dans Supabase :

### Étape 1: Appliquer la migration SQL
Allez dans l'interface Supabase → SQL Editor et exécutez :

```sql
-- Fonction pour synchroniser automatiquement les catégories des articles
CREATE OR REPLACE FUNCTION sync_article_categories_on_website_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour tous les articles liés à ce site web
  UPDATE link_listings 
  SET category = NEW.category
  WHERE website_id = NEW.id 
    AND category != NEW.category;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger qui se déclenche quand un site web est mis à jour
DROP TRIGGER IF EXISTS trigger_sync_article_categories ON websites;
CREATE TRIGGER trigger_sync_article_categories
  AFTER UPDATE OF category ON websites
  FOR EACH ROW
  EXECUTE FUNCTION sync_article_categories_on_website_update();
```

## 🎯 Fonctionnement automatique

Une fois la migration appliquée :

1. **Quand un éditeur change la catégorie de son site web** → Tous ses articles suivent automatiquement
2. **Quand un éditeur crée un nouvel article** → Il hérite automatiquement de la catégorie du site web
3. **Plus besoin de synchronisation manuelle** → Tout se fait automatiquement

## 🧪 Test

Pour tester le système automatique :

1. Modifiez la catégorie d'un site web existant
2. Vérifiez que tous les articles de ce site web ont été mis à jour automatiquement
3. Créez un nouvel article et vérifiez qu'il a la bonne catégorie

## 📁 Fichiers créés

- `sync-existing-articles.js` - Script de synchronisation manuelle (déjà exécuté)
- `supabase/migrations/20250121000043_auto_sync_article_categories.sql` - Migration pour l'automatisation
- `INSTRUCTIONS_AUTO_SYNC.md` - Ce guide d'instructions

## ✅ Avantages

1. **Cohérence automatique** : Les articles suivent toujours leur site web
2. **Maintenance réduite** : Plus besoin de synchronisation manuelle
3. **Fiabilité** : Le trigger SQL garantit la cohérence
4. **Performance** : Synchronisation en temps réel lors des modifications
