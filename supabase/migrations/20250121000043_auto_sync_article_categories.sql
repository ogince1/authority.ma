-- Migration pour synchroniser automatiquement les catégories des articles avec leurs sites web
-- Date: 2025-01-21

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

-- Commentaire
COMMENT ON FUNCTION sync_article_categories_on_website_update() IS 'Synchronise automatiquement les catégories des articles quand un site web change de catégorie';
