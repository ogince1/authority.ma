-- Migration pour corriger le trigger problématique
-- Date: 2025-01-21

-- Supprimer le trigger et la fonction problématiques
DROP TRIGGER IF EXISTS trigger_update_campaign_spent ON link_purchase_requests;
DROP FUNCTION IF EXISTS update_campaign_spent_amount(); 