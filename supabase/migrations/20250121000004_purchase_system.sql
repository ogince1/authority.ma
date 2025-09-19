-- Migration pour le système d'achat et de demandes
-- Date: 2025-01-21

-- Table pour les demandes d'achat de liens (créée seulement si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    CREATE TABLE link_purchase_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      link_listing_id UUID NOT NULL REFERENCES link_listings(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- ID de l'annonceur
      publisher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- ID de l'éditeur
      
      -- Détails de la demande
      target_url TEXT NOT NULL,
      anchor_text TEXT NOT NULL,
      message TEXT,
      
      -- Prix et conditions
      proposed_price DECIMAL(10,2) NOT NULL,
      proposed_duration INTEGER NOT NULL DEFAULT 1, -- Durée en mois
      
      -- Statut de la demande
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
      
      -- Réponse de l'éditeur
      editor_response TEXT,
      response_date TIMESTAMP WITH TIME ZONE,
      
      -- Informations de création
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Table pour les transactions d'achat (créée seulement si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_transactions') THEN
    CREATE TABLE link_purchase_transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      purchase_request_id UUID NOT NULL REFERENCES link_purchase_requests(id) ON DELETE CASCADE,
      
      -- Parties impliquées
      advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      publisher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      link_listing_id UUID NOT NULL REFERENCES link_listings(id) ON DELETE CASCADE,
      
      -- Détails financiers
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'MAD',
      platform_fee DECIMAL(10,2) NOT NULL, -- Commission plateforme
      publisher_amount DECIMAL(10,2) NOT NULL, -- Montant versé à l'éditeur
      
      -- Statut de la transaction
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
      
      -- Informations de paiement
      payment_method VARCHAR(20),
      payment_reference VARCHAR(255),
      
      -- Informations de création
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}'::jsonb
    );
  END IF;
END $$;

