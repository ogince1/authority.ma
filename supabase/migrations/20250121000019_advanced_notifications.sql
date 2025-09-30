-- Migration pour un système de notifications avancé
-- Emails automatiques, notifications push, et gestion des préférences

-- 1. Ajouter des colonnes pour les notifications avancées
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS action_data JSONB DEFAULT '{}';

-- 2. Créer une table pour les préférences de notification des utilisateurs
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Préférences générales
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Types de notifications
  campaign_updates BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  link_validation BOOLEAN DEFAULT true,
  commission_updates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  
  -- Fréquence
  frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  
  -- Heures de réception (pour les notifications différées)
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 3. Créer une table pour l'historique des emails
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Détails de l'email
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  
  -- Statut de l'envoi
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer une table pour les templates d'emails
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Variables disponibles dans le template
  variables JSONB DEFAULT '[]',
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insérer des templates d'emails par défaut
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
(
  'campaign_activated',
  'Votre campagne {{campaign_name}} est maintenant active !',
  '<h2>🎉 Votre campagne est active !</h2>
   <p>Bonjour {{user_name}},</p>
   <p>Votre campagne <strong>{{campaign_name}}</strong> a été activée avec succès.</p>
   <p><strong>Détails :</strong></p>
   <ul>
     <li>Budget : {{budget}} MAD</li>
     <li>Demandes créées : {{requests_count}}</li>
     <li>Statut : {{status}}</li>
   </ul>
   <p><a href="{{dashboard_url}}">Voir les détails</a></p>',
  'Votre campagne {{campaign_name}} est maintenant active ! Budget: {{budget}} MAD, Demandes: {{requests_count}}',
  '["campaign_name", "user_name", "budget", "requests_count", "status", "dashboard_url"]'
),
(
  'link_accepted',
  'Votre demande de lien a été acceptée !',
  '<h2>✅ Demande acceptée !</h2>
   <p>Bonjour {{user_name}},</p>
   <p>Votre demande de lien pour <strong>{{link_title}}</strong> a été acceptée par l''éditeur.</p>
   <p><strong>Détails :</strong></p>
   <ul>
     <li>Prix : {{price}} MAD</li>
     <li>URL placée : <a href="{{placed_url}}">{{placed_url}}</a></li>
     <li>Date d''acceptation : {{accepted_at}}</li>
   </ul>
   <p><a href="{{dashboard_url}}">Voir les détails</a></p>',
  'Votre demande de lien {{link_title}} a été acceptée ! Prix: {{price}} MAD, URL: {{placed_url}}',
  '["user_name", "link_title", "price", "placed_url", "accepted_at", "dashboard_url"]'
),
(
  'payment_received',
  'Paiement reçu - {{amount}} MAD',
  '<h2>💰 Paiement reçu !</h2>
   <p>Bonjour {{user_name}},</p>
   <p>Nous avons reçu votre paiement de <strong>{{amount}} MAD</strong>.</p>
   <p><strong>Détails :</strong></p>
   <ul>
     <li>Montant : {{amount}} MAD</li>
     <li>Méthode : {{payment_method}}</li>
     <li>Référence : {{reference}}</li>
     <li>Date : {{payment_date}}</li>
   </ul>
   <p>Votre solde a été mis à jour.</p>',
  'Paiement reçu : {{amount}} MAD via {{payment_method}}. Référence: {{reference}}',
  '["user_name", "amount", "payment_method", "reference", "payment_date"]'
),
(
  'commission_earned',
  'Commission gagnée - {{amount}} MAD',
  '<h2>💸 Commission gagnée !</h2>
   <p>Bonjour {{user_name}},</p>
   <p>Vous avez gagné une commission de <strong>{{amount}} MAD</strong>.</p>
   <p><strong>Détails :</strong></p>
   <ul>
     <li>Commission : {{amount}} MAD</li>
     <li>Transaction : {{transaction_type}}</li>
     <li>Date : {{earned_date}}</li>
   </ul>
   <p>Votre solde a été mis à jour.</p>',
  'Commission gagnée : {{amount}} MAD pour {{transaction_type}}',
  '["user_name", "amount", "transaction_type", "earned_date"]'
);

