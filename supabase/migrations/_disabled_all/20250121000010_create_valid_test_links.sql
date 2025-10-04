-- Migration pour créer des liens de test valides
-- Date: 2025-01-21

-- Insérer des liens de test valides
DO $$
DECLARE
  v_publisher_id UUID;
  v_website_id UUID;
BEGIN
  -- Récupérer un utilisateur éditeur
  SELECT id INTO v_publisher_id FROM users WHERE role = 'publisher' LIMIT 1;
  
  -- Récupérer un site web
  SELECT id INTO v_website_id FROM websites LIMIT 1;
  
  -- Créer des liens de test seulement si on a les données nécessaires
  IF v_publisher_id IS NOT NULL AND v_website_id IS NOT NULL THEN
    INSERT INTO link_listings (
      id,
      title,
      description,
      slug,
      link_type,
      position,
      price,
      currency,
      allowed_niches,
      status,
      user_id,
      website_id,
      target_url,
      anchor_text,
      created_at,
      updated_at
    ) VALUES 
    (
      gen_random_uuid(),
      'Lien Premium - Article Tech',
      'Lien dofollow de haute qualité sur un article technologique',
      'lien-premium-article-tech',
      'dofollow',
      'sidebar',
      500.00,
      'MAD',
      ARRAY['tech', 'business'],
      'active',
      v_publisher_id,
      v_website_id,
      'https://example.com/article-tech',
      'technologie',
      NOW(),
      NOW()
    ),
    (
      gen_random_uuid(),
      'Lien Sponsored - Guide Marketing',
      'Lien sponsored sur un guide de marketing digital',
      'lien-sponsored-guide-marketing',
      'sponsored',
      'content',
      750.00,
      'MAD',
      ARRAY['marketing', 'business'],
      'active',
      v_publisher_id,
      v_website_id,
      'https://example.com/guide-marketing',
      'marketing digital',
      NOW(),
      NOW()
    ),
    (
      gen_random_uuid(),
      'Lien UGC - Avis Produit',
      'Lien UGC sur un avis de produit',
      'lien-ugc-avis-produit',
      'ugc',
      'footer',
      300.00,
      'MAD',
      ARRAY['lifestyle', 'shopping'],
      'active',
      v_publisher_id,
      v_website_id,
      'https://example.com/avis-produit',
      'avis client',
      NOW(),
      NOW()
    ),
    (
      gen_random_uuid(),
      'Lien Nofollow - Ressource',
      'Lien nofollow sur une page de ressources',
      'lien-nofollow-ressource',
      'nofollow',
      'header',
      400.00,
      'MAD',
      ARRAY['education', 'reference'],
      'active',
      v_publisher_id,
      v_website_id,
      'https://example.com/ressources',
      'ressources',
      NOW(),
      NOW()
    );
  END IF;
END $$; 