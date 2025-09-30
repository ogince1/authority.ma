-- ===== NETTOYAGE COMPLET DU SYSTÈME DE BALANCE =====

-- 0. Mettre à jour la contrainte payment_method pour autoriser 'platform'
ALTER TABLE credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_payment_method_check;

ALTER TABLE credit_transactions 
ADD CONSTRAINT credit_transactions_payment_method_check 
CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'manual', 'platform'));

-- 1. Supprimer toutes les fonctions liées aux demandes de balance
DROP FUNCTION IF EXISTS create_add_funds_request(DECIMAL, TEXT, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_add_funds_request(DECIMAL, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_withdraw_request(DECIMAL, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_withdraw_request(DECIMAL, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_balance_requests(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_balance_requests() CASCADE;
DROP FUNCTION IF EXISTS process_balance_request(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_balance_requests() CASCADE;
DROP FUNCTION IF EXISTS get_user_balance_requests_by_id(UUID) CASCADE;

-- 2. Supprimer la table si elle existe
DROP TABLE IF EXISTS balance_requests CASCADE;

-- 3. Recréer la table proprement
CREATE TABLE balance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL, -- Email pour identifier le client
  user_name TEXT NOT NULL, -- Nom pour identifier le client
  type TEXT NOT NULL CHECK (type IN ('add_funds', 'withdraw_funds')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  description TEXT,
  payment_reference TEXT,
  publisher_payment_info JSONB, -- Informations de paiement préférées de l'éditeur
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id)
);

-- Index
CREATE INDEX idx_balance_requests_user_id ON balance_requests(user_id);
CREATE INDEX idx_balance_requests_status ON balance_requests(status);

-- 4. Créer les fonctions avec des noms uniques
CREATE OR REPLACE FUNCTION request_add_funds(
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Non authentifié');
  END IF;
  
  -- Récupérer les infos de l'utilisateur
  SELECT name, email INTO v_user_name, v_user_email FROM users WHERE id = v_user_id;
  
  INSERT INTO balance_requests (
    user_id, user_email, user_name, type, amount, payment_method, description, payment_reference, status
  ) VALUES (
    v_user_id, v_user_email, v_user_name, 'add_funds', p_amount, p_payment_method, p_description, p_payment_reference, 'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Notifier l'admin
  INSERT INTO notifications (user_id, title, message, type, action_type, read) 
  SELECT u.id, 'Demande d''ajout de fonds', 
    'Nouvelle demande de ' || COALESCE(v_user_name, 'Utilisateur') || ' (' || p_amount || ' MAD)',
    'info', 'payment', FALSE
  FROM users u WHERE u.role = 'admin';
  
  RETURN json_build_object('success', true, 'request_id', v_request_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_withdraw_funds(
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_balance DECIMAL;
  v_user_name TEXT;
  v_user_email TEXT;
  v_payment_info JSONB;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Non authentifié');
  END IF;
  
  -- Récupérer les infos de l'utilisateur et ses informations de paiement
  SELECT balance, name, email, 
         json_build_object(
           'bank_account_info', bank_account_info,
           'paypal_email', paypal_email,
           'preferred_withdrawal_method', preferred_withdrawal_method
         )
  INTO v_user_balance, v_user_name, v_user_email, v_payment_info
  FROM users 
  WHERE id = v_user_id;
  
  IF v_user_balance IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non trouvé');
  END IF;
  
  IF v_user_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Solde insuffisant');
  END IF;
  
  INSERT INTO balance_requests (
    user_id, user_email, user_name, type, amount, payment_method, description, publisher_payment_info, status
  ) VALUES (
    v_user_id, v_user_email, v_user_name, 'withdraw_funds', p_amount, p_payment_method, p_description, v_payment_info, 'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Notifier l'admin
  INSERT INTO notifications (user_id, title, message, type, action_type, read) 
  SELECT u.id, 'Demande de retrait', 
    'Nouvelle demande de retrait de ' || COALESCE(v_user_name, 'Utilisateur') || ' (' || p_amount || ' MAD)',
    'info', 'payment', FALSE
  FROM users u WHERE u.role = 'admin';
  
  RETURN json_build_object('success', true, 'request_id', v_request_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_balance_requests()
RETURNS SETOF balance_requests AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT * FROM balance_requests ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_process_balance_request(
  p_request_id UUID,
  p_action TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_admin_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Accès refusé');
  END IF;
  
  SELECT * INTO v_request FROM balance_requests WHERE id = p_request_id AND status = 'pending';
  
  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Demande non trouvée');
  END IF;
  
  IF p_action = 'approve' THEN
    -- Approuver et créer la transaction
    UPDATE balance_requests SET status = 'approved', admin_notes = p_admin_notes, 
           processed_at = NOW(), processed_by = v_admin_id WHERE id = p_request_id;
    
    IF v_request.type = 'add_funds' THEN
      -- Pour les ajouts de fonds : montant complet
      INSERT INTO credit_transactions (user_id, type, amount, description, currency, status, payment_method) 
      VALUES (v_request.user_id, 'deposit', v_request.amount, 
              'Ajout de fonds approuvé par admin', 'MAD', 'completed', v_request.payment_method);
      
      -- Notifier l'utilisateur
      INSERT INTO notifications (user_id, title, message, type, action_type, read) 
      VALUES (v_request.user_id, 'Demande approuvée', 
              'Ajout de ' || v_request.amount || ' MAD approuvé et crédité',
              'success', 'payment', FALSE);
              
    ELSIF v_request.type = 'withdraw_funds' THEN
      -- Pour les retraits : appliquer commission de 20%
      DECLARE
        v_commission DECIMAL := v_request.amount * 0.20;
        v_net_amount DECIMAL := v_request.amount - v_commission;
      BEGIN
        -- Transaction de retrait (montant demandé)
        INSERT INTO credit_transactions (user_id, type, amount, description, currency, status, payment_method) 
        VALUES (v_request.user_id, 'withdrawal', v_request.amount, 
                'Retrait demandé (' || v_request.amount || ' MAD)', 'MAD', 'completed', v_request.payment_method);
        
        -- Transaction de commission (20% de frais de plateforme)
        INSERT INTO credit_transactions (user_id, type, amount, description, currency, status, payment_method) 
        VALUES (v_request.user_id, 'commission', v_commission, 
                'Frais de plateforme (20%) sur retrait de ' || v_request.amount || ' MAD', 'MAD', 'completed', 'platform');
        
        -- Notifier l'utilisateur avec détails de la commission
        INSERT INTO notifications (user_id, title, message, type, action_type, read) 
        VALUES (v_request.user_id, 'Retrait effectué', 
                'Retrait de ' || v_request.amount || ' MAD effectué. Montant net après frais de plateforme (20%): ' || v_net_amount || ' MAD',
                'success', 'payment', FALSE);
      END;
    END IF;
    
    UPDATE balance_requests SET status = 'completed' WHERE id = p_request_id;
    
    RETURN json_build_object('success', true, 'message', 'Approuvé');
    
  ELSIF p_action = 'reject' THEN
    UPDATE balance_requests SET status = 'rejected', admin_notes = p_admin_notes, 
           processed_at = NOW(), processed_by = v_admin_id WHERE id = p_request_id;
    
    INSERT INTO notifications (user_id, title, message, type, action_type, read) 
    VALUES (v_request.user_id, 'Demande rejetée', 
            'Votre demande de ' || v_request.amount || ' MAD a été rejetée' ||
            CASE WHEN p_admin_notes IS NOT NULL THEN '. Raison: ' || p_admin_notes ELSE '' END,
            'error', 'payment', FALSE);
    
    RETURN json_build_object('success', true, 'message', 'Rejeté');
  ELSE
    RETURN json_build_object('success', false, 'message', 'Action invalide');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS
ALTER TABLE balance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_balance_requests" ON balance_requests;
DROP POLICY IF EXISTS "admins_balance_requests" ON balance_requests;

CREATE POLICY "users_balance_requests" ON balance_requests
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 6. Permissions
GRANT ALL ON balance_requests TO authenticated;
GRANT EXECUTE ON FUNCTION request_add_funds(DECIMAL, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdraw_funds(DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_balance_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_process_balance_request(UUID, TEXT, TEXT) TO authenticated;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '✅ SYSTÈME DE BALANCE NETTOYÉ ET RECRÉÉ !';
  RAISE NOTICE 'Nouvelles fonctions:';
  RAISE NOTICE '- request_add_funds()';
  RAISE NOTICE '- request_withdraw_funds()';
  RAISE NOTICE '- admin_get_balance_requests()';
  RAISE NOTICE '- admin_process_balance_request()';
END;
$$;
