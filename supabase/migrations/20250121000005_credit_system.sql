-- Migration pour le système de crédit/solde
-- Date: 2025-01-21

-- Ajouter la colonne balance à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT NULL;

-- Créer la table credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'refund', 'commission')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'MAD',
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT NOT NULL,
  
  -- Contexte de la transaction
  related_transaction_id UUID REFERENCES credit_transactions(id),
  related_link_listing_id UUID REFERENCES link_listings(id),
  related_purchase_request_id UUID REFERENCES link_purchase_requests(id),
  
  -- Méthode de paiement (pour les dépôts)
  payment_method VARCHAR(20) CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'manual')),
  payment_reference VARCHAR(255),
  
  -- Solde avant et après
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  -- Informations de création
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index pour les performances
  CONSTRAINT valid_balance CHECK (balance_after >= 0)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_credit_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_transactions_updated_at
  BEFORE UPDATE ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_transactions_updated_at();

-- RLS Policies pour credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres transactions
CREATE POLICY "Users can create their own credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les admins peuvent voir toutes les transactions
CREATE POLICY "Admins can view all credit transactions" ON credit_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Fonction pour vérifier le solde avant une transaction
CREATE OR REPLACE FUNCTION check_balance_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  -- Calculer le nouveau solde
  IF NEW.type IN ('deposit', 'refund') THEN
    NEW.balance_after := current_balance + NEW.amount;
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    NEW.balance_after := current_balance - NEW.amount;
    
    -- Vérifier que le solde ne devient pas négatif
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant pour cette transaction';
    END IF;
  END IF;
  
  NEW.balance_before := current_balance;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier le solde avant insertion
CREATE TRIGGER trigger_check_balance_before_transaction
  BEFORE INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_before_transaction();

-- Fonction pour mettre à jour le solde de l'utilisateur après une transaction
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le solde de l'utilisateur
  UPDATE users 
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le solde après insertion
CREATE TRIGGER trigger_update_user_balance_after_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_transaction();

-- Données de test pour le système de crédit (seulement si les utilisateurs existent)
DO $$
DECLARE
  advertiser_id UUID;
  publisher_id UUID;
BEGIN
  -- Récupérer les IDs des utilisateurs de test
  SELECT id INTO advertiser_id FROM users WHERE email = 'advertiser@test.com' LIMIT 1;
  SELECT id INTO publisher_id FROM users WHERE email = 'publisher@test.com' LIMIT 1;
  
  -- Insérer les transactions seulement si les utilisateurs existent
  IF advertiser_id IS NOT NULL THEN
    INSERT INTO credit_transactions (
      user_id,
      type,
      amount,
      description,
      payment_method,
      balance_before,
      balance_after
    ) VALUES 
    (advertiser_id, 'deposit', 5000.00, 'Rechargement initial - Virement bancaire', 'bank_transfer', 0.00, 5000.00),
    (advertiser_id, 'purchase', 1500.00, 'Achat de lien - Demande #1', NULL, 5000.00, 3500.00),
    (advertiser_id, 'deposit', 2000.00, 'Rechargement - PayPal', 'paypal', 3500.00, 5500.00)
    ON CONFLICT DO NOTHING;
    
    -- Mettre à jour le solde de l'advertiser
    UPDATE users SET balance = 5500.00 WHERE id = advertiser_id;
  END IF;
  
  IF publisher_id IS NOT NULL THEN
    INSERT INTO credit_transactions (
      user_id,
      type,
      amount,
      description,
      payment_method,
      balance_before,
      balance_after
    ) VALUES 
    (publisher_id, 'deposit', 3000.00, 'Rechargement initial - Virement bancaire', 'bank_transfer', 0.00, 3000.00),
    (publisher_id, 'deposit', 1350.00, 'Vente de lien - Demande #1', NULL, 3000.00, 4350.00),
    (publisher_id, 'withdrawal', 1000.00, 'Retrait de fonds', NULL, 4350.00, 3350.00)
    ON CONFLICT DO NOTHING;
    
    -- Mettre à jour le solde du publisher
    UPDATE users SET balance = 3350.00 WHERE id = publisher_id;
  END IF;
END $$; 