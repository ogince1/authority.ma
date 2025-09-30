-- Fix RLS policies for users table to allow signup
-- Date: 2025-01-21

-- Supprimer toutes les politiques existantes pour la table users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Créer des politiques plus permissives pour permettre l'inscription
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Vérifier que RLS est activé
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
