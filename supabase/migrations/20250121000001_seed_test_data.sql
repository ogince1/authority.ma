-- Migration pour ajouter des données de test
-- Date: 2025-01-21
-- Description: Insertion de données de test pour la plateforme de vente de liens

-- Insertion d'utilisateurs de test
INSERT INTO users (name, email, role, phone, website, bio, company_name, company_size, location, created_at, updated_at) VALUES
-- Éditeurs (publishers)
('Ahmed Benali', 'ahmed@techblog.ma', 'publisher', '+212 6 12 34 56 78', 'https://techblog.ma', 'Blogueur tech passionné par l''innovation au Maroc', 'TechBlog.ma', 'startup', 'Casablanca, Maroc', NOW(), NOW()),
('Fatima Zahra', 'fatima@lifestyle.ma', 'publisher', '+212 6 23 45 67 89', 'https://lifestyle.ma', 'Influenceuse lifestyle et bien-être', 'Lifestyle.ma', 'startup', 'Rabat, Maroc', NOW(), NOW()),
('Karim Tazi', 'karim@business.ma', 'publisher', '+212 6 34 56 78 90', 'https://business.ma', 'Expert en business et entrepreneuriat', 'Business.ma', 'sme', 'Marrakech, Maroc', NOW(), NOW()),

-- Annonceurs (advertisers)
('Sara Alami', 'sara@startup.ma', 'advertiser', '+212 6 45 67 89 01', 'https://startup.ma', 'Fondatrice d''une startup tech', 'StartupTech', 'startup', 'Casablanca, Maroc', NOW(), NOW()),
('Youssef Idrissi', 'youssef@agency.ma', 'advertiser', '+212 6 56 78 90 12', 'https://agency.ma', 'Directeur d''agence marketing digital', 'DigitalAgency', 'agency', 'Fès, Maroc', NOW(), NOW()),
('Amina Benslimane', 'amina@ecommerce.ma', 'advertiser', '+212 6 67 89 01 23', 'https://ecommerce.ma', 'Fondatrice d''une boutique en ligne', 'EcommerceStore', 'sme', 'Agadir, Maroc', NOW(), NOW()),

