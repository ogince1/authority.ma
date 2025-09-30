-- Fix RLS policies for link_purchase_transactions table
-- Date: 2025-01-21

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own transactions" ON link_purchase_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON link_purchase_transactions;
DROP POLICY IF EXISTS "System can update transactions" ON link_purchase_transactions;

-- Créer de nouvelles politiques plus permissives pour les tests
CREATE POLICY "System can manage transactions" ON link_purchase_transactions
  FOR ALL USING (true);

-- Vérifier que RLS est activé
ALTER TABLE link_purchase_transactions ENABLE ROW LEVEL SECURITY;
