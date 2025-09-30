-- Migration de base pour créer les tables fondamentales
-- Date: 2025-01-21

-- Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) DEFAULT 'advertiser' CHECK (role IN ('advertiser', 'publisher', 'admin')),
    phone VARCHAR(20),
    website VARCHAR(255),
    bio TEXT,
    company_name VARCHAR(255),
    company_size VARCHAR(20) CHECK (company_size IN ('startup', 'sme', 'large', 'agency')),
    location VARCHAR(255),
    balance DECIMAL(10,2) DEFAULT 0,
    credit_limit DECIMAL(10,2),
    advertiser_info JSONB,
    publisher_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sites web
CREATE TABLE IF NOT EXISTS websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('blog', 'ecommerce', 'actualites', 'lifestyle', 'tech', 'business', 'sante', 'education', 'immobilier', 'automobile', 'voyage', 'cuisine', 'sport', 'culture', 'politique', 'economie')),
    niche VARCHAR(50) NOT NULL CHECK (niche IN ('immobilier', 'sante', 'beaute', 'mode', 'tech', 'finance', 'education', 'voyage', 'cuisine', 'sport', 'automobile', 'lifestyle', 'business', 'actualites', 'culture', 'politique', 'economie', 'art', 'musique', 'cinema')),
    owner_status VARCHAR(20) NOT NULL CHECK (owner_status IN ('professionnel', 'particulier', 'entreprise', 'agence')),
    metrics JSONB,
    contact_info JSONB NOT NULL,
    logo TEXT,
    screenshots TEXT[] DEFAULT '{}',
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval', 'suspended')),
    available_link_spots INTEGER DEFAULT 0,
    average_response_time INTEGER,
    payment_methods TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    content_quality VARCHAR(20) DEFAULT 'good' CHECK (content_quality IN ('excellent', 'good', 'average', 'poor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des annonces de liens
CREATE TABLE IF NOT EXISTS link_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('dofollow', 'nofollow', 'sponsored', 'ugc')),
    position VARCHAR(20) NOT NULL CHECK (position IN ('header', 'footer', 'sidebar', 'content', 'menu', 'popup')),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MAD' CHECK (currency IN ('MAD', 'EUR', 'USD')),
    minimum_contract_duration INTEGER DEFAULT 1,
    max_links_per_page INTEGER DEFAULT 1,
    allowed_niches TEXT[] DEFAULT '{}',
    forbidden_keywords TEXT[] DEFAULT '{}',
    content_requirements TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending', 'inactive')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_websites_niche ON websites(niche);
CREATE INDEX IF NOT EXISTS idx_link_listings_website_id ON link_listings(website_id);
CREATE INDEX IF NOT EXISTS idx_link_listings_user_id ON link_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_link_listings_status ON link_listings(status);
CREATE INDEX IF NOT EXISTS idx_link_listings_link_type ON link_listings(link_type);
CREATE INDEX IF NOT EXISTS idx_link_listings_price ON link_listings(price);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_listings_updated_at BEFORE UPDATE ON link_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_listings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert users" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politiques RLS pour les sites web
CREATE POLICY "Users can view all active websites" ON websites
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own websites" ON websites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own websites" ON websites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert websites" ON websites
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politiques RLS pour les annonces de liens
CREATE POLICY "Users can view all active link listings" ON link_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own link listings" ON link_listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own link listings" ON link_listings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert link listings" ON link_listings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 