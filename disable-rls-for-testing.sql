-- Script pour désactiver RLS temporairement pour les tests
-- À exécuter dans Supabase SQL Editor

-- Désactiver RLS sur les tables nécessaires pour les tests
ALTER TABLE link_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE link_purchase_requests DISABLE ROW LEVEL SECURITY;

-- Commenter pour documentation
COMMENT ON TABLE link_listings IS 'RLS désactivé temporairement pour les tests';
COMMENT ON TABLE link_purchase_requests IS 'RLS désactivé temporairement pour les tests';

-- Note: Réactiver RLS plus tard avec:
-- ALTER TABLE link_listings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE link_purchase_requests ENABLE ROW LEVEL SECURITY;
