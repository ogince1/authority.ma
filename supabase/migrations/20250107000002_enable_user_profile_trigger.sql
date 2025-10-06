-- Enable automatic user profile creation on signup
-- Date: 2025-01-07

-- Fonction pour créer automatiquement le profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'advertiser'),
    0.00
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Créer les profils pour les utilisateurs existants qui n'en ont pas
INSERT INTO public.users (id, name, email, role, balance, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email, 'Utilisateur'),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'advertiser'),
  0.00,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Afficher un message de confirmation
DO $$
DECLARE
  new_profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_profiles_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  RAISE NOTICE 'Trigger de création de profil activé. % profils créés.', 
    (SELECT COUNT(*) FROM public.users) - new_profiles_count;
END $$;

