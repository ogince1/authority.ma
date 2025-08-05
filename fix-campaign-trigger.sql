-- Script pour supprimer le trigger problématique
DROP TRIGGER IF EXISTS trigger_update_campaign_spent ON link_purchase_requests;
DROP FUNCTION IF EXISTS update_campaign_spent_amount(); 