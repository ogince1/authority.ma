-- Script simplifié pour créer la table blog_posts
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    images TEXT[],
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);

-- 3. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();

-- 5. Activer RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS
DROP POLICY IF EXISTS "blog_posts_select_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_select_policy" ON public.blog_posts
    FOR SELECT USING (
        status = 'published' OR 
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "blog_posts_insert_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_insert_policy" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "blog_posts_update_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_update_policy" ON public.blog_posts
    FOR UPDATE USING (
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "blog_posts_delete_policy" ON public.blog_posts;
CREATE POLICY "blog_posts_delete_policy" ON public.blog_posts
    FOR DELETE USING (
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 7. Insérer des articles d'exemple
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
)
ON CONFLICT (slug) DO NOTHING;

-- 8. Vérifier la création
SELECT 'Table blog_posts créée avec succès!' as message;
SELECT COUNT(*) as nombre_articles FROM public.blog_posts;
