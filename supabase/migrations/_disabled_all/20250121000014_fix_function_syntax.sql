-- Migration pour corriger la syntaxe de la fonction search_link_listings
-- Date: 2025-01-21

-- Supprimer la fonction problématique
DROP FUNCTION IF EXISTS search_link_listings(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], DECIMAL, DECIMAL, INTEGER, INTEGER, INTEGER, INTEGER, TEXT[], INTEGER, INTEGER);

-- Recréer la fonction avec la syntaxe corrigée
CREATE OR REPLACE FUNCTION search_link_listings(
    p_search TEXT DEFAULT NULL,
    p_category TEXT[] DEFAULT NULL,
    p_niche TEXT[] DEFAULT NULL,
    p_link_type TEXT[] DEFAULT NULL,
    p_link_position TEXT[] DEFAULT NULL,
    p_min_price DECIMAL(10,2) DEFAULT NULL,
    p_max_price DECIMAL(10,2) DEFAULT NULL,
    p_min_domain_authority INTEGER DEFAULT NULL,
    p_max_domain_authority INTEGER DEFAULT NULL,
    p_min_traffic INTEGER DEFAULT NULL,
    p_max_traffic INTEGER DEFAULT NULL,
    p_content_quality TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL(10,2),
    currency TEXT,
    link_type TEXT,
    link_position TEXT,
    website_title TEXT,
    website_url TEXT,
    domain_authority INTEGER,
    monthly_traffic INTEGER,
    quality_score DECIMAL(5,2),
    publisher_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lc.id,
        lc.title,
        lc.description,
        lc.price,
        lc.currency,
        lc.link_type,
        lc.position,
        lc.website_title,
        lc.website_url,
        lc.domain_authority,
        lc.monthly_traffic,
        lc.quality_score,
        lc.publisher_name,
        lc.created_at
    FROM link_catalog lc
    WHERE 
        (p_search IS NULL OR 
         to_tsvector('french', lc.title || ' ' || lc.description) @@ plainto_tsquery('french', p_search))
        AND (p_category IS NULL OR lc.website_category = ANY(p_category))
        AND (p_niche IS NULL OR lc.website_niche = ANY(p_niche))
        AND (p_link_type IS NULL OR lc.link_type = ANY(p_link_type))
        AND (p_link_position IS NULL OR lc.position = ANY(p_link_position))
        AND (p_min_price IS NULL OR lc.price >= p_min_price)
        AND (p_max_price IS NULL OR lc.price <= p_max_price)
        AND (p_min_domain_authority IS NULL OR lc.domain_authority >= p_min_domain_authority)
        AND (p_max_domain_authority IS NULL OR lc.domain_authority <= p_max_domain_authority)
        AND (p_min_traffic IS NULL OR lc.monthly_traffic >= p_min_traffic)
        AND (p_max_traffic IS NULL OR lc.monthly_traffic <= p_max_traffic)
        AND (p_content_quality IS NULL OR lc.content_quality = ANY(p_content_quality))
    ORDER BY lc.quality_score DESC, lc.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql; 