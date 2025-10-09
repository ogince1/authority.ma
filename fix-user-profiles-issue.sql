-- ============================================================================
-- FIX: Problème table user_profiles
-- Date: 8 Octobre 2025
-- Description: Créer ou vérifier la table user_profiles si nécessaire
-- ============================================================================

-- Option 1: Si vous voulez créer la table user_profiles
-- (Décommentez si vous voulez l'utiliser)

/*
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Informations personnelles supplémentaires
  avatar_url TEXT,
  cover_photo_url TEXT,
  bio_extended TEXT,
  
  -- Réseaux sociaux
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  
  -- Préférences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  newsletter_subscribed BOOLEAN DEFAULT true,
  
  -- Langue et localisation
  preferred_language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Africa/Casablanca',
  
  -- Statistiques personnelles
  profile_views INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Métadonnées
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  profile_completed_at TIMESTAMP WITH TIME ZONE,
  profile_completion_percentage INTEGER DEFAULT 0,
  
  -- Badges et récompenses
  badges JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity ON public.user_profiles(last_activity_at);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id OR auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id OR auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leur propre profil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Politique: Les admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.user_profiles;
CREATE POLICY "Admins have full access to profiles"
  ON public.user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_id)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
CREATE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- Créer les profils pour les utilisateurs existants
INSERT INTO public.user_profiles (id, user_id)
SELECT id, id FROM auth.users
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.user_profiles IS 'Profils utilisateurs étendus avec informations supplémentaires';
*/

-- ============================================================================
-- Option 2: Si vous ne voulez PAS utiliser user_profiles
-- (Tout est déjà dans la table users)
-- ============================================================================

-- Dans ce cas, supprimez simplement les références à user_profiles dans votre code frontend

-- Vérification: Afficher la structure de la table users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- RECOMMANDATION
-- ============================================================================

-- Vu que la table 'users' contient déjà 19 colonnes avec toutes les informations
-- nécessaires (balance, payment info, etc.), il est recommandé de:
--
-- 1. NE PAS créer de table user_profiles supplémentaire
-- 2. Utiliser uniquement la table 'users' existante
-- 3. Supprimer les références à 'user_profiles' dans le code TypeScript
--
-- Cela simplifie l'architecture et évite la duplication de données.

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

-- Vérifier que tous les utilisateurs ont un solde initialisé
SELECT 
  id, 
  name, 
  email, 
  role,
  balance,
  created_at
FROM public.users
WHERE balance IS NULL;

-- Si des utilisateurs ont un balance NULL, les initialiser à 0
UPDATE public.users
SET balance = 0
WHERE balance IS NULL;

-- Vérifier la cohérence des rôles
SELECT 
  role,
  COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY count DESC;

-- Vérifier les utilisateurs sans informations de paiement
SELECT 
  id,
  name,
  email,
  role,
  bank_account_info,
  paypal_email,
  preferred_withdrawal_method
FROM public.users
WHERE role = 'publisher'
  AND (bank_account_info IS NULL OR bank_account_info = '{}')
  AND paypal_email IS NULL;

COMMENT ON TABLE public.users IS 'Table principale des utilisateurs avec toutes les informations (auth, profile, payment)';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
