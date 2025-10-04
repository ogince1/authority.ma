-- Fix RLS policies for link_listings table
-- Date: 2025-01-21
-- Description: Correction des politiques RLS pour permettre la suppression des liens par les éditeurs

-- Supprimer les politiques existantes problématiques
DROP POLICY IF EXISTS "Users can view their own link listings" ON link_listings;
DROP POLICY IF EXISTS "Users can manage their own link listings" ON link_listings;
DROP POLICY IF EXISTS "Authenticated users can insert link listings" ON link_listings;
DROP POLICY IF EXISTS "Users can view all active link listings" ON link_listings;

-- Créer de nouvelles politiques plus claires et permissives

-- 1. Politique pour voir tous les liens actifs (pour les annonceurs)
CREATE POLICY "Anyone can view active link listings" ON link_listings
  FOR SELECT USING (status = 'active');

-- 2. Politique pour que les utilisateurs voient leurs propres liens (tous statuts)
CREATE POLICY "Users can view their own link listings" ON link_listings
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Politique pour que les utilisateurs gèrent leurs propres liens (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage their own link listings" ON link_listings
  FOR ALL USING (auth.uid() = user_id);

-- 4. Politique pour insérer des liens (utilisateurs authentifiés)
CREATE POLICY "Authenticated users can insert link listings" ON link_listings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Politique spéciale pour les admins (si nécessaire)
CREATE POLICY "Admins can manage all link listings" ON link_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Vérifier que RLS est activé
ALTER TABLE link_listings ENABLE ROW LEVEL SECURITY;

-- Commentaire pour documenter les politiques
COMMENT ON TABLE link_listings IS 'Table des annonces de liens avec politiques RLS pour permettre la gestion par les propriétaires';
