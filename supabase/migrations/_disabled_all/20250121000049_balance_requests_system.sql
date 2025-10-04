-- ===== SYSTÈME DE DEMANDES DE BALANCE POUR L'ADMIN =====

-- Table pour les demandes de balance (ajout/retrait)
CREATE TABLE IF NOT EXISTS balance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('add_funds', 'withdraw_funds')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- Informations de la demande
  description TEXT,
  bank_details JSONB, -- Pour les virements bancaires
  payment_reference TEXT, -- Référence du virement
  admin_notes TEXT, -- Notes de l'admin
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id), -- Admin qui a traité
  
  -- Index pour les requêtes fréquentes
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_type_method CHECK (
    (type = 'add_funds' AND payment_method IN ('bank_transfer', 'paypal', 'stripe', 'manual')) OR
    (type = 'withdraw_funds' AND payment_method IN ('bank_transfer', 'paypal', 'manual'))
  )
);

-- Index pour les performances
CREATE INDEX idx_balance_requests_user_id ON balance_requests(user_id);
CREATE INDEX idx_balance_requests_status ON balance_requests(status);
CREATE INDEX idx_balance_requests_type ON balance_requests(type);
CREATE INDEX idx_balance_requests_created_at ON balance_requests(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_balance_requests_updated_at
  BEFORE UPDATE ON balance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== FONCTIONS RPC POUR LA GESTION DES DEMANDES =====

-- Fonction pour créer une demande d'ajout de fonds (annonceurs - virement bancaire)
CREATE OR REPLACE FUNCTION create_add_funds_request(
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT DEFAULT NULL,
  p_bank_details JSONB DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  request_id UUID,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Utilisateur non authentifié'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier que c'est un annonceur pour les ajouts de fonds
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND role = 'advertiser') THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Seuls les annonceurs peuvent demander l''ajout de fonds'::TEXT;
    RETURN;
  END IF;
  
  -- Créer la demande
  INSERT INTO balance_requests (
    user_id,
    type,
    amount,
    payment_method,
    description,
    bank_details,
    payment_reference,
    status
  ) VALUES (
    v_user_id,
    'add_funds',
    p_amount,
    p_payment_method,
    p_description,
    p_bank_details,
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
    'Nouvelle demande d''ajout de fonds de ' || (SELECT name FROM users WHERE id = v_user_id) || ' (' || p_amount || ' MAD)',
    'info',
    'balance_request',
    FALSE
  FROM users u 
  WHERE u.role = 'admin';
  
  RETURN QUERY SELECT TRUE, v_request_id, 'Demande créée avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une demande de retrait (éditeurs)
CREATE OR REPLACE FUNCTION create_withdraw_request(
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT DEFAULT NULL,
  p_bank_details JSONB DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  request_id UUID,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_user_balance DECIMAL;
  v_request_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Utilisateur non authentifié'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier que c'est un éditeur
  SELECT balance INTO v_user_balance 
  FROM users 
  WHERE id = v_user_id AND role = 'publisher';
  
  IF v_user_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Seuls les éditeurs peuvent demander le retrait de fonds'::TEXT;
    RETURN;
  END IF;
  
  -- Vérifier que le solde est suffisant
  IF v_user_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Solde insuffisant pour ce retrait'::TEXT;
    RETURN;
  END IF;
  
  -- Créer la demande
  INSERT INTO balance_requests (
    user_id,
    type,
    amount,
    payment_method,
    description,
    bank_details,
    status
  ) VALUES (
    v_user_id,
    'withdraw_funds',
    p_amount,
    p_payment_method,
    p_description,
    p_bank_details,
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
    'Nouvelle demande de retrait de ' || (SELECT name FROM users WHERE id = v_user_id) || ' (' || p_amount || ' MAD)',
    'info',
    'balance_request',
    FALSE
  FROM users u 
  WHERE u.role = 'admin';
  
  RETURN QUERY SELECT TRUE, v_request_id, 'Demande de retrait créée avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour que l'admin récupère les demandes de balance
CREATE OR REPLACE FUNCTION get_balance_requests(
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  type TEXT,
  amount DECIMAL,
  payment_method TEXT,
  status TEXT,
  description TEXT,
  bank_details JSONB,
  payment_reference TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
) AS $$
BEGIN
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
    br.bank_details,
    br.payment_reference,
    br.admin_notes,
    br.created_at,
    br.updated_at,
    br.processed_at
  FROM balance_requests br
  JOIN users u ON u.id = br.user_id
  WHERE (p_status IS NULL OR br.status = p_status)
    AND (p_type IS NULL OR br.type = p_type)
  ORDER BY br.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour que l'admin approuve/rejette une demande
CREATE OR REPLACE FUNCTION process_balance_request(
  p_request_id UUID,
  p_action TEXT, -- 'approve' ou 'reject'
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_admin_id UUID;
  v_request RECORD;
  v_transaction_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est admin
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_admin_id AND role = 'admin') THEN
    RETURN QUERY SELECT FALSE, 'Seuls les administrateurs peuvent traiter les demandes'::TEXT;
    RETURN;
  END IF;
  
  -- Récupérer la demande
  SELECT * INTO v_request 
  FROM balance_requests 
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_request IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Demande non trouvée ou déjà traitée'::TEXT;
    RETURN;
  END IF;
  
  IF p_action = 'approve' THEN
    -- Approuver la demande
    UPDATE balance_requests 
    SET status = 'approved',
        admin_notes = p_admin_notes,
        processed_at = NOW(),
        processed_by = v_admin_id,
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Créer la transaction de crédit selon le type
    IF v_request.type = 'add_funds' THEN
      -- Ajouter des fonds
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
        'deposit',
        v_request.amount,
        'Ajout de fonds approuvé par admin - ' || COALESCE(v_request.description, 'Virement bancaire'),
        'MAD',
        'completed',
        v_request.payment_method,
        v_request.payment_reference,
        NOW(),
        NOW()
      ) RETURNING id INTO v_transaction_id;
      
    ELSIF v_request.type = 'withdraw_funds' THEN
      -- Retirer des fonds
      INSERT INTO credit_transactions (
        user_id,
        type,
        amount,
        description,
        currency,
        status,
        payment_method,
        created_at,
        completed_at
      ) VALUES (
        v_request.user_id,
        'withdrawal',
        v_request.amount,
        'Retrait approuvé par admin - ' || COALESCE(v_request.description, 'Retrait de revenus'),
        'MAD',
        'completed',
        v_request.payment_method,
        NOW(),
        NOW()
      ) RETURNING id INTO v_transaction_id;
    END IF;
    
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
        WHEN v_request.type = 'add_funds' THEN 'Demande d''ajout approuvée'
        ELSE 'Demande de retrait approuvée'
      END,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Votre demande d''ajout de fonds de ' || v_request.amount || ' MAD a été approuvée'
        ELSE 'Votre demande de retrait de ' || v_request.amount || ' MAD a été approuvée et traitée'
      END,
      'success',
      'balance_processed',
      FALSE
    );
    
    RETURN QUERY SELECT TRUE, 'Demande approuvée et traitée avec succès'::TEXT;
    
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
        WHEN v_request.type = 'add_funds' THEN 'Demande d''ajout rejetée'
        ELSE 'Demande de retrait rejetée'
      END,
      CASE 
        WHEN v_request.type = 'add_funds' THEN 'Votre demande d''ajout de fonds de ' || v_request.amount || ' MAD a été rejetée'
        ELSE 'Votre demande de retrait de ' || v_request.amount || ' MAD a été rejetée'
      END || CASE WHEN p_admin_notes IS NOT NULL THEN '. Raison: ' || p_admin_notes ELSE '' END,
      'error',
      'balance_rejected',
      FALSE
    );
    
    RETURN QUERY SELECT TRUE, 'Demande rejetée avec succès'::TEXT;
    
  ELSE
    RETURN QUERY SELECT FALSE, 'Action non valide. Utilisez "approve" ou "reject"'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les demandes d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_balance_requests()
RETURNS TABLE (
  id UUID,
  type TEXT,
  amount DECIMAL,
  payment_method TEXT,
  status TEXT,
  description TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Utiliser l'utilisateur actuel authentifié
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    br.id,
    br.type,
    br.amount,
    br.payment_method,
    br.status,
    br.description,
    br.admin_notes,
    br.created_at,
    br.processed_at
  FROM balance_requests br
  WHERE br.user_id = v_user_id
  ORDER BY br.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction avec paramètre pour l'admin
CREATE OR REPLACE FUNCTION get_user_balance_requests_by_id(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  amount DECIMAL,
  payment_method TEXT,
  status TEXT,
  description TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.id,
    br.type,
    br.amount,
    br.payment_method,
    br.status,
    br.description,
    br.admin_notes,
    br.created_at,
    br.processed_at
  FROM balance_requests br
  WHERE br.user_id = p_user_id
  ORDER BY br.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== POLITIQUES RLS =====

-- Activer RLS
ALTER TABLE balance_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient seulement leurs demandes
CREATE POLICY "users_own_balance_requests" ON balance_requests
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Politique pour que les admins voient toutes les demandes
CREATE POLICY "admins_all_balance_requests" ON balance_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===== PERMISSIONS =====

-- Donner les permissions aux utilisateurs authentifiés
GRANT SELECT, INSERT ON balance_requests TO authenticated;
GRANT UPDATE ON balance_requests TO authenticated; -- Pour les admins

-- Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION create_add_funds_request(DECIMAL, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_withdraw_request(DECIMAL, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_balance_requests(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_balance_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_balance_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_balance_requests_by_id(UUID) TO authenticated;

-- ===== DONNÉES DE TEST (OPTIONNEL) =====

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ SYSTÈME DE DEMANDES DE BALANCE CRÉÉ AVEC SUCCÈS !';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  - balance_requests (demandes d''ajout/retrait)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions disponibles:';
  RAISE NOTICE '  - create_add_funds_request() : Créer demande d''ajout (annonceurs)';
  RAISE NOTICE '  - create_withdraw_request() : Créer demande de retrait (éditeurs)';
  RAISE NOTICE '  - get_balance_requests() : Récupérer demandes (admin)';
  RAISE NOTICE '  - process_balance_request() : Approuver/rejeter (admin)';
  RAISE NOTICE '  - get_user_balance_requests() : Demandes de l''utilisateur';
  RAISE NOTICE '';
  RAISE NOTICE 'Workflow:';
  RAISE NOTICE '  1. Annonceur (virement) → create_add_funds_request()';
  RAISE NOTICE '  2. Éditeur (retrait) → create_withdraw_request()';
  RAISE NOTICE '  3. Admin → get_balance_requests() → process_balance_request()';
  RAISE NOTICE '  4. Notification automatique à l''utilisateur';
END;
$$;
