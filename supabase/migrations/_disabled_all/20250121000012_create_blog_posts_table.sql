-- Migration pour créer la table blog_posts
-- Date: 2025-01-21
-- Description: Table pour gérer les articles de blog de la plateforme Back.ma

-- Créer la table blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    images TEXT[], -- Array d'URLs d'images
    category VARCHAR(100),
    tags TEXT[], -- Array de tags
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur le slug pour les performances
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- Créer un index sur le statut pour filtrer les articles publiés
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);

-- Créer un index sur la date de publication pour l'ordre chronologique
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- Créer un index sur l'auteur
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);

-- Créer un index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();

-- Fonction pour générer automatiquement un slug à partir du titre
CREATE OR REPLACE FUNCTION generate_blog_post_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convertir le titre en slug (minuscules, remplacer espaces et caractères spéciaux par des tirets)
    base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Vérifier l'unicité et ajouter un numéro si nécessaire
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le slug si non fourni
CREATE OR REPLACE FUNCTION set_blog_post_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le slug est vide ou null, le générer à partir du titre
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_blog_post_slug(NEW.title);
    END IF;
    
    -- Si le statut est 'published' et published_at est null, le définir à maintenant
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour définir le slug et published_at
CREATE TRIGGER trigger_set_blog_post_slug
    BEFORE INSERT OR UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION set_blog_post_slug();

-- Activer Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir tous les articles publiés
CREATE POLICY "Les utilisateurs peuvent voir les articles publiés" ON public.blog_posts
    FOR SELECT USING (status = 'published');

-- Politique RLS : Les auteurs peuvent voir leurs propres articles
CREATE POLICY "Les auteurs peuvent voir leurs propres articles" ON public.blog_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Politique RLS : Les administrateurs peuvent voir tous les articles
CREATE POLICY "Les administrateurs peuvent voir tous les articles" ON public.blog_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politique RLS : Les auteurs peuvent créer des articles
CREATE POLICY "Les auteurs peuvent créer des articles" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Politique RLS : Les auteurs peuvent modifier leurs propres articles
CREATE POLICY "Les auteurs peuvent modifier leurs propres articles" ON public.blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Politique RLS : Les administrateurs peuvent modifier tous les articles
CREATE POLICY "Les administrateurs peuvent modifier tous les articles" ON public.blog_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politique RLS : Les auteurs peuvent supprimer leurs propres articles
CREATE POLICY "Les auteurs peuvent supprimer leurs propres articles" ON public.blog_posts
    FOR DELETE USING (auth.uid() = author_id);

-- Politique RLS : Les administrateurs peuvent supprimer tous les articles
CREATE POLICY "Les administrateurs peuvent supprimer tous les articles" ON public.blog_posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Insérer quelques articles d'exemple
INSERT INTO public.blog_posts (
    title,
    slug,
    excerpt,
    content,
    category,
    tags,
    status,
    meta_title,
    meta_description,
    author_id,
    published_at
) VALUES 
(
    'Guide Complet : Comment Acheter des Backlinks de Qualité au Maroc',
    'guide-acheter-backlinks-qualite-maroc',
    'Découvrez notre guide complet pour acheter des backlinks de qualité au Maroc. Conseils d''experts, critères de sélection et stratégies SEO efficaces.',
    'Les backlinks sont un élément crucial du référencement naturel. Dans ce guide complet, nous vous expliquons comment acheter des backlinks de qualité au Maroc...',
    'SEO',
    ARRAY['backlinks', 'SEO', 'référencement', 'Maroc'],
    'published',
    'Guide Complet : Comment Acheter des Backlinks de Qualité au Maroc | Back.ma',
    'Découvrez notre guide complet pour acheter des backlinks de qualité au Maroc. Conseils d''experts, critères de sélection et stratégies SEO efficaces.',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    NOW()
),
(
    'Les 10 Erreurs à Éviter lors de l''Achat de Backlinks',
    '10-erreurs-eviter-achat-backlinks',
    'Évitez ces 10 erreurs courantes lors de l''achat de backlinks. Protégez votre site des pénalités Google et maximisez votre ROI SEO.',
    'L''achat de backlinks peut être risqué si mal fait. Voici les 10 erreurs les plus courantes à éviter pour protéger votre site...',
    'SEO',
    ARRAY['backlinks', 'erreurs', 'pénalités', 'Google'],
    'published',
    'Les 10 Erreurs à Éviter lors de l''Achat de Backlinks | Back.ma',
    'Évitez ces 10 erreurs courantes lors de l''achat de backlinks. Protégez votre site des pénalités Google et maximisez votre ROI SEO.',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    NOW()
),
(
    'Comment Vendre des Liens sur votre Site Web : Guide 2025',
    'comment-vendre-liens-site-web-guide-2025',
    'Apprenez comment monétiser votre site web en vendant des liens. Guide complet avec stratégies, tarifs et bonnes pratiques.',
    'Vendre des liens peut être une source de revenus passive intéressante. Découvrez comment bien faire et éviter les pièges...',
    'Monétisation',
    ARRAY['vendre liens', 'monétisation', 'revenus passifs', 'site web'],
    'published',
    'Comment Vendre des Liens sur votre Site Web : Guide 2025 | Back.ma',
    'Apprenez comment monétiser votre site web en vendant des liens. Guide complet avec stratégies, tarifs et bonnes pratiques.',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    NOW()
);

-- Commentaires sur la table
COMMENT ON TABLE public.blog_posts IS 'Table pour gérer les articles de blog de la plateforme Back.ma';
COMMENT ON COLUMN public.blog_posts.id IS 'Identifiant unique de l''article';
COMMENT ON COLUMN public.blog_posts.title IS 'Titre de l''article';
COMMENT ON COLUMN public.blog_posts.slug IS 'URL slug unique pour l''article';
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Extrait ou résumé de l''article';
COMMENT ON COLUMN public.blog_posts.content IS 'Contenu complet de l''article';
COMMENT ON COLUMN public.blog_posts.featured_image IS 'Image principale de l''article';
COMMENT ON COLUMN public.blog_posts.images IS 'Array d''URLs d''images supplémentaires';
COMMENT ON COLUMN public.blog_posts.category IS 'Catégorie de l''article';
COMMENT ON COLUMN public.blog_posts.tags IS 'Array de tags associés à l''article';
COMMENT ON COLUMN public.blog_posts.status IS 'Statut de l''article (draft, published, archived)';
COMMENT ON COLUMN public.blog_posts.meta_title IS 'Titre SEO pour les moteurs de recherche';
COMMENT ON COLUMN public.blog_posts.meta_description IS 'Description SEO pour les moteurs de recherche';
COMMENT ON COLUMN public.blog_posts.author_id IS 'ID de l''auteur de l''article';
COMMENT ON COLUMN public.blog_posts.published_at IS 'Date et heure de publication';
COMMENT ON COLUMN public.blog_posts.created_at IS 'Date et heure de création';
COMMENT ON COLUMN public.blog_posts.updated_at IS 'Date et heure de dernière modification';
