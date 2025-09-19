-- Script pour corriger les politiques RLS sur credit_transactions
-- Date: 2025-01-21
-- Problème: Erreur 42501 - new row violates row-level security policy

-- 1. Vérifier les politiques RLS existantes sur credit_transactions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'credit_transactions';

-- 2. Supprimer les politiques RLS existantes sur credit_transactions
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can update their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can delete their own credit transactions" ON credit_transactions;

-- 3. Créer les nouvelles politiques RLS pour credit_transactions
-- Politique pour SELECT (lecture)
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Politique pour INSERT (création)
CREATE POLICY "Users can insert their own credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour UPDATE (modification)
CREATE POLICY "Users can update their own credit transactions" ON credit_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour DELETE (suppression)
CREATE POLICY "Users can delete their own credit transactions" ON credit_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'credit_transactions';

-- 5. Tester l'insertion d'une transaction de crédit
-- (Ce test sera exécuté par le script de test)

-- 6. Vérifier les politiques RLS sur les autres tables importantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('link_purchase_requests', 'link_purchase_transactions', 'users')
ORDER BY tablename, policyname;
