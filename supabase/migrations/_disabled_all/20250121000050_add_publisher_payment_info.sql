-- ===== AJOUT DES INFORMATIONS DE PAIEMENT POUR LES ÉDITEURS =====

-- Ajouter des champs spécifiques pour les informations bancaires et PayPal des éditeurs
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_account_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS paypal_email TEXT,
ADD COLUMN IF NOT EXISTS preferred_withdrawal_method TEXT DEFAULT 'bank_transfer' CHECK (preferred_withdrawal_method IN ('bank_transfer', 'paypal'));

-- Commentaires pour clarifier l'usage
COMMENT ON COLUMN users.bank_account_info IS 'Informations bancaires de l''éditeur (IBAN, RIB, nom de banque, etc.)';
COMMENT ON COLUMN users.paypal_email IS 'Email PayPal de l''éditeur pour les retraits';
COMMENT ON COLUMN users.preferred_withdrawal_method IS 'Méthode de retrait préférée de l''éditeur';

-- Fonction pour mettre à jour les informations de paiement de l'éditeur
CREATE OR REPLACE FUNCTION update_publisher_payment_info(
  p_bank_account_info JSONB DEFAULT NULL,
  p_paypal_email TEXT DEFAULT NULL,
  p_preferred_method TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non authentifié');
  END IF;
  
  -- Vérifier que c'est un éditeur
  SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
  
  IF v_user_role != 'publisher' THEN
    RETURN json_build_object('success', false, 'message', 'Seuls les éditeurs peuvent modifier ces informations');
  END IF;
  
  -- Mettre à jour les informations
  UPDATE users 
  SET 
    bank_account_info = COALESCE(p_bank_account_info, bank_account_info),
    paypal_email = COALESCE(p_paypal_email, paypal_email),
    preferred_withdrawal_method = COALESCE(p_preferred_method, preferred_withdrawal_method),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Informations de paiement mises à jour avec succès');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les informations de paiement de l'éditeur
CREATE OR REPLACE FUNCTION get_publisher_payment_info()
RETURNS TABLE (
  bank_account_info JSONB,
  paypal_email TEXT,
  preferred_withdrawal_method TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    u.bank_account_info,
    u.paypal_email,
    u.preferred_withdrawal_method
  FROM users u
  WHERE u.id = v_user_id AND u.role = 'publisher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION update_publisher_payment_info(JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_publisher_payment_info() TO authenticated;

-- Mettre à jour la politique RLS pour permettre aux éditeurs de modifier leurs infos de paiement
DROP POLICY IF EXISTS "users_update_own_payment_info" ON users;

CREATE POLICY "users_update_own_payment_info" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ INFORMATIONS DE PAIEMENT ÉDITEUR AJOUTÉES !';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles colonnes:';
  RAISE NOTICE '  - bank_account_info (JSONB) : Infos bancaires';
  RAISE NOTICE '  - paypal_email (TEXT) : Email PayPal';
  RAISE NOTICE '  - preferred_withdrawal_method (TEXT) : Méthode préférée';
  RAISE NOTICE '';
  RAISE NOTICE 'Nouvelles fonctions:';
  RAISE NOTICE '  - update_publisher_payment_info() : Mettre à jour les infos';
  RAISE NOTICE '  - get_publisher_payment_info() : Récupérer les infos';
  RAISE NOTICE '';
  RAISE NOTICE 'Les éditeurs peuvent maintenant enregistrer leurs infos de paiement !';
END;
$$;
