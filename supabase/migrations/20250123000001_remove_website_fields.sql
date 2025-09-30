-- Migration pour supprimer les champs inutiles du formulaire de sites web
-- Suppression des colonnes : owner_status, content_quality, average_response_time, logo

-- Supprimer les colonnes inutiles
ALTER TABLE websites DROP COLUMN IF EXISTS owner_status;
ALTER TABLE websites DROP COLUMN IF EXISTS content_quality;
ALTER TABLE websites DROP COLUMN IF EXISTS average_response_time;
ALTER TABLE websites DROP COLUMN IF EXISTS logo;

-- Commenter les colonnes supprimées pour référence
-- owner_status: Statut du propriétaire (particulier, professionnel, entreprise, agence)
-- content_quality: Qualité du contenu (excellent, good, average, poor)
-- average_response_time: Temps de réponse moyen en heures
-- logo: URL du logo du site web

-- Mettre à jour les commentaires de la table
COMMENT ON TABLE websites IS 'Sites web des éditeurs - formulaire simplifié sans champs inutiles';
