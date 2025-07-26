-- Script pour supprimer le rôle "job_seeker" de la base de données
-- Exécutez ce script dans votre base de données Supabase

-- 1. Mettre à jour tous les utilisateurs avec le rôle 'job_seeker' vers 'entrepreneur'
-- (ou 'investor' selon votre préférence)
UPDATE users 
SET 
  role = 'entrepreneur',
  updated_at = NOW()
WHERE role = 'job_seeker';

-- 2. Vérifier combien d'utilisateurs ont été mis à jour
SELECT 
  'Utilisateurs mis à jour de job_seeker vers entrepreneur:' as info,
  COUNT(*) as count
FROM users 
WHERE role = 'entrepreneur' 
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- 3. Vérifier qu'il ne reste plus d'utilisateurs avec le rôle job_seeker
SELECT 
  'Utilisateurs restants avec le rôle job_seeker:' as info,
  COUNT(*) as count
FROM users 
WHERE role = 'job_seeker';

-- 4. Vérifier la distribution actuelle des rôles
SELECT 
  'Distribution des rôles après mise à jour:' as info,
  role,
  COUNT(*) as count
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- 5. Optionnel: Supprimer le rôle de l'enum si vous utilisez un enum PostgreSQL
-- (Décommentez si vous avez un enum pour les rôles)
-- ALTER TYPE user_role DROP ATTRIBUTE 'job_seeker';

-- Note: Si vous utilisez un enum PostgreSQL pour les rôles, vous devrez peut-être
-- recréer le type sans 'job_seeker'. Voici comment faire:
/*
-- Créer un nouveau type sans job_seeker
CREATE TYPE user_role_new AS ENUM ('entrepreneur', 'investor');

-- Mettre à jour la colonne pour utiliser le nouveau type
ALTER TABLE users 
  ALTER COLUMN role TYPE user_role_new 
  USING role::text::user_role_new;

-- Supprimer l'ancien type
DROP TYPE user_role;

-- Renommer le nouveau type
ALTER TYPE user_role_new RENAME TO user_role;
*/ 