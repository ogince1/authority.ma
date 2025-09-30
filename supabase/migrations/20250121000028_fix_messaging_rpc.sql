-- Migration pour corriger la fonction RPC get_user_conversations
-- Date: 2025-01-21

-- Corriger la fonction get_user_conversations pour éviter les colonnes ambiguës
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
    (SELECT cm.content FROM conversation_messages cm
     WHERE cm.conversation_id = c.id 
     ORDER BY cm.created_at DESC 
     LIMIT 1) as last_message_content
  FROM conversations c
  JOIN link_purchase_requests lpr ON c.purchase_request_id = lpr.id
  WHERE c.advertiser_id = user_uuid OR c.publisher_id = user_uuid
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction alternative plus simple pour récupérer les conversations
CREATE OR REPLACE FUNCTION get_user_conversations_simple(user_uuid UUID)
RETURNS TABLE(
  conversation_id UUID,
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  other_user_id UUID,
  last_message_content TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.subject,
    c.last_message_at,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.unread_count_advertiser
      ELSE c.unread_count_publisher
    END as unread_count,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.publisher_id
      ELSE c.advertiser_id
    END as other_user_id,
    (SELECT cm.content FROM conversation_messages cm
     WHERE cm.conversation_id = c.id 
     ORDER BY cm.created_at DESC 
     LIMIT 1) as last_message_content
  FROM conversations c
  WHERE c.advertiser_id = user_uuid OR c.publisher_id = user_uuid
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations_simple(UUID) TO authenticated; 