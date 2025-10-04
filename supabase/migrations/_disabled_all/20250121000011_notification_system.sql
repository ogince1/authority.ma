-- Migration pour le système de notifications
-- Date: 2025-01-21

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    
    -- Lien vers l'action
    action_url TEXT,
    action_type VARCHAR(50) CHECK (action_type IN ('link_purchase', 'website_approval', 'payment', 'review', 'campaign', 'order')),
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    
    -- Informations de création
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Index pour les performances
    CONSTRAINT valid_notification CHECK (length(title) > 0 AND length(message) > 0)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Trigger pour mettre à jour read_at
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = TRUE AND OLD.read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_read_at();

-- RLS Policies pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Les admins peuvent créer des notifications pour tous
CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_action_url TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        action_url,
        action_type
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_action_url,
        p_action_type
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Données de test pour les notifications
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_type
) 
SELECT 
    u.id,
    'Bienvenue sur Back.ma !',
    'Votre compte a été créé avec succès. Commencez par explorer notre catalogue de liens.',
    'success',
    'info'
FROM users u 
WHERE u.role = 'advertiser'
LIMIT 5
ON CONFLICT DO NOTHING;

-- Notifications pour les éditeurs
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_type
) 
SELECT 
    u.id,
    'Prêt à vendre vos liens ?',
    'Ajoutez vos sites web et commencez à gagner de l''argent en vendant des emplacements de liens.',
    'info',
    'website_approval'
FROM users u 
WHERE u.role = 'publisher'
LIMIT 5
ON CONFLICT DO NOTHING; 