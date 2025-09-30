-- Script simplifié pour créer la table success_stories
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table success_stories
CREATE TABLE IF NOT EXISTS public.success_stories (
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
    client_name VARCHAR(255),
    client_website VARCHAR(500),
    results_summary TEXT,
    metrics JSONB, -- Pour stocker les métriques (trafic, conversions, etc.)
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_success_stories_slug ON public.success_stories(slug);
CREATE INDEX IF NOT EXISTS idx_success_stories_status ON public.success_stories(status);
CREATE INDEX IF NOT EXISTS idx_success_stories_published_at ON public.success_stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_author_id ON public.success_stories(author_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_category ON public.success_stories(category);
CREATE INDEX IF NOT EXISTS idx_success_stories_client_name ON public.success_stories(client_name);

-- 3. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_success_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_success_stories_updated_at ON public.success_stories;
CREATE TRIGGER trigger_update_success_stories_updated_at
    BEFORE UPDATE ON public.success_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_success_stories_updated_at();

-- 5. Activer RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS
DROP POLICY IF EXISTS "success_stories_select_policy" ON public.success_stories;
CREATE POLICY "success_stories_select_policy" ON public.success_stories
    FOR SELECT USING (
        status = 'published' OR 
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "success_stories_insert_policy" ON public.success_stories;
CREATE POLICY "success_stories_insert_policy" ON public.success_stories
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "success_stories_update_policy" ON public.success_stories;
CREATE POLICY "success_stories_update_policy" ON public.success_stories
    FOR UPDATE USING (
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "success_stories_delete_policy" ON public.success_stories;
CREATE POLICY "success_stories_delete_policy" ON public.success_stories
    FOR DELETE USING (
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 7. Insérer des success stories d'exemple
INSERT INTO public.success_stories (
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
    client_name,
    client_website,
    results_summary,
    metrics,
    published_at
) VALUES 
(
    'Comment Back.ma a Augmenté le Trafic de 300% pour une Agence SEO Marocaine',
    'back-ma-augmente-trafic-300-pourcent-agence-seo-marocaine',
    'Découvrez comment Back.ma a aidé une agence SEO marocaine à augmenter son trafic de 300% en 6 mois grâce à une stratégie de backlinks ciblée.',
    'Cette success story détaille comment notre plateforme a transformé la visibilité en ligne d''une agence SEO basée à Casablanca...',
    'SEO',
    ARRAY['backlinks', 'SEO', 'trafic', 'agence', 'Maroc'],
    'published',
    'Comment Back.ma a Augmenté le Trafic de 300% pour une Agence SEO Marocaine | Back.ma',
    'Découvrez comment Back.ma a aidé une agence SEO marocaine à augmenter son trafic de 300% en 6 mois grâce à une stratégie de backlinks ciblée.',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    'Agence SEO Pro',
    'https://agenceseopro.ma',
    'Augmentation du trafic de 300% en 6 mois, amélioration du classement Google de 15 positions en moyenne',
    '{"traffic_increase": "300%", "ranking_improvement": "15 positions", "timeframe": "6 mois", "keywords_improved": 45}',
    NOW()
),
(
    'E-commerce Marocain : +250% de Ventes grâce aux Backlinks de Qualité',
    'ecommerce-marocain-250-pourcent-ventes-backlinks-qualite',
    'Un e-commerce marocain spécialisé dans l''artisanat a vu ses ventes augmenter de 250% grâce à une campagne de backlinks stratégique sur Back.ma.',
    'Cette success story raconte l''histoire d''un e-commerce marocain qui a révolutionné ses ventes en ligne...',
    'E-commerce',
    ARRAY['e-commerce', 'ventes', 'artisanat', 'Maroc', 'backlinks'],
    'published',
    'E-commerce Marocain : +250% de Ventes grâce aux Backlinks de Qualité | Back.ma',
    'Un e-commerce marocain spécialisé dans l''artisanat a vu ses ventes augmenter de 250% grâce à une campagne de backlinks stratégique sur Back.ma.',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    'Artisanat du Maroc',
    'https://artisanatdumaroc.ma',
    'Augmentation des ventes de 250%, amélioration du taux de conversion de 180%, expansion sur 3 nouvelles régions',
    '{"sales_increase": "250%", "conversion_rate": "180%", "new_regions": 3, "roi": "450%"}',
    NOW()
),
(
    'Startup Tech : De l''Invisibilité à la Première Page Google en 4 Mois',
    'startup-tech-invisibilite-premiere-page-google-4-mois',
    'Une startup tech marocaine est passée de l''invisibilité totale à la première page Google pour ses mots-clés principaux en seulement 4 mois.',
    'Cette success story démontre la puissance d''une stratégie de backlinks bien orchestrée pour les startups...',
    'Startup',
    ARRAY['startup', 'tech', 'Google', 'première page', 'Maroc'],
    'published',
    'Startup Tech : De l''Invisibilité à la Première Page Google en 4 Mois | Back.ma',
    'Une startup tech marocaine est passée de l''invisibilité totale à la première page Google pour ses mots-clés principaux en seulement 4 mois.',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    'TechInnovate Maroc',
    'https://techinnovate.ma',
    'Passage de la page 10+ à la position 3 en moyenne, augmentation du trafic de 800%, génération de 15 leads qualifiés par mois',
    '{"ranking_improvement": "page 10+ to position 3", "traffic_increase": "800%", "qualified_leads": "15/month", "timeframe": "4 mois"}',
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- 8. Vérifier la création
SELECT 'Table success_stories créée avec succès!' as message;
SELECT COUNT(*) as nombre_success_stories FROM public.success_stories;
