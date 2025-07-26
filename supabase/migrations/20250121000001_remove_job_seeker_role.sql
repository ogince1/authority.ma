-- Migration pour supprimer le rôle "job_seeker"
-- Date: 2025-01-21
-- Description: Mise à jour des utilisateurs job_seeker vers entrepreneur et suppression du rôle

-- 1. Mettre à jour tous les utilisateurs avec le rôle 'job_seeker' vers 'entrepreneur'
UPDATE users 
SET 
  role = 'entrepreneur',
  updated_at = NOW()
WHERE role = 'job_seeker';

-- 2. Vérification que la mise à jour s'est bien passée
-- (Cette requête retournera 0 si tout s'est bien passé)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE role = 'job_seeker') THEN
    RAISE EXCEPTION 'Il reste encore des utilisateurs avec le rôle job_seeker';
  END IF;
END $$;

-- Note: Si vous utilisez un enum PostgreSQL pour les rôles, 
-- vous devrez créer une migration séparée pour modifier le type enum 