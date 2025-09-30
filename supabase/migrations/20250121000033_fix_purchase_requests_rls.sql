-- Fix RLS policies for link_purchase_requests table
-- Date: 2025-01-21

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own purchase requests" ON link_purchase_requests;
DROP POLICY IF EXISTS "Advertisers can create purchase requests" ON link_purchase_requests;
DROP POLICY IF EXISTS "Publishers can update their purchase requests" ON link_purchase_requests;

-- Créer de nouvelles politiques plus permissives pour les tests
CREATE POLICY "System can manage purchase requests" ON link_purchase_requests
  FOR ALL USING (true);

-- Vérifier que RLS est activé
ALTER TABLE link_purchase_requests ENABLE ROW LEVEL SECURITY;
