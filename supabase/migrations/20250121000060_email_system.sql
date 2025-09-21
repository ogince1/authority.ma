-- Migration pour le système d'email avec Brevo
-- Date: 2025-01-21

-- 1. Table pour les préférences email des utilisateurs
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{
    "welcome_emails": true,
    "order_notifications": true,
    "site_notifications": true,
    "weekly_reports": true,
    "marketing_emails": false
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Table pour l'historique des emails envoyés
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table pour les événements du parcours client
CREATE TABLE IF NOT EXISTS user_journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('advertiser', 'publisher')),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table pour les templates d'emails (optionnel, pour stocker les templates personnalisés)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insérer des préférences par défaut pour les utilisateurs existants
INSERT INTO email_preferences (user_id, preferences)
SELECT id, '{
  "welcome_emails": true,
  "order_notifications": true,
  "site_notifications": true,
  "weekly_reports": true,
  "marketing_emails": false
}'::jsonb
FROM users
WHERE id NOT IN (SELECT user_id FROM email_preferences);

-- 6. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON email_history(email_type);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_user_id ON user_journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_event_type ON user_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_timestamp ON user_journey_events(event_timestamp);

-- 7. Fonction pour créer automatiquement les préférences email pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger pour créer automatiquement les préférences email
DROP TRIGGER IF EXISTS trigger_create_email_preferences ON users;
CREATE TRIGGER trigger_create_email_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- 9. Fonction pour enregistrer l'historique des emails
CREATE OR REPLACE FUNCTION log_email_sent(
  p_user_id UUID,
  p_email_type VARCHAR(50),
  p_subject VARCHAR(255),
  p_recipient_email VARCHAR(255),
  p_template_name VARCHAR(100) DEFAULT NULL,
  p_status VARCHAR(20) DEFAULT 'sent',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  email_id UUID;
BEGIN
  INSERT INTO email_history (
    user_id,
    email_type,
    subject,
    recipient_email,
    template_name,
    status,
    sent_at,
    metadata
  ) VALUES (
    p_user_id,
    p_email_type,
    p_subject,
    p_recipient_email,
    p_template_name,
    p_status,
    NOW(),
    p_metadata
  ) RETURNING id INTO email_id;
  
  RETURN email_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Fonction pour obtenir les statistiques d'emails
CREATE OR REPLACE FUNCTION get_email_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_emails BIGINT,
  sent_emails BIGINT,
  failed_emails BIGINT,
  bounce_rate NUMERIC,
  last_email_sent TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed' OR status = 'bounced') as failed_emails,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'bounced')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as bounce_rate,
    MAX(sent_at) as last_email_sent
  FROM email_history
  WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 11. Fonction pour nettoyer l'historique des emails anciens
CREATE OR REPLACE FUNCTION cleanup_old_email_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les emails plus anciens que 1 an
  DELETE FROM email_history 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Fonction pour obtenir les événements du parcours client d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_journey_events(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_type VARCHAR(50),
  event_data JSONB,
  event_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uje.id,
    uje.event_type,
    uje.event_data,
    uje.event_timestamp
  FROM user_journey_events uje
  WHERE uje.user_id = p_user_id
  ORDER BY uje.event_timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 13. RLS (Row Level Security) pour les tables email
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- 14. Politiques RLS pour email_preferences
CREATE POLICY "Users can view their own email preferences" ON email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" ON email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences" ON email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 15. Politiques RLS pour email_history
CREATE POLICY "Users can view their own email history" ON email_history
  FOR SELECT USING (auth.uid() = user_id);

-- 16. Politiques RLS pour user_journey_events
CREATE POLICY "Users can view their own journey events" ON user_journey_events
  FOR SELECT USING (auth.uid() = user_id);

-- 17. Politiques RLS pour email_templates (lecture seule pour les utilisateurs)
CREATE POLICY "Anyone can view active email templates" ON email_templates
  FOR SELECT USING (is_active = true);

-- 18. Commentaires sur les tables
COMMENT ON TABLE email_preferences IS 'Préférences email des utilisateurs pour les notifications';
COMMENT ON TABLE email_history IS 'Historique des emails envoyés via le système';
COMMENT ON TABLE user_journey_events IS 'Événements du parcours client pour l''analytics';
COMMENT ON TABLE email_templates IS 'Templates d''emails personnalisés';

COMMENT ON COLUMN email_preferences.preferences IS 'Préférences JSON pour les différents types d''emails';
COMMENT ON COLUMN email_history.status IS 'Statut de l''email: pending, sent, delivered, failed, bounced';
COMMENT ON COLUMN user_journey_events.event_data IS 'Données supplémentaires de l''événement au format JSON';

-- 19. Insérer quelques templates d'exemple (optionnel)
INSERT INTO email_templates (name, subject, html_content, variables) VALUES
(
  'custom-welcome',
  'Bienvenue personnalisé sur Back.ma',
  '<h1>Bienvenue {{user_name}} !</h1><p>Merci de nous rejoindre.</p>',
  '["user_name"]'
) ON CONFLICT (name) DO NOTHING;