-- Index pour les performances (créés seulement si les tables existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_link_listing_id ON link_purchase_requests(link_listing_id);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_user_id ON link_purchase_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_publisher_id ON link_purchase_requests(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_status ON link_purchase_requests(status);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_created_at ON link_purchase_requests(created_at DESC);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_link_purchase_transactions_purchase_request_id ON link_purchase_transactions(purchase_request_id);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_transactions_advertiser_id ON link_purchase_transactions(advertiser_id);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_transactions_publisher_id ON link_purchase_transactions(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_transactions_status ON link_purchase_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_link_purchase_transactions_created_at ON link_purchase_transactions(created_at DESC);
  END IF;
END $$;

-- Activer RLS (Row Level Security) seulement si les tables existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    ALTER TABLE link_purchase_requests ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_transactions') THEN
    ALTER TABLE link_purchase_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Politiques RLS pour link_purchase_requests (créées seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_requests') THEN
    DROP POLICY IF EXISTS "Users can view their own purchase requests" ON link_purchase_requests;
    DROP POLICY IF EXISTS "Advertisers can create purchase requests" ON link_purchase_requests;
    DROP POLICY IF EXISTS "Publishers can update their purchase requests" ON link_purchase_requests;
    
    CREATE POLICY "Users can view their own purchase requests" ON link_purchase_requests
      FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = publisher_id OR
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
      );

    CREATE POLICY "Advertisers can create purchase requests" ON link_purchase_requests
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Publishers can update their purchase requests" ON link_purchase_requests
      FOR UPDATE USING (auth.uid() = publisher_id);
  END IF;
END $$;

-- Politiques RLS pour link_purchase_transactions (créées seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'link_purchase_transactions') THEN
    DROP POLICY IF EXISTS "Users can view their own transactions" ON link_purchase_transactions;
    DROP POLICY IF EXISTS "System can create transactions" ON link_purchase_transactions;
    DROP POLICY IF EXISTS "System can update transactions" ON link_purchase_transactions;
    
    CREATE POLICY "Users can view their own transactions" ON link_purchase_transactions
      FOR SELECT USING (
        auth.uid() = advertiser_id OR 
        auth.uid() = publisher_id OR
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
      );

    CREATE POLICY "System can create transactions" ON link_purchase_transactions
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "System can update transactions" ON link_purchase_transactions
      FOR UPDATE USING (true);
  END IF;
END $$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_link_purchase_requests_updated_at 
  BEFORE UPDATE ON link_purchase_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour traiter un achat de lien
CREATE OR REPLACE FUNCTION process_link_purchase(
  p_purchase_request_id UUID,
  p_advertiser_id UUID,
  p_publisher_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS JSON AS $$
DECLARE
  v_platform_fee DECIMAL(10,2);
  v_publisher_amount DECIMAL(10,2);
  v_transaction_id UUID;
  v_advertiser_balance DECIMAL(10,2);
  v_publisher_balance DECIMAL(10,2);
BEGIN
  -- Calculer les montants
  v_platform_fee := p_amount * 0.10; -- 10% de commission
  v_publisher_amount := p_amount - v_platform_fee;
  
  -- Vérifier le solde de l'annonceur
  SELECT balance INTO v_advertiser_balance FROM users WHERE id = p_advertiser_id;
  IF v_advertiser_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Solde insuffisant');
  END IF;
  
  -- Créer la transaction
  INSERT INTO link_purchase_transactions (
    purchase_request_id,
    advertiser_id,
    publisher_id,
    link_listing_id,
    amount,
    platform_fee,
    publisher_amount,
    status,
    completed_at
  ) VALUES (
    p_purchase_request_id,
    p_advertiser_id,
    p_publisher_id,
    (SELECT link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id),
    p_amount,
    v_platform_fee,
    v_publisher_amount,
    'completed',
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Débiter l'annonceur
  UPDATE users SET balance = balance - p_amount WHERE id = p_advertiser_id;
  
  -- Créditer l'éditeur
  UPDATE users SET balance = balance + v_publisher_amount WHERE id = p_publisher_id;
  
  -- Mettre à jour le statut de la demande
  UPDATE link_purchase_requests SET status = 'accepted' WHERE id = p_purchase_request_id;
  
  -- Créer les transactions de crédit
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    related_transaction_id,
    related_link_listing_id,
    related_purchase_request_id,
    balance_before,
    balance_after
  ) VALUES 
  (p_advertiser_id, 'purchase', p_amount, 'Achat de lien', v_transaction_id, 
   (SELECT link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id), 
   p_purchase_request_id, v_advertiser_balance, v_advertiser_balance - p_amount),
  (p_publisher_id, 'deposit', v_publisher_amount, 'Vente de lien', v_transaction_id,
   (SELECT link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id),
   p_purchase_request_id, 
   (SELECT balance FROM users WHERE id = p_publisher_id) - v_publisher_amount,
   (SELECT balance FROM users WHERE id = p_publisher_id));
  
  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Données de test pour les demandes d'achat
DO $$
DECLARE
  advertiser_id UUID;
  publisher_id UUID;
  link_listing_id UUID;
BEGIN
  -- Récupérer les IDs des utilisateurs de test
  SELECT id INTO advertiser_id FROM users WHERE email = 'advertiser@test.com' LIMIT 1;
  SELECT id INTO publisher_id FROM users WHERE email = 'publisher@test.com' LIMIT 1;
  SELECT id INTO link_listing_id FROM link_listings LIMIT 1;
  
  -- Insérer des demandes de test seulement si les utilisateurs existent
  IF advertiser_id IS NOT NULL AND publisher_id IS NOT NULL AND link_listing_id IS NOT NULL THEN
    INSERT INTO link_purchase_requests (
      link_listing_id,
      user_id,
      publisher_id,
      target_url,
      anchor_text,
      message,
      proposed_price,
      proposed_duration,
      status
    ) VALUES 
    (link_listing_id, advertiser_id, publisher_id, 'https://example.com', 'Lien de test', 'Demande de test', 1500.00, 12, 'pending'),
    (link_listing_id, advertiser_id, publisher_id, 'https://test.com', 'Autre lien', 'Deuxième demande', 2000.00, 6, 'accepted'),
    (link_listing_id, advertiser_id, publisher_id, 'https://demo.com', 'Lien demo', 'Demande refusée', 1000.00, 3, 'rejected')
    ON CONFLICT DO NOTHING;
  END IF;
END $$; 