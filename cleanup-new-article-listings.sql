-- ============================================================================
-- NETTOYAGE: Supprimer les link_listings temporaires des nouveaux articles
-- Date: 8 Octobre 2025
-- Problème: Les demandes de nouveaux articles créaient des link_listings
--          qui apparaissaient dans "Mes liens existants" de l'éditeur
-- Solution: Ne PLUS créer de link_listing pour les nouveaux articles
-- ============================================================================

-- 1. Lister les link_listings créés pour les nouveaux articles
SELECT 
  ll.id,
  ll.title,
  ll.status,
  ll.tags,
  ll.created_at,
  COUNT(lpr.id) as nb_demandes
FROM link_listings ll
LEFT JOIN link_purchase_requests lpr ON lpr.link_listing_id = ll.id
WHERE ll.title LIKE 'Nouvel article sur%'
   OR 'nouveau-article' = ANY(ll.tags)
   OR ll.status = 'new_article_request'
GROUP BY ll.id, ll.title, ll.status, ll.tags, ll.created_at
ORDER BY ll.created_at DESC;

-- 2. SUPPRIMER les link_listings temporaires créés par erreur
-- ⚠️ ATTENTION: Les link_purchase_requests utilisent ces IDs comme FK
-- On va d'abord mettre à jour les demandes pour pointer vers le website_id

-- Étape 2.1: Mettre à jour les link_purchase_requests
-- Remplacer link_listing_id par website_id pour les nouveaux articles
UPDATE link_purchase_requests lpr
SET 
  link_listing_id = ll.website_id,
  updated_at = NOW()
FROM link_listings ll
WHERE lpr.link_listing_id = ll.id
  AND (
    ll.title LIKE 'Nouvel article sur%'
    OR 'nouveau-article' = ANY(ll.tags)
  );

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ % demandes mises à jour pour pointer vers website_id', updated_count;
END $$;

-- Étape 2.2: Supprimer les link_listings temporaires
DELETE FROM link_listings
WHERE (
  title LIKE 'Nouvel article sur%'
  OR 'nouveau-article' = ANY(tags)
);

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '🗑️  % link_listings temporaires supprimés', deleted_count;
END $$;

-- 3. Vérification finale
SELECT 
  'Total link_listings' as type,
  COUNT(*) as count
FROM link_listings
UNION ALL
SELECT 
  'Liens existants réels (active/pending)' as type,
  COUNT(*) as count
FROM link_listings
WHERE status IN ('active', 'pending')
UNION ALL
SELECT 
  'Total link_purchase_requests' as type,
  COUNT(*) as count
FROM link_purchase_requests;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- Après exécution:
-- ✅ Les link_listings temporaires "Nouvel article sur..." sont SUPPRIMÉS
-- ✅ Les link_purchase_requests pointent maintenant vers website_id
-- ✅ "Mes liens existants" affiche uniquement les VRAIS liens
-- ✅ Les demandes de nouveaux articles restent visibles dans "Demandes"

COMMENT ON COLUMN link_listings.status IS 'Statuts: active, pending, sold, inactive (les nouveaux articles ne créent PAS de link_listing)';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
