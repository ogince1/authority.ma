-- 🌟 SYSTÈME D'ÉCHANGE D'AVIS - Google My Business & Trustpilot
-- Date: 2025-01-07
-- Concept: Échange 1 pour 1 avec commission plateforme de 1 crédit

-- ===== TABLE 1: Demandes d'avis =====
CREATE TABLE IF NOT EXISTS review_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Demandeur
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Détails du business
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('google', 'trustpilot')),
  business_name VARCHAR(255) NOT NULL,
  business_url TEXT NOT NULL,
  category VARCHAR(100),
  instructions TEXT,
  
  -- Status de la demande
  status VARCHAR(30) DEFAULT 'available' CHECK (status IN (
    'available',        -- Disponible dans le pool
    'in_progress',      -- Quelqu'un l'a prise
    'pending_validation', -- En attente validation
    'completed',        -- Validée et terminée
    'rejected',         -- Rejetée par le demandeur
    'cancelled',        -- Annulée par le demandeur
    'expired'          -- Expirée (24h sans réponse)
  )),
  
  -- Reviewer (celui qui laisse l'avis)
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP,
  
  -- Preuve de l'avis
  review_screenshot_url TEXT,
  review_text TEXT, -- Copie du texte de l'avis
  submitted_at TIMESTAMP,
  
  -- Validation
  validated_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Expiration si non prise
);

-- ===== TABLE 2: Crédits des utilisateurs =====
CREATE TABLE IF NOT EXISTS review_exchange_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Balance
  credits_balance INT DEFAULT 4, -- 4 crédits offerts à l'inscription
  
  -- Statistiques
  total_reviews_given INT DEFAULT 0, -- Total avis donnés
  total_reviews_received INT DEFAULT 0, -- Total avis reçus
  total_reviews_validated INT DEFAULT 0, -- Avis validés (qualité)
  total_reviews_rejected INT DEFAULT 0, -- Avis rejetés
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== TABLE 3: Historique des crédits =====
CREATE TABLE IF NOT EXISTS review_exchange_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'refund')),
  amount INT NOT NULL, -- +1, -2, etc.
  
  related_request_id UUID REFERENCES review_exchange_requests(id),
  description TEXT,
  
  balance_before INT,
  balance_after INT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== INDEXES pour performance =====
CREATE INDEX idx_review_requests_status ON review_exchange_requests(status);
CREATE INDEX idx_review_requests_platform ON review_exchange_requests(platform);
CREATE INDEX idx_review_requests_requester ON review_exchange_requests(requester_id);
CREATE INDEX idx_review_requests_reviewer ON review_exchange_requests(reviewer_id);
CREATE INDEX idx_review_requests_created ON review_exchange_requests(created_at DESC);
CREATE INDEX idx_review_credits_user ON review_exchange_credits(user_id);
CREATE INDEX idx_review_transactions_user ON review_exchange_transactions(user_id);

-- ===== TRIGGER: Créer crédits automatiquement pour nouveaux users =====
CREATE OR REPLACE FUNCTION create_review_credits_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO review_exchange_credits (user_id, credits_balance)
  VALUES (NEW.id, 4) -- 4 crédits gratuits
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_review_credits
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_review_credits_for_user();

