import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, User, ExternalLink } from 'lucide-react';
import { getUserConversations, getUnreadMessageCount } from '../../lib/supabase';
import { UserConversation } from '../../types';
import { useNavigate } from 'react-router-dom';

const MessagesList: React.FC = () => {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { getCurrentUser, supabase } = await import('../../lib/supabase');
      const user = await getCurrentUser();
      if (!user) return;

      // Requête directe au lieu de la fonction RPC
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          subject,
          last_message_at,
          unread_count_advertiser,
          unread_count_publisher,
          advertiser_id,
          publisher_id,
          conversation_messages(
            content,
            created_at
          )
        `)
        .or(`advertiser_id.eq.${user.id},publisher_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération conversations:', error);
        return;
      }

      // Transformer les données pour correspondre au format attendu
      const transformedConversations = conversationsData.map(conv => ({
        conversation_id: conv.id,
        subject: conv.subject,
        last_message_at: conv.last_message_at,
        unread_count: user.id === conv.advertiser_id ? conv.unread_count_advertiser : conv.unread_count_publisher,
        last_message_content: conv.conversation_messages && conv.conversation_messages.length > 0 
          ? conv.conversation_messages[conv.conversation_messages.length - 1].content 
          : '',
        other_user_id: user.id === conv.advertiser_id ? conv.publisher_id : conv.advertiser_id
      }));

      setConversations(transformedConversations);

      // Calculer le total des messages non lus
      const unreadCount = transformedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setTotalUnread(unreadCount);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6"
      >
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Messages</h1>
            <p className="text-gray-600 mt-1">
              Communiquez avec vos partenaires commerciaux
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {totalUnread}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Liste des conversations */}
      {conversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune conversation
          </h3>
          <p className="text-gray-600">
            Les conversations apparaîtront ici quand vous aurez des demandes acceptées.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation, index) => (
            <motion.div
              key={conversation.conversation_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => navigate(`/dashboard/messages/${conversation.conversation_id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          Demande: {conversation.anchor_text}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.unread_count > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unread_count}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.last_message_at)}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {conversation.last_message_content || 'Aucun message'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.purchase_status)}`}>
                            {conversation.purchase_status === 'accepted' ? 'Acceptée' :
                             conversation.purchase_status === 'pending' ? 'En attente' :
                             conversation.purchase_status === 'rejected' ? 'Refusée' : conversation.purchase_status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {conversation.target_url}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MessagesList; 