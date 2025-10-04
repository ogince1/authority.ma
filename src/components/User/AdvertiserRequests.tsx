import React, { Suspense } from 'react';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Eye,
  Target,
  Calendar,
  User,
  Globe,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  FileText,
  PenTool
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkPurchaseRequest, ConversationMessage } from '../../types';
import { 
  getCurrentUser, 
  getLinkPurchaseRequests, 
  getCurrentUserProfile, 
  getPendingConfirmationRequests, 
  confirmLinkPlacement,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  getPurchaseRequestDetails,
  cancelPurchaseRequest
} from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import Favicon from '../Common/Favicon';
import toast from 'react-hot-toast';
import RichContentDisplay from '../Editor/RichContentDisplay';
import Pagination from '../Common/Pagination';
// ✅ OPTIMISATION: Chargement paresseux du RichTextEditor
const RichTextEditor = React.lazy(() => import('../Editor/RichTextEditor'));

interface AdvertiserRequestsProps {
  initialUser?: any;
}

const AdvertiserRequests: React.FC<AdvertiserRequestsProps> = ({ initialUser }) => {
  const [requests, setRequests] = React.useState<LinkPurchaseRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRequest, setSelectedRequest] = React.useState<LinkPurchaseRequest | null>(null);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const itemsPerPage = 10;
  const [contentModalOpen, setContentModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [isEditingContent, setIsEditingContent] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [expandedMessages, setExpandedMessages] = React.useState<Set<string>>(new Set());
  const [messages, setMessages] = React.useState<Record<string, ConversationMessage[]>>({});
  const [newMessage, setNewMessage] = React.useState<Record<string, string>>({});
  const [sendingMessage, setSendingMessage] = React.useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    trackPageView('/dashboard/purchase-requests', 'Mes Demandes | Back.ma');
    
    // ✅ OPTIMISATION: Utiliser l'utilisateur initial si disponible
    if (initialUser) {
      setCurrentUser(initialUser);
    } else {
      loadCurrentUser();
    }
    
    loadRequests();
  }, [initialUser]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    }
  };

  const loadRequests = async (page: number = currentPage) => {
    try {
      setLoading(true);
      
      // ✅ OPTIMISATION: Utiliser l'utilisateur déjà chargé
      const user = currentUser || await getCurrentUser();
      if (!user) return;

      // ✅ OPTIMISATION: Charger les données en parallèle
      const [result, confirmationRequests] = await Promise.all([
        getLinkPurchaseRequests({ 
          user_id: user.id,
          page,
          limit: itemsPerPage
        }),
        getPendingConfirmationRequests(user.id)
      ]);
      
      // Combiner les deux listes
      const allRequests = [...result.data, ...confirmationRequests];
      
      // Supprimer les doublons (au cas où une demande serait dans les deux listes)
      const uniqueRequests = allRequests.filter((request, index, self) => 
        index === self.findIndex(r => r.id === request.id)
      );
      
      setRequests(uniqueRequests);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
      
      // ✅ OPTIMISATION: Charger les messages non lus en arrière-plan (sans bloquer)
      if (uniqueRequests && uniqueRequests.length > 0) {
        loadUnreadCountsForRequests(uniqueRequests).catch(error => {
          console.warn('Error loading unread counts:', error);
        });
      }
      
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCountsForRequests = async (requests: LinkPurchaseRequest[]) => {
    try {
      if (requests.length === 0) {
        setUnreadCounts({});
        return;
      }

      const { supabase } = await import('../../lib/supabase');
      const requestIds = requests.map(r => r.id);
      
      // Une seule requête pour toutes les conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('purchase_request_id, unread_count_advertiser')
        .in('purchase_request_id', requestIds);

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const unreadCountsMap: Record<string, number> = {};
      
      // Initialiser tous les compteurs à 0
      requestIds.forEach(id => {
        unreadCountsMap[id] = 0;
      });
      
      // Mettre à jour avec les données réelles
      conversations?.forEach(conv => {
        if (conv.purchase_request_id) {
          unreadCountsMap[conv.purchase_request_id] = conv.unread_count_advertiser || 0;
        }
      });

      setUnreadCounts(unreadCountsMap);
      console.log('📧 Messages non lus par demande (Advertiser):', unreadCountsMap);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Acceptée
          </span>
        );
      // Le statut 'pending_confirmation' n'existe plus avec le nouveau workflow
      // Le paiement se fait automatiquement lors de l'acceptation
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Refusée
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      default:
        return null;
    }
  };

  const openRequestDetails = (request: LinkPurchaseRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // confirmingRequestId n'est plus nécessaire avec le nouveau workflow

  // Fonctions pour gérer les messages
  const toggleMessages = async (requestId: string) => {
    const isExpanded = expandedMessages.has(requestId);
    
    if (isExpanded) {
      // Fermer les messages
      setExpandedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    } else {
      // Ouvrir et charger les messages
      setExpandedMessages(prev => new Set(prev).add(requestId));
      await loadMessagesForRequest(requestId);
    }
  };

  const loadMessagesForRequest = async (requestId: string) => {
    try {
      // Trouver la conversation liée à cette demande
      const { supabase } = await import('../../lib/supabase');
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('purchase_request_id', requestId)
        .single();

      if (conversation) {
        const messagesData = await getConversationMessages(conversation.id);
        setMessages(prev => ({
          ...prev,
          [requestId]: messagesData
        }));

        // Marquer comme lu
        if (currentUser) {
          await markConversationAsRead(conversation.id, currentUser.id);
          // Rafraîchir le compteur de messages non lus
          setUnreadCounts(prev => ({
            ...prev,
            [requestId]: 0
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const handleSendMessage = async (requestId: string) => {
    const messageContent = newMessage[requestId]?.trim();
    if (!messageContent || !currentUser) return;

    try {
      setSendingMessage(prev => new Set(prev).add(requestId));

      // Trouver la conversation liée à cette demande
      const { supabase } = await import('../../lib/supabase');
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, advertiser_id, publisher_id')
        .eq('purchase_request_id', requestId)
        .single();

      if (conversation) {
        const receiverId = currentUser.id === conversation.advertiser_id 
          ? conversation.publisher_id 
          : conversation.advertiser_id;

        const messageData = {
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          content: messageContent,
          message_type: 'text' as const,
          related_purchase_request_id: requestId
        };

        const sentMessage = await sendMessage(messageData);
        
        // Ajouter le message à la liste locale
        setMessages(prev => ({
          ...prev,
          [requestId]: [...(prev[requestId] || []), sentMessage]
        }));

        // Vider le champ de saisie
        setNewMessage(prev => ({
          ...prev,
          [requestId]: ''
        }));

        toast.success('Message envoyé');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ConversationMessage) => {
    return currentUser?.id === message.sender_id;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadRequests(page);
  };

  const openContentModal = (content: string) => {
    setModalContent(content);
    setContentModalOpen(true);
  };

  // Fonction pour récupérer le nom du site
  const getSiteName = (request: LinkPurchaseRequest) => {
    // Si on a un link_listing avec un website
    if (request.link_listing?.website?.name || request.link_listing?.website?.title) {
      return request.link_listing.website.name || request.link_listing.website.title;
    }
    
    // Si on a un link_listing avec un titre
    if (request.link_listing?.title) {
      return request.link_listing.title;
    }
    
    // Fallback pour les cas non gérés
    return 'Site inconnu';
  };

  // Fonction pour annuler une demande (avec remboursement immédiat)
  const handleCancelRequest = async (requestId: string) => {
    try {
      const result = await cancelPurchaseRequest(requestId);
      if (result.success) {
        toast.success(`Demande annulée et remboursement de ${result.refund_amount} MAD effectué !`);
        loadRequests(); // Recharger la liste
      } else {
        toast.error(result.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Erreur lors de l\'annulation de la demande');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement de vos demandes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Send className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune demande envoyée</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore envoyé de demandes d'achat de liens
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/dashboard/quick-buy"
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Trouver des médias
              </a>
              <a
                href="/dashboard/services"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Services
              </a>
            </div>
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
                Mes demandes d'achat
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {requests.length} demande{requests.length > 1 ? 's' : ''} envoyée{requests.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Liste des demandes modernisée */}
        <div className="space-y-6">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* En-tête avec site et statut */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {request.link_listing?.website?.url ? (
                          <Favicon 
                            url={request.link_listing.website.url} 
                            size={32}
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Globe className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {getSiteName(request)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Demande #{request.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600">Prix proposé</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {request.proposed_price?.toLocaleString() || 'Non spécifié'} MAD
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">URL cible</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate" title={request.target_url}>
                        {request.target_url}
                      </p>
                    </div>
                    
                    {/* Lien de l'article existant */}
                    {request.link_listing?.target_url && !request.content_option && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ExternalLink className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Article existant</span>
                        </div>
                        <a 
                          href={request.link_listing.target_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all"
                        >
                          {request.link_listing.target_url}
                        </a>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Texte d'ancrage</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.anchor_text}
                      </p>
                    </div>

                    {request.content_option === 'custom' && request.custom_content && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Contenu personnalisé</span>
                          </div>
                          <button
                            onClick={() => openContentModal(request.custom_content || '')}
                            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Voir le contenu</span>
                          </button>
                        </div>
                        <div className="border border-blue-200 rounded-lg p-3 bg-white">
                          <div className="text-sm text-gray-600 line-clamp-3">
                            {request.custom_content.replace(/<[^>]*>/g, '').substring(0, 150)}
                            {(request.custom_content.replace(/<[^>]*>/g, '').length > 150) && '...'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Article rédigé par la plateforme */}
                    {request.content_option === 'platform' && (request.article_title || request.article_content) && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <PenTool className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Article rédigé par la plateforme</span>
                          </div>
                          {request.writer_name && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Par: {request.writer_name}
                            </span>
                          )}
                        </div>
                        
                        {request.article_title && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-green-800 mb-2">Titre de l'article:</h4>
                            <div className="border border-green-200 rounded-lg p-3 bg-white">
                              <p className="text-sm font-medium text-gray-900">{request.article_title}</p>
                            </div>
                          </div>
                        )}

                        {request.article_content && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-green-800 mb-2">Contenu de l'article:</h4>
                            <div className="border border-green-200 rounded-lg p-3 bg-white">
                              <div className="text-sm text-gray-600 line-clamp-4">
                                {request.article_content.replace(/<[^>]*>/g, '').substring(0, 200)}
                                {(request.article_content.replace(/<[^>]*>/g, '').length > 200) && '...'}
                              </div>
                              <button
                                onClick={() => openContentModal(request.article_content || '')}
                                className="mt-2 flex items-center space-x-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Voir l'article complet</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {request.article_keywords && request.article_keywords.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-green-800 mb-2">Mots-clés:</h4>
                            <div className="flex flex-wrap gap-2">
                              {request.article_keywords.map((keyword, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Informations secondaires */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    <span className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Éditeur: {request.publisher?.email}</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                    </span>
                  </div>

                  {/* URL placée si disponible - Placement terminé */}
                  {request.placed_url && (request.status === 'placement_completed' || request.status === 'accepted' || request.status === 'confirmed') && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-base font-semibold text-green-800">✅ Placement terminé</span>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Lien publié
                        </span>
                      </div>
                      <div className="bg-white border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <ExternalLink className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">URL du lien placé</span>
                        </div>
                        <a 
                          href={request.placed_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Voir le lien placé</span>
                        </a>
                        <p className="text-xs text-gray-500 mt-2 break-all">{request.placed_url}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-6">
                  {/* Bouton Messages avec badge de notification */}
                  <div className="relative">
                    <button
                      onClick={() => toggleMessages(request.id)}
                      className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                      title="Voir les messages"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    {unreadCounts[request.id] > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                        {unreadCounts[request.id]}
                      </span>
                    )}
                  </div>
                  
                  {/* Bouton d'annulation pour les demandes en attente */}
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                      title="Annuler la demande (remboursement immédiat)"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Annuler</span>
                    </button>
                  )}
                  <button
                    onClick={() => openRequestDetails(request)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Section Messages - S'affiche quand expandée */}
              {expandedMessages.has(request.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 bg-gray-50"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <MessageCircle className="h-5 w-5 mr-2 text-emerald-600" />
                        Messages avec l'éditeur
                      </h4>
                      <button
                        onClick={() => toggleMessages(request.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Zone des messages */}
                    <div className="bg-white rounded-lg border border-gray-200 mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <div className="p-4 space-y-4">
                        {messages[request.id] && messages[request.id].length > 0 ? (
                          messages[request.id].map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md ${
                                isOwnMessage(message)
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-100 text-gray-900'
                              } rounded-lg p-3 shadow-sm`}>
                                {message.message_type === 'system' && (
                                  <div className="text-xs opacity-75 mb-1">Message système</div>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <div className={`text-xs mt-1 ${
                                  isOwnMessage(message)
                                    ? 'text-emerald-100' 
                                    : 'text-gray-500'
                                }`}>
                                  {formatMessageTime(message.created_at)}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>Aucun message pour le moment</p>
                            <p className="text-sm">Commencez la conversation avec l'éditeur</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Zone de saisie */}
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage[request.id] || ''}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(request.id)}
                        placeholder="Tapez votre message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        disabled={sendingMessage.has(request.id)}
                      />
                      <button
                        onClick={() => handleSendMessage(request.id)}
                        disabled={!newMessage[request.id]?.trim() || sendingMessage.has(request.id)}
                        className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingMessage.has(request.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {requests.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              className="justify-center"
            />
          </div>
        )}

        {/* Modal de détails modernisé */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {selectedRequest.link_listing?.website?.url ? (
                      <Favicon 
                        url={selectedRequest.link_listing.website.url} 
                        size={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getSiteName(selectedRequest)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Demande #{selectedRequest.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Statut</span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600">Prix proposé</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedRequest.proposed_price?.toLocaleString()} MAD
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Date de création</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedRequest.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">URL cible</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {selectedRequest.target_url}
                    </p>
                  </div>
                  
                  {/* Lien de l'article existant dans le modal */}
                  {selectedRequest.link_listing?.target_url && !selectedRequest.content_option && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Article existant</span>
                      </div>
                      <a 
                        href={selectedRequest.link_listing.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all"
                      >
                        {selectedRequest.link_listing.target_url}
                      </a>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">Texte d'ancrage</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedRequest.anchor_text}
                    </p>
                  </div>
                  
                  {selectedRequest.message && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-600">Message</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedRequest.message}
                      </p>
                    </div>
                  )}

                  {selectedRequest.content_option === 'custom' && selectedRequest.custom_content && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">Contenu personnalisé</span>
                        </div>
                        <button
                          onClick={() => openContentModal(selectedRequest.custom_content || '')}
                          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Voir le contenu</span>
                        </button>
                      </div>
                      <div className="border border-blue-200 rounded-lg p-3 bg-white">
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {selectedRequest.custom_content.replace(/<[^>]*>/g, '').substring(0, 150)}
                          {(selectedRequest.custom_content.replace(/<[^>]*>/g, '').length > 150) && '...'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedRequest.placed_url && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-base font-semibold text-green-800">✅ Placement terminé</span>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Lien publié
                        </span>
                      </div>
                      <div className="bg-white border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <ExternalLink className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">URL du lien placé</span>
                        </div>
                        <a 
                          href={selectedRequest.placed_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Voir le lien placé</span>
                        </a>
                        <p className="text-xs text-gray-500 mt-2 break-all">{selectedRequest.placed_url}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Modal pour afficher le contenu personnalisé */}
      {contentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Contenu personnalisé</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditingContent(!isEditingContent)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  {isEditingContent ? 'Voir' : 'Modifier'}
                </button>
                <button
                  onClick={() => {
                    setContentModalOpen(false);
                    setIsEditingContent(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isEditingContent ? (
                <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded"></div>}>
                  <RichTextEditor
                    value={modalContent}
                    onChange={setModalContent}
                    placeholder="Modifiez votre contenu personnalisé..."
                    rows={8}
                    className="w-full"
                  />
                </Suspense>
              ) : (
                <div className="prose max-w-none">
                  <RichContentDisplay content={modalContent} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserRequests;
