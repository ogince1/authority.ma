-- Migration pour corriger l'accès des éditeurs aux données des annonceurs
-- Date: 2025-01-21

-- Fonction pour vérifier le solde d'un annonceur (accessible aux éditeurs)
CREATE OR REPLACE FUNCTION check_advertiser_balance(advertiser_id UUID)
RETURNS TABLE(
  balance DECIMAL(10,2),
  user_id UUID
) AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est un éditeur
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'publisher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only publishers can check advertiser balance';
  END IF;

  -- Vérifier que l'annonceur existe et retourner son solde
  RETURN QUERY
  SELECT u.balance, u.id
  FROM users u
  WHERE u.id = advertiser_id
  AND u.role = 'advertiser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour permettre l'accès à cette fonction
GRANT EXECUTE ON FUNCTION check_advertiser_balance(UUID) TO authenticated;

-- Fonction pour obtenir les détails d'une demande d'achat avec vérifications
CREATE OR REPLACE FUNCTION get_purchase_request_details(request_id UUID)
RETURNS TABLE(
  id UUID,
  link_listing_id UUID,
  user_id UUID,
  publisher_id UUID,
  target_url TEXT,
  anchor_text TEXT,
  message TEXT,
  proposed_price DECIMAL(10,2),
  proposed_duration INTEGER,
  status TEXT,
  editor_response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  placed_url TEXT,
  placed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  advertiser_name TEXT,
  advertiser_email TEXT,
  advertiser_balance DECIMAL(10,2)
) AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est impliqué dans cette demande
  IF NOT EXISTS (
    SELECT 1 FROM link_purchase_requests 
    WHERE id = request_id 
    AND (user_id = auth.uid() OR publisher_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only access your own purchase requests';
  END IF;

  -- Retourner les détails de la demande avec les informations de l'annonceur
  RETURN QUERY
  SELECT 
    pr.id,
    pr.link_listing_id,
    pr.user_id,
    pr.publisher_id,
    pr.target_url,
    pr.anchor_text,
    pr.message,
    pr.proposed_price,
    pr.proposed_duration,
    pr.status,
    pr.editor_response,
    pr.response_date,
    pr.placed_url,
    pr.placed_at,
    pr.created_at,
    pr.updated_at,
    u.name as advertiser_name,
    u.email as advertiser_email,
    u.balance as advertiser_balance
  FROM link_purchase_requests pr
  JOIN users u ON pr.user_id = u.id
  WHERE pr.id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour permettre l'accès à cette fonction
GRANT EXECUTE ON FUNCTION get_purchase_request_details(UUID) TO authenticated; 