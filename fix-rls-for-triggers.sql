-- ===== CORRECTION DES POLITIQUES RLS POUR LES TRIGGERS =====
-- À exécuter dans l'interface SQL de Supabase Cloud

-- 1. Vérifier les politiques RLS actuelles sur la table users
DO $$
BEGIN
  RAISE NOTICE '🔍 VÉRIFICATION DES POLITIQUES RLS ACTUELLES...';
END;
$$;

-- Voir les politiques actuelles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Créer une politique spéciale pour permettre aux triggers de mettre à jour les soldes
-- Cette politique permet aux fonctions de trigger de mettre à jour les soldes

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "allow_trigger_balance_update" ON users;

-- Créer une nouvelle politique pour les triggers
CREATE POLICY "allow_trigger_balance_update" ON users
  FOR UPDATE
  TO public
  USING (true)  -- Permet la lecture pour tous
  WITH CHECK (
    -- Permet la mise à jour seulement si :
    -- 1. C'est l'utilisateur lui-même (normal)
    -- 2. OU c'est un trigger qui met à jour le balance (détecté par le contexte)
    auth.uid() = id 
    OR 
    current_setting('application_name', true) LIKE '%trigger%'
    OR
    -- Permettre aux triggers de fonctionner en vérifiant si c'est un UPDATE du balance seulement
    (
      OLD.balance IS DISTINCT FROM NEW.balance 
      AND OLD.email = NEW.email 
      AND OLD.role = NEW.role
      AND OLD.name = NEW.name
    )
  );

-- 3. Alternative : Créer une politique spécifique pour les mises à jour de balance
DROP POLICY IF EXISTS "allow_balance_updates_from_triggers" ON users;

CREATE POLICY "allow_balance_updates_from_triggers" ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (
    -- Permettre si c'est l'utilisateur lui-même
    auth.uid() = id
    OR
    -- Permettre si seuls les champs balance et updated_at changent (trigger)
    (
      OLD.email = NEW.email 
      AND OLD.role = NEW.role 
      AND OLD.name = NEW.name
      AND OLD.phone IS NOT DISTINCT FROM NEW.phone
      AND OLD.website IS NOT DISTINCT FROM NEW.website
      AND OLD.bio IS NOT DISTINCT FROM NEW.bio
      AND OLD.company_name IS NOT DISTINCT FROM NEW.company_name
      AND OLD.company_size IS NOT DISTINCT FROM NEW.company_size
      AND OLD.location IS NOT DISTINCT FROM NEW.location
      AND OLD.credit_limit IS NOT DISTINCT FROM NEW.credit_limit
      AND OLD.advertiser_info IS NOT DISTINCT FROM NEW.advertiser_info
      AND OLD.publisher_info IS NOT DISTINCT FROM NEW.publisher_info
      AND OLD.created_at = NEW.created_at
      -- Seuls balance et updated_at peuvent changer
    )
  );

-- 4. Solution plus simple : Modifier la fonction trigger pour utiliser SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log pour debug
  RAISE NOTICE '[TRIGGER AFTER] Mise à jour du solde pour User: %, Balance: % -> %', 
    NEW.user_id, NEW.balance_before, NEW.balance_after;
  
  -- Mettre à jour le solde de l'utilisateur dans la table users
  -- Utiliser SECURITY DEFINER pour contourner RLS
  UPDATE users 
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Vérifier que la mise à jour a bien eu lieu
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impossible de mettre à jour le solde pour l''utilisateur % - utilisateur non trouvé', NEW.user_id;
  END IF;
  
  RAISE NOTICE '[TRIGGER AFTER] Solde mis à jour avec succès pour User: %, Nouveau solde: %', 
    NEW.user_id, NEW.balance_after;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER permet de contourner RLS

-- 5. Recréer le trigger avec la fonction SECURITY DEFINER
DROP TRIGGER IF EXISTS trigger_update_user_balance_after_transaction ON credit_transactions;

CREATE TRIGGER trigger_update_user_balance_after_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_transaction();

-- 6. Aussi mettre SECURITY DEFINER sur la fonction BEFORE pour être sûr
CREATE OR REPLACE FUNCTION check_balance_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Log pour debug
  RAISE NOTICE '[TRIGGER BEFORE] User: %, Type: %, Amount: %', NEW.user_id, NEW.type, NEW.amount;
  
  -- Récupérer le solde actuel de l'utilisateur
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  -- Vérifier que l'utilisateur existe
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec ID % non trouvé dans la table users', NEW.user_id;
  END IF;
  
  -- Enregistrer le solde avant transaction
  NEW.balance_before := current_balance;
  
  -- Calculer le nouveau solde selon le type de transaction
  IF NEW.type IN ('deposit', 'refund') THEN
    -- Pour les crédits (dépôts, remboursements)
    NEW.balance_after := current_balance + NEW.amount;
    RAISE NOTICE '[TRIGGER BEFORE] Crédit: % + % = %', current_balance, NEW.amount, NEW.balance_after;
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    -- Pour les débits (retraits, achats, commissions)
    NEW.balance_after := current_balance - NEW.amount;
    RAISE NOTICE '[TRIGGER BEFORE] Débit: % - % = %', current_balance, NEW.amount, NEW.balance_after;
    
    -- Vérifier que le solde ne devient pas négatif
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant pour cette transaction. Solde actuel: %, Montant: %', current_balance, NEW.amount;
    END IF;
  ELSE
    -- Type de transaction non reconnu
    RAISE EXCEPTION 'Type de transaction non valide: %', NEW.type;
  END IF;
  
  RAISE NOTICE '[TRIGGER BEFORE] Calculs terminés: % -> %', NEW.balance_before, NEW.balance_after;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER pour contourner RLS

-- Recréer le trigger BEFORE aussi
DROP TRIGGER IF EXISTS trigger_check_balance_before_transaction ON credit_transactions;

CREATE TRIGGER trigger_check_balance_before_transaction
  BEFORE INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_before_transaction();

-- 7. Fonction de test simple
CREATE OR REPLACE FUNCTION test_anon_triggers(
  p_user_email TEXT,
  p_amount DECIMAL
)
RETURNS TABLE (
  success BOOLEAN,
  old_balance DECIMAL,
  new_balance DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_old_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Récupérer l'utilisateur
  SELECT id, balance INTO v_user_id, v_old_balance 
  FROM users WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, 'Utilisateur non trouvé'::TEXT;
    RETURN;
  END IF;
  
  -- Insérer la transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status,
    created_at,
    completed_at
  ) VALUES (
    v_user_id,
    'deposit',
    p_amount,
    'Test triggers avec anon',
    'MAD',
    'completed',
    NOW(),
    NOW()
  );
  
  -- Récupérer le nouveau solde
  SELECT balance INTO v_new_balance FROM users WHERE id = v_user_id;
  
  RETURN QUERY SELECT TRUE, v_old_balance, v_new_balance, 'Test réussi'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, v_old_balance, v_old_balance, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION test_anon_triggers(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION test_anon_triggers(TEXT, DECIMAL) TO anon;

-- 8. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===== CORRECTION RLS POUR TRIGGERS TERMINÉE =====';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Modifications appliquées:';
  RAISE NOTICE '   - Fonctions trigger avec SECURITY DEFINER';
  RAISE NOTICE '   - Politiques RLS ajustées pour les triggers';
  RAISE NOTICE '   - Fonction de test avec permissions anon';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Pour tester avec clé anon:';
  RAISE NOTICE '   SELECT * FROM test_anon_triggers(''ogincema@gmail.com'', 1.0);';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Les triggers devraient maintenant fonctionner avec le frontend !';
END;
$$;
