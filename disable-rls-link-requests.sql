-- Script pour désactiver RLS temporairement sur link_purchase_requests
-- À exécuter dans Supabase SQL Editor

-- Désactiver RLS sur link_purchase_requests pour permettre à l'admin de voir toutes les demandes
ALTER TABLE link_purchase_requests DISABLE ROW LEVEL SECURITY;

-- Commenter pour documentation
COMMENT ON TABLE link_purchase_requests IS 'RLS désactivé temporairement pour permettre à l''admin de voir toutes les demandes';

-- Note: Pour réactiver RLS plus tard avec:
-- ALTER TABLE link_purchase_requests ENABLE ROW LEVEL SECURITY;
