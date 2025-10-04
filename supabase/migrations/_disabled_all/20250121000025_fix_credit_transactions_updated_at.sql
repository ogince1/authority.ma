-- Migration pour ajouter la colonne updated_at manquante
-- Date: 2025-01-21

-- Ajouter la colonne updated_at à la table credit_transactions
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mettre à jour la fonction du trigger pour utiliser la bonne colonne
CREATE OR REPLACE FUNCTION update_credit_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger pour s'assurer qu'il fonctionne
DROP TRIGGER IF EXISTS trigger_update_credit_transactions_updated_at ON credit_transactions;
CREATE TRIGGER trigger_update_credit_transactions_updated_at
  BEFORE UPDATE ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_transactions_updated_at(); 