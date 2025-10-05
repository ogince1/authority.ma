-- 🧹 NETTOYAGE - Supprimer toutes les annonces inactives dans link_listings
-- Date: 2025-01-07
-- Raison: Nettoyer les entrées "pont" et les annonces de test

-- ⚠️ ÉTAPE 1: VÉRIFIER CE QUI SERA SUPPRIMÉ (À exécuter d'abord)
SELECT 
    id,
    title,
    status,
    user_id,
    website_id,
    price,
    created_at
FROM link_listings
WHERE status = 'inactive'
ORDER BY created_at DESC;

-- Compter les annonces inactives
SELECT COUNT(*) as total_inactives 
FROM link_listings 
WHERE status = 'inactive';

-- ⚠️ ÉTAPE 2: VÉRIFIER S'IL Y A DES DEMANDES LIÉES (IMPORTANT!)
-- Ne pas supprimer si des demandes existent
SELECT 
    ll.id,
    ll.title,
    ll.status,
    COUNT(lpr.id) as nombre_demandes
FROM link_listings ll
LEFT JOIN link_purchase_requests lpr ON lpr.link_listing_id = ll.id
WHERE ll.status = 'inactive'
GROUP BY ll.id, ll.title, ll.status
HAVING COUNT(lpr.id) > 0
ORDER BY COUNT(lpr.id) DESC;

-- ✅ ÉTAPE 3: SUPPRESSION SÉCURISÉE
-- Supprimer seulement les annonces inactives SANS demandes liées

-- Option A: Suppression conservative (recommandée)
-- Ne supprime QUE les annonces sans aucune demande
DELETE FROM link_listings
WHERE status = 'inactive'
AND id NOT IN (
    SELECT DISTINCT link_listing_id 
    FROM link_purchase_requests 
    WHERE link_listing_id IS NOT NULL
);

-- ⚠️ Option B: Suppression agressive (à utiliser avec précaution)
-- Décommentez seulement si vous êtes SÛR
/*
DELETE FROM link_listings
WHERE status = 'inactive';
*/

-- ÉTAPE 4: VÉRIFICATION APRÈS SUPPRESSION
SELECT 
    status,
    COUNT(*) as count
FROM link_listings
GROUP BY status
ORDER BY status;

-- Afficher ce qui reste
SELECT 
    id,
    title,
    status,
    price,
    created_at
FROM link_listings
ORDER BY created_at DESC
LIMIT 20;