-- 6. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent ON notifications(email_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent ON notifications(push_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);

-- 7. Fonction pour créer une notification avancée
CREATE OR REPLACE FUNCTION create_advanced_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type VARCHAR(20) DEFAULT 'info',
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_action_type VARCHAR(50) DEFAULT NULL,
  p_action_data JSONB DEFAULT '{}',
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_preferences RECORD;
BEGIN
  -- Récupérer les préférences de l'utilisateur
  SELECT * INTO user_preferences 
  FROM notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Créer la notification
  INSERT INTO notifications (
    user_id, title, message, type, priority, 
    action_url, action_type, action_data, expires_at
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority,
    p_action_url, p_action_type, p_action_data, p_expires_at
  ) RETURNING id INTO notification_id;
  
  -- Envoyer l'email si activé
  IF user_preferences.email_enabled AND p_priority IN ('high', 'urgent') THEN
    -- Ici on pourrait appeler une fonction pour envoyer l'email
    UPDATE notifications 
    SET email_sent = true, email_sent_at = NOW()
    WHERE id = notification_id;
  END IF;
  
  -- Envoyer la notification push si activée
  IF user_preferences.push_enabled THEN
    UPDATE notifications 
    SET push_sent = true, push_sent_at = NOW()
    WHERE id = notification_id;
  END IF;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour envoyer un email
CREATE OR REPLACE FUNCTION send_notification_email(
  p_notification_id UUID,
  p_template_name VARCHAR(100),
  p_variables JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  notification_record RECORD;
  user_record RECORD;
  template_record RECORD;
  email_id UUID;
BEGIN
  -- Récupérer les informations de la notification
  SELECT n.*, u.email as user_email, u.name as user_name
  INTO notification_record
  FROM notifications n
  JOIN users u ON n.user_id = u.id
  WHERE n.id = p_notification_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Récupérer le template
  SELECT * INTO template_record
  FROM email_templates
  WHERE name = p_template_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Créer l'entrée dans l'historique des emails
  INSERT INTO email_history (
    user_id, notification_id, email_type, subject, 
    recipient_email, template_name, status, metadata
  ) VALUES (
    notification_record.user_id, p_notification_id, p_template_name,
    template_record.subject, notification_record.user_email,
    p_template_name, 'pending', p_variables
  ) RETURNING id INTO email_id;
  
  -- Ici on pourrait intégrer avec un service d'email (SendGrid, Mailgun, etc.)
  -- Pour l'instant, on marque comme envoyé
  UPDATE email_history 
  SET status = 'sent', sent_at = NOW()
  WHERE id = email_id;
  
  UPDATE notifications 
  SET email_sent = true, email_sent_at = NOW()
  WHERE id = p_notification_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour créer automatiquement les préférences de notification
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Créer le trigger
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- 12. Fonction pour obtenir les statistiques de notifications
CREATE OR REPLACE FUNCTION get_notification_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  total_notifications INTEGER,
  unread_notifications INTEGER,
  email_notifications INTEGER,
  push_notifications INTEGER,
  urgent_notifications INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_notifications,
    COUNT(*) FILTER (WHERE read = false)::INTEGER as unread_notifications,
    COUNT(*) FILTER (WHERE email_sent = true)::INTEGER as email_notifications,
    COUNT(*) FILTER (WHERE push_sent = true)::INTEGER as push_notifications,
    COUNT(*) FILTER (WHERE priority = 'urgent')::INTEGER as urgent_notifications
  FROM notifications 
  WHERE user_uuid IS NULL OR user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 13. Commentaires pour documenter le système
COMMENT ON TABLE notification_preferences IS 'Préférences de notification des utilisateurs';
COMMENT ON TABLE email_history IS 'Historique des emails envoyés';
COMMENT ON TABLE email_templates IS 'Templates d''emails pour les notifications';
COMMENT ON COLUMN notifications.priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN notifications.expires_at IS 'Date d''expiration de la notification';
COMMENT ON COLUMN notifications.action_data IS 'Données supplémentaires pour l''action'; 