-- Fix RLS policies for users table to allow system operations
-- Date: 2025-01-21

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Créer de nouvelles politiques plus permissives pour les opérations système
CREATE POLICY "System can manage users" ON users
  FOR ALL USING (true);

-- Vérifier que RLS est activé
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
