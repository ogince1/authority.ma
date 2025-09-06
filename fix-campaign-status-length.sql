-- Migration pour corriger la longueur de la colonne status dans campaigns
-- Date: 2025-01-21
-- Problème: status VARCHAR(20) mais 'pending_editor_approval' fait 23 caractères

-- 1. Modifier la contrainte de longueur de status dans campaigns
ALTER TABLE campaigns 
ALTER COLUMN status TYPE VARCHAR(50);

-- 2. Mettre à jour la contrainte CHECK pour inclure tous les statuts
ALTER TABLE campaigns 
DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('draft', 'active', 'closed', 'pending_editor_approval', 'approved', 'rejected', 'completed'));

-- 3. Vérifier que la modification fonctionne
DO $$
BEGIN
  -- Tester la mise à jour avec le nouveau statut
  RAISE NOTICE 'Migration réussie: status peut maintenant accepter pending_editor_approval';
END $$;
