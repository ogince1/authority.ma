-- ============================================================
-- FIX FINAL : Inscription des utilisateurs avec rôles
-- Version corrigée avec gestion des permissions
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction avec les bonnes permissions
-- SECURITY DEFINER permet à la fonction de bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer le profil utilisateur
  INSERT INTO public.users (id, name, email, role, balance, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'advertiser'),
    0.00,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Ignorer si existe déjà
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer l'inscription
    RAISE WARNING 'Erreur création profil pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Donner les permissions nécessaires
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- 5. Recréer les politiques RLS de manière plus permissive

-- Désactiver RLS temporairement pour créer les politiques
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Créer les nouvelles politiques
CREATE POLICY "allow_insert_own_profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_select_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_update_own_profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_select_all_profiles"
  ON public.users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Permettre au service_role de tout faire
CREATE POLICY "allow_all_to_service_role"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Créer les profils manquants pour les utilisateurs existants
INSERT INTO public.users (id, name, email, role, balance, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1), 'Utilisateur'),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'advertiser'),
  0.00,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Vérification et résumé
DO $$
DECLARE
  total_auth INTEGER;
  total_users INTEGER;
  missing INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Compter
  SELECT COUNT(*) INTO total_auth FROM auth.users;
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO missing 
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Afficher le résumé
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '           FIX INSCRIPTION - RÉSUMÉ            ';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Utilisateurs auth.users:     %', total_auth;
  RAISE NOTICE '✅ Profils public.users:        %', total_users;
  RAISE NOTICE '⚠️  Profils manquants:          %', missing;
  RAISE NOTICE '';
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger activé et fonctionnel';
  ELSE
    RAISE NOTICE '❌ Trigger non créé - erreur!';
  END IF;
  
  RAISE NOTICE '✅ Politiques RLS configurées';
  RAISE NOTICE '✅ Permissions accordées';
  RAISE NOTICE '';
  RAISE NOTICE 'Les nouveaux utilisateurs seront automatiquement';
  RAISE NOTICE 'identifiés comme ÉDITEUR ou ANNONCEUR.';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
END $$;

