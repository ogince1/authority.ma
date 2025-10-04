-- Migration pour le système de messagerie entre éditeur et annonceur
-- Activation automatique quand l'éditeur accepte une commande

-- 1. Créer une table pour les conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexte de la conversation
  purchase_request_id UUID REFERENCES link_purchase_requests(id) ON DELETE CASCADE,
  
  -- Participants
  advertiser_id UUID REFERENCES users(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Métadonnées de la conversation
  subject VARCHAR(255),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  -- Compteurs de messages non lus
  unread_count_advertiser INTEGER DEFAULT 0,
  unread_count_publisher INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer une table pour les messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Expéditeur et destinataire
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contenu du message
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN (
    'text', 'system', 'notification', 'file', 'link'
  )),
  
  -- Métadonnées
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Fichiers attachés
  attachments JSONB DEFAULT '[]',
  
  -- Références
  related_purchase_request_id UUID REFERENCES link_purchase_requests(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_conversations_purchase_request ON conversations(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_advertiser ON conversations(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_conversations_publisher ON conversations(publisher_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id ON conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_receiver_id ON conversation_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_read ON conversation_messages(is_read);

-- 4. Fonction pour créer une conversation automatiquement quand une demande est acceptée
CREATE OR REPLACE FUNCTION create_conversation_on_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la demande est acceptée, créer une conversation
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO conversations (
      purchase_request_id,
      advertiser_id,
      publisher_id,
      subject
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.publisher_id,
      'Demande acceptée - ' || NEW.anchor_text
    );
    
    -- Ajouter un message système
    INSERT INTO conversation_messages (
      conversation_id,
      sender_id,
      receiver_id,
      content,
      message_type,
      related_purchase_request_id
    ) VALUES (
      (SELECT id FROM conversations WHERE purchase_request_id = NEW.id ORDER BY created_at DESC LIMIT 1),
      NEW.publisher_id,
      NEW.user_id,
      'Votre demande d''achat a été acceptée ! Le lien a été placé sur ' || COALESCE(NEW.placed_url, 'l''URL spécifiée') || '. Vous pouvez maintenant communiquer avec l''éditeur pour toute question.',
      'system',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour obtenir les conversations d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid UUID)
RETURNS TABLE(
  conversation_id UUID,
  purchase_request_id UUID,
  other_user_id UUID,
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  anchor_text TEXT,
  target_url TEXT,
  purchase_status TEXT,
  last_message_content TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.purchase_request_id,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.publisher_id
      ELSE c.advertiser_id
    END as other_user_id,
    c.subject,
    c.last_message_at,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.unread_count_advertiser
      ELSE c.unread_count_publisher
    END as unread_count,
    lpr.anchor_text,
    lpr.target_url,
    lpr.status as purchase_status,
    (SELECT content FROM conversation_messages 
     WHERE conversation_id = c.id 
     ORDER BY created_at DESC 
     LIMIT 1) as last_message_content
  FROM conversations c
  JOIN link_purchase_requests lpr ON c.purchase_request_id = lpr.id
  WHERE c.advertiser_id = user_uuid OR c.publisher_id = user_uuid
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour marquer les messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Marquer les messages comme lus
  UPDATE conversation_messages 
  SET is_read = true, read_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND receiver_id = p_user_id 
    AND is_read = false;
  
  -- Réinitialiser le compteur de messages non lus
  IF p_user_id = (SELECT advertiser_id FROM conversations WHERE id = p_conversation_id) THEN
    UPDATE conversations 
    SET unread_count_advertiser = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations 
    SET unread_count_publisher = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour mettre à jour les compteurs de messages non lus
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW(), 
      last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Mettre à jour le compteur de messages non lus
  IF NEW.sender_id = (SELECT advertiser_id FROM conversations WHERE id = NEW.conversation_id) THEN
    UPDATE conversations 
    SET unread_count_publisher = unread_count_publisher + 1
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations 
    SET unread_count_advertiser = unread_count_advertiser + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer les triggers
CREATE TRIGGER trigger_create_conversation_on_acceptance
  AFTER UPDATE ON link_purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_on_acceptance();

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- 9. Créer une vue pour faciliter les requêtes
CREATE OR REPLACE VIEW user_conversations AS
SELECT 
  c.id,
  c.purchase_request_id,
  c.advertiser_id,
  c.publisher_id,
  c.created_at,
  c.updated_at,
  c.subject,
  c.last_message_at,
  c.unread_count_advertiser,
  c.unread_count_publisher,
  CASE 
    WHEN c.advertiser_id = auth.uid() THEN c.unread_count_advertiser
    ELSE c.unread_count_publisher
  END as unread_count,
  CASE 
    WHEN c.advertiser_id = auth.uid() THEN c.publisher_id
    ELSE c.advertiser_id
  END as other_user_id,
  lpr.anchor_text,
  lpr.target_url,
  lpr.status as purchase_status
FROM conversations c
JOIN link_purchase_requests lpr ON c.purchase_request_id = lpr.id
WHERE c.advertiser_id = auth.uid() OR c.publisher_id = auth.uid();

-- 10. RLS Policies pour les conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour les conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (advertiser_id = auth.uid() OR publisher_id = auth.uid());

CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (advertiser_id = auth.uid() OR publisher_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (advertiser_id = auth.uid() OR publisher_id = auth.uid());

-- Politiques pour les messages
CREATE POLICY "Users can view messages in their conversations"
  ON conversation_messages FOR SELECT
  TO authenticated
  USING (conversation_id IN (
    SELECT id FROM conversations 
    WHERE advertiser_id = auth.uid() OR publisher_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in their conversations"
  ON conversation_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND 
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE advertiser_id = auth.uid() OR publisher_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON conversation_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- 11. Permissions
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_messages TO authenticated;
GRANT SELECT ON user_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated; 