-- ===== FONCTION RPC: Demander un avis (coûte 2 crédits) =====
CREATE OR REPLACE FUNCTION request_review(
  p_platform VARCHAR,
  p_business_name VARCHAR,
  p_business_url TEXT,
  p_category VARCHAR,
  p_instructions TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_credits INT;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Vérifier le solde
  SELECT credits_balance INTO v_credits
  FROM review_exchange_credits
  WHERE user_id = v_user_id;
  
  IF v_credits IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Compte non trouvé');
  END IF;
  
  IF v_credits < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Solde insuffisant (minimum 2 crédits)');
  END IF;
  
  -- Créer la demande
  INSERT INTO review_exchange_requests (
    requester_id, platform, business_name, business_url, category, instructions, expires_at
  ) VALUES (
    v_user_id, p_platform, p_business_name, p_business_url, p_category, p_instructions,
    NOW() + INTERVAL '7 days' -- Expire après 7 jours si non prise
  ) RETURNING id INTO v_request_id;
  
  -- Débiter 2 crédits
  UPDATE review_exchange_credits
  SET credits_balance = credits_balance - 2,
      updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Enregistrer la transaction
  INSERT INTO review_exchange_transactions (
    user_id, type, amount, related_request_id, description, balance_before, balance_after
  ) VALUES (
    v_user_id, 'spend', -2, v_request_id, 
    'Demande d''avis créée: ' || p_business_name,
    v_credits, v_credits - 2
  );
  
  RETURN json_build_object('success', true, 'request_id', v_request_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== FONCTION RPC: Prendre une demande =====
CREATE OR REPLACE FUNCTION claim_review_request(p_request_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_requester_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Vérifier que la demande existe et est disponible
  SELECT requester_id INTO v_requester_id
  FROM review_exchange_requests
  WHERE id = p_request_id AND status = 'available';
  
  IF v_requester_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Demande non disponible');
  END IF;
  
  -- Vérifier qu'on ne prend pas sa propre demande
  IF v_requester_id = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas prendre votre propre demande');
  END IF;
  
  -- Marquer comme prise
  UPDATE review_exchange_requests
  SET status = 'in_progress',
      reviewer_id = v_user_id,
      claimed_at = NOW(),
      updated_at = NOW(),
      expires_at = NOW() + INTERVAL '24 hours' -- 24h pour laisser l'avis
  WHERE id = p_request_id AND status = 'available';
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== FONCTION RPC: Soumettre la preuve de l'avis =====
CREATE OR REPLACE FUNCTION submit_review_proof(
  p_request_id UUID,
  p_screenshot_url TEXT,
  p_review_text TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Mettre à jour avec la preuve
  UPDATE review_exchange_requests
  SET status = 'pending_validation',
      review_screenshot_url = p_screenshot_url,
      review_text = p_review_text,
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id 
    AND reviewer_id = v_user_id 
    AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Demande non trouvée ou déjà soumise');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== FONCTION RPC: Valider l'avis reçu =====
CREATE OR REPLACE FUNCTION validate_review(p_request_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_reviewer_id UUID;
  v_reviewer_credits INT;
BEGIN
  v_user_id := auth.uid();
  
  -- Récupérer le reviewer
  SELECT reviewer_id INTO v_reviewer_id
  FROM review_exchange_requests
  WHERE id = p_request_id 
    AND requester_id = v_user_id 
    AND status = 'pending_validation';
  
  IF v_reviewer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Demande non trouvée');
  END IF;
  
  -- Marquer comme complétée
  UPDATE review_exchange_requests
  SET status = 'completed',
      validated_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Créditer le reviewer (+1 crédit)
  SELECT credits_balance INTO v_reviewer_credits
  FROM review_exchange_credits
  WHERE user_id = v_reviewer_id;
  
  UPDATE review_exchange_credits
  SET credits_balance = credits_balance + 1,
      total_reviews_given = total_reviews_given + 1,
      total_reviews_validated = total_reviews_validated + 1,
      updated_at = NOW()
  WHERE user_id = v_reviewer_id;
  
  -- Incrémenter avis reçus du demandeur
  UPDATE review_exchange_credits
  SET total_reviews_received = total_reviews_received + 1,
      updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Transaction crédit
  INSERT INTO review_exchange_transactions (
    user_id, type, amount, related_request_id, description, 
    balance_before, balance_after
  ) VALUES (
    v_reviewer_id, 'earn', 1, p_request_id,
    'Avis validé et crédit gagné',
    v_reviewer_credits, v_reviewer_credits + 1
  );
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RLS Policies =====
ALTER TABLE review_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_exchange_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_exchange_transactions ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les demandes disponibles
CREATE POLICY "Anyone can view available requests"
ON review_exchange_requests FOR SELECT
USING (status = 'available' OR requester_id = auth.uid() OR reviewer_id = auth.uid());

-- Users peuvent voir leurs propres crédits
CREATE POLICY "Users can view own credits"
ON review_exchange_credits FOR SELECT
USING (user_id = auth.uid());

-- Users peuvent voir leurs transactions
CREATE POLICY "Users can view own transactions"
ON review_exchange_transactions FOR SELECT
USING (user_id = auth.uid());

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all"
ON review_exchange_requests FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

COMMENT ON TABLE review_exchange_requests IS 'Demandes d''échange d''avis Google My Business et Trustpilot';
COMMENT ON TABLE review_exchange_credits IS 'Crédits d''avis des utilisateurs (1 avis donné = 1 crédit)';
COMMENT ON TABLE review_exchange_transactions IS 'Historique des transactions de crédits d''avis';
