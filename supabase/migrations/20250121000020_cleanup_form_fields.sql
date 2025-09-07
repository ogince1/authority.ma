-- Migration pour nettoyer les champs supprimés des formulaires
-- Date: 2025-01-21
-- Description: Supprime les colonnes inutilisées suite au nettoyage des formulaires

-- Supprimer les colonnes inutilisées de la table websites
ALTER TABLE websites DROP COLUMN IF EXISTS niche;
ALTER TABLE websites DROP COLUMN IF EXISTS contact_info;
ALTER TABLE websites DROP COLUMN IF EXISTS screenshots;
ALTER TABLE websites DROP COLUMN IF EXISTS payment_methods;

-- Supprimer les colonnes inutilisées de la table link_listings
ALTER TABLE link_listings DROP COLUMN IF EXISTS allowed_niches;
ALTER TABLE link_listings DROP COLUMN IF EXISTS forbidden_keywords;
ALTER TABLE link_listings DROP COLUMN IF EXISTS content_requirements;
ALTER TABLE link_listings DROP COLUMN IF EXISTS meta_title;
ALTER TABLE link_listings DROP COLUMN IF EXISTS meta_description;
ALTER TABLE link_listings DROP COLUMN IF EXISTS slug;

-- Supprimer les index liés aux colonnes supprimées
DROP INDEX IF EXISTS idx_websites_niche;

-- Mettre à jour les contraintes CHECK pour les métriques
-- Les métriques sont stockées en JSONB, donc pas besoin de modifier la structure
-- Mais on peut ajouter un commentaire pour clarifier
COMMENT ON COLUMN websites.metrics IS 'Métriques SEO: monthly_traffic, domain_authority (Trust Flow), organic_keywords';

-- Ajouter des commentaires pour clarifier les colonnes conservées
COMMENT ON COLUMN websites.category IS 'Catégorie du site web (remplace niche)';
COMMENT ON COLUMN link_listings.title IS 'Titre de l''annonce de lien';
COMMENT ON COLUMN link_listings.description IS 'Description de l''annonce de lien';
COMMENT ON COLUMN link_listings.target_url IS 'URL cible où le lien sera placé';
COMMENT ON COLUMN link_listings.anchor_text IS 'Texte d''ancrage souhaité';
COMMENT ON COLUMN link_listings.link_type IS 'Type de lien: dofollow, nofollow, sponsored, ugc';
COMMENT ON COLUMN link_listings.position IS 'Position du lien: header, footer, sidebar, content, menu, popup';
COMMENT ON COLUMN link_listings.price IS 'Prix en MAD';
COMMENT ON COLUMN link_listings.currency IS 'Devise: MAD, EUR, USD';
COMMENT ON COLUMN link_listings.minimum_contract_duration IS 'Durée minimale du contrat en mois';
COMMENT ON COLUMN link_listings.max_links_per_page IS 'Nombre maximum de liens par page';
COMMENT ON COLUMN link_listings.status IS 'Statut: active, sold, pending, inactive';
COMMENT ON COLUMN link_listings.images IS 'Images associées à l''annonce';
COMMENT ON COLUMN link_listings.tags IS 'Tags pour la recherche et le filtrage';

-- Mettre à jour les commentaires pour les colonnes websites
COMMENT ON COLUMN websites.title IS 'Titre du site web';
COMMENT ON COLUMN websites.description IS 'Description du site web';
COMMENT ON COLUMN websites.url IS 'URL du site web';
COMMENT ON COLUMN websites.category IS 'Catégorie du site web';
COMMENT ON COLUMN websites.owner_status IS 'Statut du propriétaire: professionnel, particulier, entreprise, agence';
COMMENT ON COLUMN websites.logo IS 'Logo du site web';
COMMENT ON COLUMN websites.meta_title IS 'Titre SEO du site web';
COMMENT ON COLUMN websites.meta_description IS 'Description SEO du site web';
COMMENT ON COLUMN websites.slug IS 'Slug URL du site web';
COMMENT ON COLUMN websites.status IS 'Statut: active, inactive, pending_approval, suspended';
COMMENT ON COLUMN websites.available_link_spots IS 'Nombre d''emplacements de liens disponibles';
COMMENT ON COLUMN websites.average_response_time IS 'Temps de réponse moyen en heures';
COMMENT ON COLUMN websites.languages IS 'Langues supportées par le site';
COMMENT ON COLUMN websites.content_quality IS 'Qualité du contenu: excellent, good, average, poor';
