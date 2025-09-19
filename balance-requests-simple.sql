-- ===== SYSTÈME SIMPLE DE DEMANDES DE BALANCE =====

-- 1. Table pour les demandes de balance
CREATE TABLE IF NOT EXISTS balance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('add_funds', 'withdraw_funds')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  description TEXT,
  payment_reference TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_balance_requests_user_id ON balance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_requests_status ON balance_requests(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_balance_requests_updated_at ON balance_requests;

CREATE TRIGGER update_balance_requests_updated_at
  BEFORE UPDATE ON balance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Fonction pour créer une demande d'ajout de fonds
CREATE OR REPLACE FUNCTION create_add_funds_request(
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
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non authentifié');
  END IF;
  
  -- Récupérer le nom de l'utilisateur
  SELECT name INTO v_user_name FROM users WHERE id = v_user_id;
  
  -- Créer la demande
  INSERT INTO balance_requests (
    user_id,
    type,
    amount,
    payment_method,
    description,
    payment_reference,
    status
  ) VALUES (
    v_user_id,
    'add_funds',
    p_amount,
    p_payment_method,
    p_description,
    p_payment_reference,
    'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Créer une notification pour l'admin
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_type,
    read
  ) 
  SELECT 
    u.id,
    'Nouvelle demande d''ajout de fonds',
    'Demande d''ajout de fonds de ' || COALESCE(v_user_name, 'Utilisateur') || ' (' || p_amount || ' MAD)',
    'info',
    'payment',
    FALSE
  FROM users u 
  WHERE u.role = 'admin';
  
  RETURN json_build_object('success', true, 'request_id', v_request_id, 'message', 'Demande créée avec succès');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour créer une demande de retrait
CREATE OR REPLACE FUNCTION create_withdraw_request(
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_balance DECIMAL;
  v_user_name TEXT;
  v_request_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non authentifié');
  END IF;
  
  -- Récupérer les infos de l'utilisateur
  SELECT balance, name INTO v_user_balance, v_user_name 
  FROM users 
  WHERE id = v_user_id;
  
  IF v_user_balance IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non trouvé');
  END IF;
  
  -- Vérifier que le solde est suffisant
  IF v_user_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Solde insuffisant pour ce retrait');
  END IF;
  
  -- Créer la demande
  INSERT INTO balance_requests (
    user_id,
    type,
    amount,
    payment_method,
    description,
    status
  ) VALUES (
    v_user_id,
    'withdraw_funds',
    p_amount,
    p_payment_method,
    p_description,
    'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Créer une notification pour l'admin
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_type,
    read
  ) 
  SELECT 
    u.id,
    'Nouvelle demande de retrait',
    'Demande de retrait de ' || COALESCE(v_user_name, 'Utilisateur') || ' (' || p_amount || ' MAD)',
    'info',
    'payment',
    FALSE
  FROM users u 
  WHERE u.role = 'admin';
  
  RETURN json_build_object('success', true, 'request_id', v_request_id, 'message', 'Demande de retrait créée avec succès');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour l'admin pour récupérer les demandes
CREATE OR REPLACE FUNCTION get_balance_requests()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  type TEXT,
  amount DECIMAL,
  payment_method TEXT,
  status TEXT,
  description TEXT,
  payment_reference TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    br.id,
    br.user_id,
    u.name,
    u.email,
    br.type,
    br.amount,
    br.payment_method,
    br.status,
    br.description,
    br.payment_reference,
    br.admin_notes,
    br.created_at,
    br.updated_at,
    br.processed_at
  FROM balance_requests br
  JOIN users u ON u.id = br.user_id
  ORDER BY br.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour traiter une demande
CREATE OR REPLACE FUNCTION process_balance_request(
  p_request_id UUID,
  p_action TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_request RECORD;
  v_transaction_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est admin
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_admin_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Seuls les administrateurs peuvent traiter les demandes');
  END IF;
  
  -- Récupérer la demande
  SELECT * INTO v_request 
  FROM balance_requests 
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Demande non trouvée ou déjà traitée');
  END IF;
  
  IF p_action = 'approve' THEN
    -- Approuver et créer la transaction
    UPDATE balance_requests 
    SET status = 'approved',
        admin_notes = p_admin_notes,
        processed_at = NOW(),
        processed_by = v_admin_id,
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Créer la transaction de crédit
    INSERT INTO credit_transactions (
      user_id,
      type,
      amount,
      description,
      currency,
      status,
      payment_method,
      payment_reference,
      created_at,
      completed_at
    ) VALUES (
      v_request.user_id,
      CASE WHEN v_request.type = 'add_funds' THEN 'deposit' ELSE 'withdrawal' END,
      v_request.amount,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Ajout de fonds approuvé par admin'
        ELSE 'Retrait approuvé par admin'
      END,
      'MAD',
      'completed',
      v_request.payment_method,
      v_request.payment_reference,
      NOW(),
      NOW()
    ) RETURNING id INTO v_transaction_id;
    
    -- Marquer comme complété
    UPDATE balance_requests 
    SET status = 'completed'
    WHERE id = p_request_id;
    
    -- Notifier l'utilisateur
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_type,
      read
    ) VALUES (
      v_request.user_id,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Demande approuvée'
        ELSE 'Retrait effectué'
      END,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Votre demande d''ajout de ' || v_request.amount || ' MAD a été approuvée'
        ELSE 'Votre retrait de ' || v_request.amount || ' MAD a été effectué'
      END,
      'success',
      'payment',
      FALSE
    );
    
    RETURN json_build_object('success', true, 'message', 'Demande approuvée et traitée avec succès');
    
  ELSIF p_action = 'reject' THEN
    -- Rejeter la demande
    UPDATE balance_requests 
    SET status = 'rejected',
        admin_notes = p_admin_notes,
        processed_at = NOW(),
        processed_by = v_admin_id,
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Notifier l'utilisateur
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_type,
      read
    ) VALUES (
      v_request.user_id,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Demande rejetée'
        ELSE 'Retrait refusé'
      END,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Votre demande d''ajout de ' || v_request.amount || ' MAD a été rejetée'
        ELSE 'Votre demande de retrait de ' || v_request.amount || ' MAD a été refusée'
      END || CASE WHEN p_admin_notes IS NOT NULL THEN '. Raison: ' || p_admin_notes ELSE '' END,
      'error',
      'payment',
      FALSE
    );
    
    RETURN json_build_object('success', true, 'message', 'Demande rejetée');
    
  ELSE
    RETURN json_build_object('success', false, 'message', 'Action non valide');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS
ALTER TABLE balance_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "users_own_balance_requests" ON balance_requests;
DROP POLICY IF EXISTS "admins_all_balance_requests" ON balance_requests;

-- Politique pour que les utilisateurs voient leurs demandes
CREATE POLICY "users_own_balance_requests" ON balance_requests
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Politique pour les admins
CREATE POLICY "admins_all_balance_requests" ON balance_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Permissions
GRANT SELECT, INSERT ON balance_requests TO authenticated;
GRANT UPDATE ON balance_requests TO authenticated;

GRANT EXECUTE ON FUNCTION create_add_funds_request(DECIMAL, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_withdraw_request(DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_balance_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION process_balance_request(UUID, TEXT, TEXT) TO authenticated;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '✅ SYSTÈME DE DEMANDES DE BALANCE CRÉÉ !';
  RAISE NOTICE 'Fonctions disponibles:';
  RAISE NOTICE '- create_add_funds_request()';
  RAISE NOTICE '- create_withdraw_request()';
  RAISE NOTICE '- get_balance_requests()';
  RAISE NOTICE '- process_balance_request()';
END;
$$;
