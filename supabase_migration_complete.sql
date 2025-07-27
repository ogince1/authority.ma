-- Migration complète pour créer la plateforme de vente de liens au Maroc
-- Authority.ma - Base de données complète

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('advertiser', 'publisher', 'admin')),
    phone VARCHAR(50),
    website VARCHAR(255),
    bio TEXT,
    company_name VARCHAR(255),
    company_size VARCHAR(50) CHECK (company_size IN ('startup', 'sme', 'large', 'agency')),
    location VARCHAR(255),
    advertiser_info JSONB,
    publisher_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sites web (éditeurs)
CREATE TABLE IF NOT EXISTS websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('blog', 'ecommerce', 'actualites', 'lifestyle', 'tech', 'business', 'sante', 'education', 'immobilier', 'automobile', 'voyage', 'cuisine', 'sport', 'culture', 'politique', 'economie')),
    niche VARCHAR(50) NOT NULL CHECK (niche IN ('immobilier', 'sante', 'beaute', 'mode', 'tech', 'finance', 'education', 'voyage', 'cuisine', 'sport', 'automobile', 'lifestyle', 'business', 'actualites', 'culture', 'politique', 'economie', 'art', 'musique', 'cinema')),
    owner_status VARCHAR(50) NOT NULL CHECK (owner_status IN ('professionnel', 'particulier', 'entreprise', 'agence')),
    metrics JSONB,
    contact_info JSONB NOT NULL,
    logo VARCHAR(500),
    screenshots TEXT[],
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('active', 'inactive', 'pending_approval', 'suspended')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    available_link_spots INTEGER NOT NULL DEFAULT 1,
    average_response_time INTEGER,
    payment_methods TEXT[],
    languages TEXT[],
    content_quality VARCHAR(50) CHECK (content_quality IN ('excellent', 'good', 'average', 'poor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des annonces de liens
CREATE TABLE IF NOT EXISTS link_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    anchor_text VARCHAR(255) NOT NULL,
    link_type VARCHAR(50) NOT NULL CHECK (link_type IN ('dofollow', 'nofollow', 'sponsored', 'ugc')),
    position VARCHAR(50) NOT NULL CHECK (position IN ('header', 'footer', 'sidebar', 'content', 'menu', 'popup')),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MAD' CHECK (currency IN ('MAD', 'EUR', 'USD')),
    minimum_contract_duration INTEGER NOT NULL DEFAULT 1,
    max_links_per_page INTEGER,
    allowed_niches TEXT[],
    forbidden_keywords TEXT[],
    content_requirements TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'sold', 'pending', 'inactive')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    images TEXT[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes d'achat de liens
CREATE TABLE IF NOT EXISTS link_purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_listing_id UUID NOT NULL REFERENCES link_listings(id) ON DELETE CASCADE,
    advertiser_name VARCHAR(255) NOT NULL,
    advertiser_email VARCHAR(255) NOT NULL,
    advertiser_phone VARCHAR(50),
    advertiser_website VARCHAR(500),
    proposed_anchor_text VARCHAR(255) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    message TEXT,
    proposed_price DECIMAL(10,2),
    proposed_duration INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
    editor_response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_request_id UUID NOT NULL REFERENCES link_purchase_requests(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MAD' CHECK (currency IN ('MAD', 'EUR', 'USD')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(100) NOT NULL,
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    publisher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_listing_id UUID NOT NULL REFERENCES link_listings(id) ON DELETE CASCADE,
    platform_fee DECIMAL(10,2) NOT NULL,
    publisher_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des avis et évaluations
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('advertiser_to_publisher', 'publisher_to_advertiser')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url VARCHAR(500),
    action_type VARCHAR(50) CHECK (action_type IN ('link_purchase', 'website_approval', 'payment', 'review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages entre utilisateurs
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    related_purchase_request_id UUID REFERENCES link_purchase_requests(id) ON DELETE SET NULL,
    related_website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des articles de blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    images TEXT[],
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des histoires de succès
CREATE TABLE IF NOT EXISTS success_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    founder_name VARCHAR(255) NOT NULL,
    founder_image VARCHAR(500),
    company_logo VARCHAR(500),
    industry VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    story_content TEXT NOT NULL,
    challenge TEXT,
    solution TEXT,
    results TEXT,
    metrics JSONB,
    images TEXT[],
    tags TEXT[],
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_websites_niche ON websites(niche);

CREATE INDEX IF NOT EXISTS idx_link_listings_website_id ON link_listings(website_id);
CREATE INDEX IF NOT EXISTS idx_link_listings_status ON link_listings(status);
CREATE INDEX IF NOT EXISTS idx_link_listings_price ON link_listings(price);
CREATE INDEX IF NOT EXISTS idx_link_listings_currency ON link_listings(currency);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_link_listing_id ON link_purchase_requests(link_listing_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON link_purchase_requests(status);

CREATE INDEX IF NOT EXISTS idx_transactions_purchase_request_id ON transactions(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_advertiser_id ON transactions(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_transactions_publisher_id ON transactions(publisher_id);

CREATE INDEX IF NOT EXISTS idx_reviews_transaction_id ON reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

CREATE INDEX IF NOT EXISTS idx_success_stories_status ON success_stories(status);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_link_listings_updated_at BEFORE UPDATE ON link_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON link_purchase_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_success_stories_updated_at BEFORE UPDATE ON success_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
-- Users: Chacun peut voir son propre profil
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Websites: Public pour la lecture, propriétaire pour modification
CREATE POLICY "Websites are viewable by everyone" ON websites FOR SELECT USING (true);
CREATE POLICY "Website owners can update" ON websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Website owners can insert" ON websites FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Link listings: Public pour la lecture, propriétaire pour modification
CREATE POLICY "Link listings are viewable by everyone" ON link_listings FOR SELECT USING (true);
CREATE POLICY "Link listing owners can update" ON link_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Link listing owners can insert" ON link_listings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchase requests: Créateur et propriétaire du lien peuvent voir
CREATE POLICY "Purchase requests viewable by creator and link owner" ON link_purchase_requests FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM link_listings WHERE id = link_listing_id)
);
CREATE POLICY "Anyone can create purchase requests" ON link_purchase_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Link owners can update purchase requests" ON link_purchase_requests FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM link_listings WHERE id = link_listing_id)
);

-- Transactions: Parties impliquées peuvent voir
CREATE POLICY "Transaction parties can view" ON transactions FOR SELECT USING (
    auth.uid() = advertiser_id OR auth.uid() = publisher_id
);
CREATE POLICY "Admin can manage transactions" ON transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews: Public pour la lecture, créateur pour modification
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Review creators can insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: Utilisateur peut voir ses notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Messages: Expéditeur et destinataire peuvent voir
CREATE POLICY "Message participants can view" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Blog posts: Public pour la lecture, auteur pour modification
CREATE POLICY "Blog posts are viewable by everyone" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Blog authors can manage" ON blog_posts FOR ALL USING (auth.uid() = author_id);

-- Success stories: Public pour la lecture, admin pour modification
CREATE POLICY "Success stories are viewable by everyone" ON success_stories FOR SELECT USING (true);
CREATE POLICY "Admin can manage success stories" ON success_stories FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Données de test pour commencer
INSERT INTO users (id, name, email, role, company_name, location) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Admin Authority', 'admin@authority.ma', 'admin', 'Authority.ma', 'Casablanca, Maroc'),
('550e8400-e29b-41d4-a716-446655440002', 'Mohammed Alami', 'mohammed@example.com', 'publisher', 'Blog Tech Maroc', 'Rabat, Maroc'),
('550e8400-e29b-41d4-a716-446655440003', 'Fatima Bennani', 'fatima@example.com', 'advertiser', 'E-commerce Plus', 'Marrakech, Maroc')
ON CONFLICT (id) DO NOTHING;

-- Message de confirmation
SELECT 'Migration Authority.ma terminée avec succès!' as status; 