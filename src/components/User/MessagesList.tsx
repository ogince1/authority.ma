import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Clock, 
  User, 
  ExternalLink, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { getUserConversations, getUnreadMessageCount } from '../../lib/supabase';
import { UserConversation } from '../../types';
import { useNavigate } from 'react-router-dom';
import Favicon from '../Common/Favicon';

const MessagesList: React.FC = () => {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<UserConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  // Filtrage des conversations
  useEffect(() => {
    let filtered = conversations;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.purchase_status === statusFilter);
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.other_user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.other_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.anchor_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.target_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.last_message_content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, statusFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { getCurrentUser, supabase } = await import('../../lib/supabase');
      const user = await getCurrentUser();
      if (!user) return;

      // Requête simplifiée - seulement les colonnes qui existent dans conversations
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
          purchase_request_id,
          advertiser:users!conversations_advertiser_id_fkey(
            id,
            email,
            name
          ),
          publisher:users!conversations_publisher_id_fkey(
            id,
            email,
            name
          )
        `)
        .or(`advertiser_id.eq.${user.id},publisher_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération conversations:', error);
        return;
      }

      // Récupérer les détails des demandes d'achat pour chaque conversation
      const transformedConversations = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const isAdvertiser = user.id === conv.advertiser_id;
          const otherUser = isAdvertiser ? conv.publisher : conv.advertiser;
          
          // Récupérer les détails de la demande d'achat
          let purchaseDetails = null;
          if (conv.purchase_request_id) {
            const { data: requestData } = await supabase
              .from('link_purchase_requests')
              .select('status, target_url, anchor_text')
              .eq('id', conv.purchase_request_id)
              .single();
            purchaseDetails = requestData;
          }
          
          // Récupérer le dernier message
          const { data: lastMessageData } = await supabase
            .from('conversation_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          return {
            conversation_id: conv.id,
            subject: conv.subject,
            last_message_at: conv.last_message_at,
            unread_count: isAdvertiser ? conv.unread_count_advertiser : conv.unread_count_publisher,
            last_message_content: lastMessageData?.content || 'Aucun message',
            other_user_id: isAdvertiser ? conv.publisher_id : conv.advertiser_id,
            other_user: otherUser,
            purchase_status: purchaseDetails?.status || 'unknown',
            target_url: purchaseDetails?.target_url || '',
            anchor_text: purchaseDetails?.anchor_text || ''
          };
        })
      );

      setConversations(transformedConversations);
      setFilteredConversations(transformedConversations);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-2xl p-8">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Mes Messages
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Communiquez avec vos partenaires commerciaux
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadConversations}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Actualiser</span>
              </button>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-sm rounded-full px-3 py-1 font-medium">
                    {totalUnread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtres et Recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, URL ou contenu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filtre par statut */}
            <div className="md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">Acceptées</option>
                <option value="rejected">Refusées</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Liste des conversations modernisée */}
        {filteredConversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
          >
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {conversations.length === 0 ? 'Aucune conversation' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600">
              {conversations.length === 0 
                ? 'Les conversations apparaîtront ici quand vous aurez des demandes acceptées.'
                : 'Aucune conversation ne correspond à vos critères de recherche.'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.conversation_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/dashboard/messages/${conversation.conversation_id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Avatar avec favicon */}
                      <div className="flex-shrink-0">
                        {conversation.target_url ? (
                          <Favicon 
                            url={conversation.target_url} 
                            size={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                              {conversation.other_user?.name || conversation.other_user?.email || 'Utilisateur inconnu'}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.anchor_text || 'Demande de lien'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            {conversation.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-sm rounded-full px-3 py-1 font-medium">
                                {conversation.unread_count}
                              </span>
                            )}
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {formatDate(conversation.last_message_at)}
                            </span>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        </div>

                        {/* Message récent */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {conversation.last_message_content || 'Aucun message'}
                        </p>

                        {/* Informations supplémentaires */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.purchase_status)}`}>
                              {conversation.purchase_status === 'accepted' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Acceptée
                                </>
                              ) : conversation.purchase_status === 'pending' ? (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  En attente
                                </>
                              ) : conversation.purchase_status === 'rejected' ? (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Refusée
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {conversation.purchase_status}
                                </>
                              )}
                            </span>
                            {conversation.target_url && (
                              <span className="text-xs text-gray-500 truncate max-w-xs" title={conversation.target_url}>
                                {conversation.target_url}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesList; 