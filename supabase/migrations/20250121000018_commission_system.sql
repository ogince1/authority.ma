-- Migration pour implémenter un système de commission plateforme
-- Ce système permettra de prélever une commission sur chaque transaction

-- 1. Créer une table pour les configurations de commission
CREATE TABLE IF NOT EXISTS commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10, -- 10% par défaut
  minimum_commission DECIMAL(10,2) DEFAULT 0,
  maximum_commission DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insérer la configuration par défaut
INSERT INTO commission_config (commission_rate, minimum_commission, maximum_commission) 
VALUES (0.10, 0, 1000) 
ON CONFLICT DO NOTHING;

-- 3. Ajouter des colonnes pour les commissions dans credit_transactions
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.10;

-- 4. Créer une table pour l'historique des commissions
CREATE TABLE IF NOT EXISTS commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES credit_transactions(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  commission_type VARCHAR(50) DEFAULT 'platform_fee',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_commission_config_active ON commission_config(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_commission ON credit_transactions(commission_amount);
CREATE INDEX IF NOT EXISTS idx_commission_history_transaction ON commission_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_date ON commission_history(created_at);

-- 6. Fonction pour calculer la commission
CREATE OR REPLACE FUNCTION calculate_commission(gross_amount DECIMAL, transaction_type VARCHAR DEFAULT 'link_purchase')
RETURNS JSONB AS $$
DECLARE
  config_record RECORD;
  commission_amount DECIMAL(10,2);
  net_amount DECIMAL(10,2);
  result JSONB;
BEGIN
  -- Récupérer la configuration de commission active
  SELECT * INTO config_record 
  FROM commission_config 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Configuration par défaut si aucune n'est trouvée
    commission_amount := 0;
    net_amount := gross_amount;
  ELSE
    -- Calculer la commission
    commission_amount := gross_amount * config_record.commission_rate;
    
    -- Appliquer les limites
    IF config_record.minimum_commission > 0 AND commission_amount < config_record.minimum_commission THEN
      commission_amount := config_record.minimum_commission;
    END IF;
    
    IF config_record.maximum_commission > 0 AND commission_amount > config_record.maximum_commission THEN
      commission_amount := config_record.maximum_commission;
    END IF;
    
    net_amount := gross_amount - commission_amount;
  END IF;
  
  result := jsonb_build_object(
    'commission_amount', commission_amount,
    'net_amount', net_amount,
    'commission_rate', COALESCE(config_record.commission_rate, 0),
    'gross_amount', gross_amount
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour appliquer la commission à une transaction
CREATE OR REPLACE FUNCTION apply_commission_to_transaction(transaction_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  transaction_record RECORD;
  commission_calc JSONB;
  result JSONB;
BEGIN
  -- Récupérer la transaction
  SELECT * INTO transaction_record 
  FROM credit_transactions 
  WHERE id = transaction_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction non trouvée'
    );
  END IF;
  
  -- Calculer la commission (seulement pour les achats de liens)
  IF transaction_record.type = 'purchase' AND transaction_record.amount > 0 THEN
    commission_calc := calculate_commission(ABS(transaction_record.amount));
    
    -- Mettre à jour la transaction avec les informations de commission
    UPDATE credit_transactions 
    SET 
      commission_amount = (commission_calc->>'commission_amount')::DECIMAL,
      net_amount = (commission_calc->>'net_amount')::DECIMAL,
      commission_rate = (commission_calc->>'commission_rate')::DECIMAL,
      updated_at = NOW()
    WHERE id = transaction_uuid;
    
    -- Enregistrer dans l'historique des commissions
    INSERT INTO commission_history (
      transaction_id,
      commission_amount,
      commission_rate,
      gross_amount,
      net_amount,
      description
    ) VALUES (
      transaction_uuid,
      (commission_calc->>'commission_amount')::DECIMAL,
      (commission_calc->>'commission_rate')::DECIMAL,
      (commission_calc->>'gross_amount')::DECIMAL,
      (commission_calc->>'net_amount')::DECIMAL,
      'Commission plateforme sur achat de lien'
    );
    
    result := jsonb_build_object(
      'success', true,
      'commission_applied', true,
      'commission_amount', commission_calc->>'commission_amount',
      'net_amount', commission_calc->>'net_amount'
    );
  ELSE
    -- Pas de commission pour les autres types de transactions
    UPDATE credit_transactions 
    SET 
      commission_amount = 0,
      net_amount = transaction_record.amount,
      commission_rate = 0,
      updated_at = NOW()
    WHERE id = transaction_uuid;
    
    result := jsonb_build_object(
      'success', true,
      'commission_applied', false,
      'reason', 'Type de transaction non éligible à la commission'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger pour appliquer automatiquement la commission
CREATE OR REPLACE FUNCTION trigger_apply_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Appliquer la commission après l'insertion d'une transaction
  IF NEW.type = 'purchase' THEN
    PERFORM apply_commission_to_transaction(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer le trigger
DROP TRIGGER IF EXISTS trigger_apply_commission_on_transaction ON credit_transactions;
CREATE TRIGGER trigger_apply_commission_on_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_apply_commission();

-- 10. Fonction pour obtenir les statistiques de commission
CREATE OR REPLACE FUNCTION get_commission_stats(start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL, end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS TABLE(
  total_commission DECIMAL(10,2),
  total_transactions INTEGER,
  average_commission DECIMAL(10,2),
  commission_rate DECIMAL(5,4),
  total_gross_amount DECIMAL(10,2),
  total_net_amount DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ch.commission_amount), 0) as total_commission,
    COUNT(DISTINCT ch.transaction_id)::INTEGER as total_transactions,
    CASE 
      WHEN COUNT(DISTINCT ch.transaction_id) > 0 THEN 
        COALESCE(SUM(ch.commission_amount), 0) / COUNT(DISTINCT ch.transaction_id)
      ELSE 0 
    END as average_commission,
    CASE 
      WHEN SUM(ch.gross_amount) > 0 THEN 
        SUM(ch.commission_amount) / SUM(ch.gross_amount)
      ELSE 0 
    END as commission_rate,
    COALESCE(SUM(ch.gross_amount), 0) as total_gross_amount,
    COALESCE(SUM(ch.net_amount), 0) as total_net_amount
  FROM commission_history ch
  WHERE 
    (start_date IS NULL OR ch.created_at >= start_date)
    AND (end_date IS NULL OR ch.created_at <= end_date);
END;
$$ LANGUAGE plpgsql;

-- 11. Vue pour les rapports de commission
CREATE OR REPLACE VIEW commission_reports AS
SELECT 
  DATE_TRUNC('day', ch.created_at) as date,
  COUNT(DISTINCT ch.transaction_id) as transactions_count,
  SUM(ch.commission_amount) as daily_commission,
  SUM(ch.gross_amount) as daily_gross_amount,
  SUM(ch.net_amount) as daily_net_amount,
  AVG(ch.commission_rate) as avg_commission_rate
FROM commission_history ch
GROUP BY DATE_TRUNC('day', ch.created_at)
ORDER BY date DESC;

-- 12. Mettre à jour les transactions existantes avec les commissions
UPDATE credit_transactions 
SET 
  commission_amount = 0,
  net_amount = amount,
  commission_rate = 0
WHERE commission_amount IS NULL;

-- 13. Commentaires pour documenter le système
COMMENT ON TABLE commission_config IS 'Configuration des commissions de la plateforme';
COMMENT ON TABLE commission_history IS 'Historique des commissions prélevées';
COMMENT ON COLUMN credit_transactions.commission_amount IS 'Montant de la commission prélevée';
COMMENT ON COLUMN credit_transactions.net_amount IS 'Montant net après commission';
COMMENT ON COLUMN credit_transactions.commission_rate IS 'Taux de commission appliqué'; 