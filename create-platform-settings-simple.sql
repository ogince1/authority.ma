-- Script SQL simplifié pour créer la table platform_settings
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer la table si elle existe (pour un clean install)
DROP TABLE IF EXISTS platform_settings CASCADE;

-- 2. Créer la table platform_settings
CREATE TABLE platform_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) NOT NULL DEFAULT 'string',
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Désactiver RLS
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- 4. Insérer les paramètres par défaut
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, category) VALUES
-- Commissions
('commission_rate', '15', 'number', 'Taux de commission en pourcentage', 'commissions'),
('minimum_commission', '5', 'number', 'Commission minimum en MAD', 'commissions'),
('maximum_commission', '50', 'number', 'Commission maximum en MAD', 'commissions'),

-- Limites
('max_websites_per_user', '10', 'number', 'Nombre maximum de sites par utilisateur', 'limits'),
('max_listings_per_website', '50', 'number', 'Nombre maximum d''annonces par site', 'limits'),
('max_purchase_requests_per_day', '20', 'number', 'Nombre maximum de demandes d''achat par jour', 'limits'),
('minimum_balance_for_withdrawal', '100', 'number', 'Solde minimum pour retrait en MAD', 'limits'),

-- Paiements
('payment_methods', '["card", "bank_transfer", "paypal"]', 'array', 'Méthodes de paiement autorisées', 'payments'),
('auto_approve_payments', 'true', 'boolean', 'Approbation automatique des paiements', 'payments'),
('payment_processing_fee', '2.5', 'number', 'Frais de traitement des paiements en %', 'payments'),

-- Notifications
('email_notifications_enabled', 'true', 'boolean', 'Activer les notifications email', 'notifications'),
('push_notifications_enabled', 'true', 'boolean', 'Activer les notifications push', 'notifications'),
('admin_notification_email', 'admin@back.ma', 'string', 'Email de notification admin', 'notifications'),

-- Sécurité
('require_email_verification', 'true', 'boolean', 'Vérification email obligatoire', 'security'),
('require_phone_verification', 'false', 'boolean', 'Vérification téléphone obligatoire', 'security'),
('max_login_attempts', '5', 'number', 'Nombre maximum de tentatives de connexion', 'security'),
('session_timeout_minutes', '60', 'number', 'Durée de session en minutes', 'security'),

-- Contenu
('auto_approve_websites', 'true', 'boolean', 'Approbation automatique des sites', 'content'),
('auto_approve_listings', 'true', 'boolean', 'Approbation automatique des annonces', 'content'),
('require_admin_approval_for_disputes', 'true', 'boolean', 'Approbation admin pour les litiges', 'content'),

-- Maintenance
('maintenance_mode', 'false', 'boolean', 'Mode maintenance activé', 'maintenance'),
('maintenance_message', 'La plateforme est en maintenance. Veuillez réessayer plus tard.', 'string', 'Message de maintenance', 'maintenance');

-- 5. Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_settings_updated_at 
    BEFORE UPDATE ON platform_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Vérifier que tout fonctionne
SELECT 'Table créée avec succès' as status, COUNT(*) as paramètres_insérés 
FROM platform_settings;
