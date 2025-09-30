-- Migration pour corriger la contrainte sur les montants
-- Date: 2025-01-21

-- Supprimer l'ancienne contrainte
ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_amount_check;

-- Ajouter la nouvelle contrainte qui permet les montants négatifs
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_amount_check 
  CHECK (amount != 0);

-- Mettre à jour la fonction check_balance_before_transaction pour gérer les montants négatifs
CREATE OR REPLACE FUNCTION check_balance_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  -- Calculer le nouveau solde
  IF NEW.type IN ('deposit', 'refund') THEN
    NEW.balance_after := current_balance + ABS(NEW.amount);
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    NEW.balance_after := current_balance - ABS(NEW.amount);
    
    -- Vérifier que le solde ne devient pas négatif
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant pour cette transaction';
    END IF;
  END IF;
  
  NEW.balance_before := current_balance;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour la fonction update_user_balance_after_transaction
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le solde de l'utilisateur
  UPDATE users 
  SET balance = NEW.balance_after 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 