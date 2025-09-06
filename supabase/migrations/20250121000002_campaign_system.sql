-- Migration pour le système de campagnes
-- Date: 2025-01-21

-- Table des campagnes
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    urls TEXT[] NOT NULL,
    language VARCHAR(50) DEFAULT 'Français',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'closed', 'draft')),
    extracted_metrics JSONB,
    budget DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des analyses d'URL
CREATE TABLE IF NOT EXISTS url_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    metrics JSONB NOT NULL,
    category VARCHAR(255),
    analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des opportunités de liens
CREATE TABLE IF NOT EXISTS link_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('existing_article', 'new_article')),
    site_name VARCHAR(255) NOT NULL,
    site_url TEXT NOT NULL,
    site_metrics JSONB NOT NULL,
    quality_type VARCHAR(20) NOT NULL CHECK (quality_type IN ('bronze', 'silver', 'gold')),
    theme VARCHAR(255),
    existing_article JSONB,
    new_article JSONB,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MAD' CHECK (currency IN ('MAD', 'EUR', 'USD')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes de liens
CREATE TABLE IF NOT EXISTS link_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES link_opportunities(id) ON DELETE CASCADE,
    advertiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    anchor_text VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MAD' CHECK (currency IN ('MAD', 'EUR', 'USD')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_campaign_id ON link_opportunities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_type ON link_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_quality_type ON link_opportunities(quality_type);
CREATE INDEX IF NOT EXISTS idx_link_orders_campaign_id ON link_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_orders_advertiser_id ON link_orders(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_link_orders_status ON link_orders(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_opportunities_updated_at BEFORE UPDATE ON link_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_orders_updated_at BEFORE UPDATE ON link_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour les campagnes
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_orders ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les campagnes
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour les opportunités de liens
CREATE POLICY "Users can view opportunities for their campaigns" ON link_opportunities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = link_opportunities.campaign_id 
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert opportunities for their campaigns" ON link_opportunities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = link_opportunities.campaign_id 
            AND campaigns.user_id = auth.uid()
        )
    );

-- Politiques RLS pour les commandes de liens
CREATE POLICY "Users can view their own orders" ON link_orders
    FOR SELECT USING (auth.uid() = advertiser_id);

CREATE POLICY "Users can insert their own orders" ON link_orders
    FOR INSERT WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Users can update their own orders" ON link_orders
    FOR UPDATE USING (auth.uid() = advertiser_id);

-- Données de test pour les campagnes
INSERT INTO campaigns (user_id, name, urls, language, status, budget, total_orders, total_spent) VALUES
(
    (SELECT id FROM auth.users LIMIT 1),
    'Campagne SEO E-commerce',
    ARRAY['https://example.com', 'https://example.com/products'],
    'Français',
    'active',
    5000.00,
    3,
    1200.00
),
(
    (SELECT id FROM auth.users LIMIT 1),
    'Campagne Blog Tech',
    ARRAY['https://techblog.com'],
    'Français',
    'draft',
    2000.00,
    0,
    0.00
);

-- Données de test pour les analyses d'URL
INSERT INTO url_analyses (url, metrics, category, analysis_status) VALUES
(
    'https://example.com',
    '{"traffic": 15000, "mc": 8000, "dr": 45, "cf": 67, "tf": 52}',
    'Computers/Internet/Web Design and Development',
    'completed'
),
(
    'https://example.com/products',
    '{"traffic": 8000, "mc": 4000, "dr": 42, "cf": 58, "tf": 48}',
    'Shopping/Clothing and Accessories',
    'completed'
);

-- Données de test pour les opportunités de liens
INSERT INTO link_opportunities (campaign_id, type, site_name, site_url, site_metrics, quality_type, theme, existing_article, new_article, price, currency) VALUES
(
    (SELECT id FROM campaigns LIMIT 1),
    'existing_article',
    'TechBlog Pro',
    'https://techblogpro.com',
    '{"dr": 78, "tf": 85, "cf": 72, "ps": 89.5, "age": 12, "outlinks": 25}',
    'gold',
    'Tech/Web Development',
    '{"title": "Guide complet du développement web moderne", "url": "https://techblogpro.com/web-dev-guide", "age": 8, "outlinks": 18}',
    NULL,
    180.00,
    'MAD'
),
(
    (SELECT id FROM campaigns LIMIT 1),
    'new_article',
    'Marketing Digital',
    'https://marketingdigital.com',
    '{"dr": 65, "tf": 72, "cf": 58, "ps": 87.2, "focus": 85}',
    'silver',
    'Business/Marketing',
    NULL,
    '{"duration": "1 an", "placement_info": "Articles seront à 2 clics de la page d''accueil"}',
    120.00,
    'MAD'
); 