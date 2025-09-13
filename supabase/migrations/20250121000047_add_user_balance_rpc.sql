-- Add RPC function to update user balance
-- Date: 2025-01-21

-- Fonction RPC pour ajouter du crédit à un utilisateur
CREATE OR REPLACE FUNCTION add_user_balance(
  user_id UUID,
  amount DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Ajouter le montant au solde
  UPDATE users 
  SET balance = balance + amount 
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction RPC pour soustraire du crédit à un utilisateur
CREATE OR REPLACE FUNCTION subtract_user_balance(
  user_id UUID,
  amount DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Vérifier que le solde est suffisant
  IF (SELECT balance FROM users WHERE id = user_id) < amount THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;
  
  -- Soustraire le montant du solde
  UPDATE users 
  SET balance = balance - amount 
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
