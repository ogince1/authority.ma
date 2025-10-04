-- Migration pour nettoyer les liens avec des IDs invalides
-- Date: 2025-01-21

-- Supprimer les liens avec des IDs qui commencent par "new-"
DELETE FROM link_listings 
WHERE id::text LIKE 'new-%';

-- Supprimer les liens sans user_id
DELETE FROM link_listings 
WHERE user_id IS NULL;

-- Supprimer les liens avec des IDs vides ou invalides
DELETE FROM link_listings 
WHERE id IS NULL OR id::text = '';

-- Vérifier et afficher les liens restants
SELECT 
  id, 
  title, 
  user_id, 
  status,
  created_at
FROM link_listings 
ORDER BY created_at DESC 
LIMIT 10; 