-- Admin
('Admin Authority', 'admin@authority.ma', 'admin', '+212 6 78 90 12 34', 'https://authority.ma', 'Administrateur de la plateforme', 'Authority.ma', 'large', 'Casablanca, Maroc', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insertion de sites web de test
INSERT INTO websites (title, description, url, category, niche, owner_status, metrics, contact_info, logo, screenshots, meta_title, meta_description, slug, status, user_id, available_link_spots, average_response_time, payment_methods, languages, content_quality, created_at, updated_at) VALUES
('TechBlog.ma', 'Blog technologique marocain couvrant l''innovation, les startups et la tech au Maroc', 'https://techblog.ma', 'blog', 'tech', 'professionnel', '{"monthly_traffic": 50000, "domain_authority": 45, "page_authority": 40, "backlinks_count": 1200, "organic_keywords": 800, "alexa_rank": 15000, "google_indexed_pages": 150, "social_media_followers": {"facebook": 3000, "twitter": 2000}}', '{"name": "Ahmed Benali", "email": "contact@techblog.ma", "phone": "+212 6 12 34 56 78", "whatsapp": "+212 6 12 34 56 78", "website": "https://techblog.ma"}', 'https://techblog.ma/logo.png', ARRAY['https://techblog.ma/screenshot1.jpg', 'https://techblog.ma/screenshot2.jpg'], 'TechBlog.ma - Blog Tech Marocain', 'Découvrez les dernières innovations technologiques au Maroc', 'techblog-ma', 'active', (SELECT id FROM users WHERE email = 'ahmed@techblog.ma'), 5, 24, ARRAY['virement', 'paypal'], ARRAY['français', 'arabe'], 'excellent', NOW(), NOW()),

('Lifestyle.ma', 'Blog lifestyle et bien-être pour les femmes marocaines modernes', 'https://lifestyle.ma', 'blog', 'lifestyle', 'professionnel', '{"monthly_traffic": 35000, "domain_authority": 38, "page_authority": 35, "backlinks_count": 800, "organic_keywords": 600, "alexa_rank": 25000, "google_indexed_pages": 120, "social_media_followers": {"instagram": 5000, "facebook": 3000}}', '{"name": "Fatima Zahra", "email": "contact@lifestyle.ma", "phone": "+212 6 23 45 67 89", "whatsapp": "+212 6 23 45 67 89", "website": "https://lifestyle.ma"}', 'https://lifestyle.ma/logo.png', ARRAY['https://lifestyle.ma/screenshot1.jpg'], 'Lifestyle.ma - Blog Lifestyle Marocain', 'Conseils lifestyle et bien-être pour les femmes marocaines', 'lifestyle-ma', 'active', (SELECT id FROM users WHERE email = 'fatima@lifestyle.ma'), 3, 12, ARRAY['virement', 'paypal'], ARRAY['français', 'arabe'], 'excellent', NOW(), NOW()),

('Business.ma', 'Portail d''actualités business et entrepreneuriat au Maroc', 'https://business.ma', 'actualites', 'business', 'professionnel', '{"monthly_traffic": 75000, "domain_authority": 52, "page_authority": 48, "backlinks_count": 2000, "organic_keywords": 1200, "alexa_rank": 8000, "google_indexed_pages": 300, "social_media_followers": {"linkedin": 8000, "twitter": 4000}}', '{"name": "Karim Tazi", "email": "contact@business.ma", "phone": "+212 6 34 56 78 90", "whatsapp": "+212 6 34 56 78 90", "website": "https://business.ma"}', 'https://business.ma/logo.png', ARRAY['https://business.ma/screenshot1.jpg', 'https://business.ma/screenshot2.jpg'], 'Business.ma - Actualités Business Maroc', 'Actualités business, entrepreneuriat et économie au Maroc', 'business-ma', 'active', (SELECT id FROM users WHERE email = 'karim@business.ma'), 8, 6, ARRAY['virement', 'paypal', 'carte'], ARRAY['français', 'arabe', 'anglais'], 'excellent', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insertion d'annonces de liens de test
INSERT INTO link_listings (website_id, title, description, target_url, anchor_text, link_type, position, price, currency, minimum_contract_duration, max_links_per_page, allowed_niches, forbidden_keywords, content_requirements, status, user_id, meta_title, meta_description, slug, images, tags, created_at, updated_at) VALUES
((SELECT id FROM websites WHERE slug = 'techblog-ma'), 'Lien Dofollow Header TechBlog.ma', 'Lien dofollow de haute qualité dans le header du blog tech marocain', 'https://example.com', 'Startup Tech Maroc', 'dofollow', 'header', 1500.00, 'MAD', 6, 1, ARRAY['tech', 'startup', 'innovation'], ARRAY['casino', 'porn', 'pharma'], 'Contenu de qualité sur la tech ou les startups', 'active', (SELECT id FROM users WHERE email = 'ahmed@techblog.ma'), 'Lien Dofollow Header TechBlog.ma', 'Lien dofollow de haute qualité dans le header', 'lien-dofollow-header-techblog', ARRAY['https://example.com/link1.jpg'], ARRAY['dofollow', 'header', 'tech'], NOW(), NOW()),

((SELECT id FROM websites WHERE slug = 'lifestyle-ma'), 'Lien Nofollow Article Lifestyle.ma', 'Lien nofollow dans un article lifestyle', 'https://example.com', 'Mode Marocaine', 'nofollow', 'content', 800.00, 'MAD', 3, 2, ARRAY['lifestyle', 'mode', 'beaute'], ARRAY['casino', 'porn', 'pharma'], 'Contenu lifestyle de qualité', 'active', (SELECT id FROM users WHERE email = 'fatima@lifestyle.ma'), 'Lien Nofollow Article Lifestyle.ma', 'Lien nofollow dans un article lifestyle', 'lien-nofollow-article-lifestyle', ARRAY['https://example.com/link2.jpg'], ARRAY['nofollow', 'content', 'lifestyle'], NOW(), NOW()),

((SELECT id FROM websites WHERE slug = 'business-ma'), 'Lien Sponsored Sidebar Business.ma', 'Lien sponsored dans la sidebar du portail business', 'https://example.com', 'Investissement Maroc', 'sponsored', 'sidebar', 2000.00, 'MAD', 12, 1, ARRAY['business', 'finance', 'investissement'], ARRAY['casino', 'porn', 'pharma'], 'Contenu business professionnel', 'active', (SELECT id FROM users WHERE email = 'karim@business.ma'), 'Lien Sponsored Sidebar Business.ma', 'Lien sponsored dans la sidebar', 'lien-sponsored-sidebar-business', ARRAY['https://example.com/link3.jpg'], ARRAY['sponsored', 'sidebar', 'business'], NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insertion de demandes d'achat de test
INSERT INTO link_purchase_requests (link_listing_id, advertiser_name, advertiser_email, advertiser_phone, advertiser_website, proposed_anchor_text, target_url, message, proposed_price, proposed_duration, status, editor_response, response_date, created_at, updated_at) VALUES
((SELECT id FROM link_listings WHERE slug = 'lien-dofollow-header-techblog'), 'Sara Alami', 'sara@startup.ma', '+212 6 45 67 89 01', 'https://startup.ma', 'Startup Innovation Maroc', 'https://startup.ma', 'Bonjour, je souhaite acheter ce lien pour ma startup tech. Notre site traite de l''innovation au Maroc.', 1500.00, 6, 'pending', NULL, NULL, NOW(), NOW()),

((SELECT id FROM link_listings WHERE slug = 'lien-nofollow-article-lifestyle'), 'Youssef Idrissi', 'youssef@agency.ma', '+212 6 56 78 90 12', 'https://agency.ma', 'Agence Marketing Digital', 'https://agency.ma', 'Intéressé par ce lien pour promouvoir nos services marketing digital.', 800.00, 3, 'accepted', 'Lien accepté, nous vous contacterons pour la mise en place.', NOW(), NOW(), NOW()),

((SELECT id FROM link_listings WHERE slug = 'lien-sponsored-sidebar-business'), 'Amina Benslimane', 'amina@ecommerce.ma', '+212 6 67 89 01 23', 'https://ecommerce.ma', 'Boutique en Ligne Maroc', 'https://ecommerce.ma', 'Parfait pour notre boutique en ligne. Nous proposons 1800 MAD pour 12 mois.', 1800.00, 12, 'negotiating', 'Nous pouvons accepter 1900 MAD pour 12 mois.', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertion de transactions de test
INSERT INTO transactions (purchase_request_id, amount, currency, status, payment_method, advertiser_id, publisher_id, link_listing_id, platform_fee, publisher_amount, created_at, completed_at) VALUES
((SELECT id FROM link_purchase_requests WHERE advertiser_email = 'youssef@agency.ma' LIMIT 1), 800.00, 'MAD', 'completed', 'virement', (SELECT id FROM users WHERE email = 'youssef@agency.ma'), (SELECT id FROM users WHERE email = 'fatima@lifestyle.ma'), (SELECT id FROM link_listings WHERE slug = 'lien-nofollow-article-lifestyle'), 80.00, 720.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING; 