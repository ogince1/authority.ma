import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  MessageCircle, 
  Eye, 
  Inbox, 
  Target,
  DollarSign,
  User,
  Calendar,
  Globe,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  X,
  Link as LinkIcon,
  BarChart3,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import { 
  getLinkPurchaseRequests, 
  updateLinkPurchaseRequestStatus, 
  createCreditTransaction,
  checkAdvertiserBalance,
  getCurrentUser,
  supabase,
  acceptPurchaseRequest,
  acceptPurchaseRequestWithUrl,
  getPurchaseRequestDetails,
  getConversationMessages,
  sendMessage,
  markConversationAsRead
} from '../../lib/supabase';
import { LinkPurchaseRequest, ConversationMessage } from '../../types';
import toast from 'react-hot-toast';
import CampaignStatusBadge from './CampaignStatusBadge';
import { trackPageView } from '../../utils/analytics';
import RichContentDisplay from '../Editor/RichContentDisplay';
import Pagination from '../Common/Pagination';
import RichTextEditor from '../Editor/RichTextEditor';

const PurchaseRequests: React.FC = () => {
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('created_at');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [expandedMessages, setExpandedMessages] = React.useState<Set<string>>(new Set());
  const [messages, setMessages] = React.useState<Record<string, ConversationMessage[]>>({});
  const [newMessage, setNewMessage] = React.useState<Record<string, string>>({});
  const [sendingMessage, setSendingMessage] = React.useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    trackPageView('/dashboard/purchase-requests', 'Demandes Reçues | Back.ma');
    loadCurrentUser();
    loadRequests();
  }, []);

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
      const user = await getCurrentUser();
      if (!user) return;

      const result = await getLinkPurchaseRequests({ 
        publisher_id: user.id,
        page,
        limit: itemsPerPage
      });
      setRequests(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
      
      // Charger les messages non lus pour chaque demande
      if (result.data && result.data.length > 0) {
        await loadUnreadCountsForRequests(result.data);
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
      const { supabase } = await import('../../lib/supabase');
      const unreadCountsMap: Record<string, number> = {};

      for (const request of requests) {
        // Trouver la conversation liée à cette demande
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id, unread_count_publisher')
          .eq('purchase_request_id', request.id)
          .single();

        if (conversation) {
          unreadCountsMap[request.id] = conversation.unread_count_publisher || 0;
        } else {
          unreadCountsMap[request.id] = 0;
        }
      }

      setUnreadCounts(unreadCountsMap);
      console.log('📧 Messages non lus par demande:', unreadCountsMap);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const [showUrlModal, setShowUrlModal] = React.useState(false);
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [placedUrl, setPlacedUrl] = React.useState('');

  const handleAcceptRequest = async (requestId: string) => {
    setSelectedRequestId(requestId);
    setPlacedUrl('');
    setShowUrlModal(true);
  };

  const handleConfirmPlacement = async () => {
    if (!placedUrl.trim()) {
      toast.error('Veuillez saisir l\'URL où le lien a été placé');
      return;
    }

    if (!placedUrl.startsWith('http://') && !placedUrl.startsWith('https://')) {
      toast.error('Veuillez saisir une URL valide (commençant par http:// ou https://)');
      return;
    }

    try {
      // Récupérer les détails de la demande avant l'acceptation
      const requestDetails = await getPurchaseRequestDetails(selectedRequestId!);
      
      if (!requestDetails) {
        toast.error('Impossible de récupérer les détails de la demande');
        return;
      }

      // Mettre à jour le statut et ajouter l'URL placée
      const acceptResult = await acceptPurchaseRequestWithUrl(selectedRequestId!, placedUrl);
      
      if (!acceptResult.success) {
        console.error('Error accepting request:', acceptResult.error);
        toast.error('Erreur lors de l\'acceptation de la demande');
        return;
      }

      // Créer automatiquement une conversation entre l'éditeur et l'annonceur
      try {
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            purchase_request_id: selectedRequestId,
            advertiser_id: requestDetails.user_id, // Annonceur
            publisher_id: requestDetails.publisher_id, // Éditeur
            subject: `Demande acceptée - ${requestDetails.anchor_text}`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          // Ne pas bloquer le processus si la conversation échoue
        } else {
          // Ajouter un message initial dans la conversation
          const { error: messageError } = await supabase
            .from('conversation_messages')
            .insert({
              conversation_id: conversation.id,
              sender_id: requestDetails.publisher_id, // Éditeur
              receiver_id: requestDetails.user_id, // Annonceur
              content: `Bonjour ! J'ai accepté votre demande pour le lien "${requestDetails.anchor_text}". Le lien a été placé sur : ${placedUrl}`,
              message_type: 'text',
              related_purchase_request_id: selectedRequestId,
              created_at: new Date().toISOString()
            });

          if (messageError) {
            console.error('Error creating initial message:', messageError);
          }
        }
      } catch (error) {
        console.error('Error in conversation creation:', error);
        // Ne pas bloquer le processus principal
      }

      toast.success(`Demande acceptée ! URL ajoutée avec succès. Une conversation a été créée avec l'annonceur.`);
      setShowUrlModal(false);
      setSelectedRequestId(null);
      setPlacedUrl('');
      loadRequests(); // Recharger les données
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateLinkPurchaseRequestStatus(requestId, 'rejected');
      toast.success('Demande refusée');
      loadRequests(); // Recharger les données
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erreur lors du refus');
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

  const filteredAndSortedRequests = React.useMemo(() => {
    let filtered = requests.filter((request: LinkPurchaseRequest) => {
      const matchesSearch = 
        request.anchor_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.target_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.advertiser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Tri des demandes
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'proposed_price':
          aValue = a.proposed_price || 0;
          bValue = b.proposed_price || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'anchor_text':
          aValue = a.anchor_text?.toLowerCase() || '';
          bValue = b.anchor_text?.toLowerCase() || '';
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [requests, searchTerm, statusFilter, sortBy, sortOrder]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalValue: requests.reduce((sum, r) => sum + (r.proposed_price || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement des demandes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Inbox className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Aucune demande reçue</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Vous n'avez pas encore reçu de demandes d'achat pour vos liens. 
              Les annonceurs peuvent découvrir vos sites et liens dans la section "Trouver des médias".
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Demandes Reçues
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Gérez les demandes d'achat de liens pour vos sites et articles
              </p>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>
        </motion.div>

        {/* Stats modernisées */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Demandes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Reçues</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Inbox className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">À traiter</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acceptées</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                <p className="text-xs text-gray-500 mt-1">Validées</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refusées</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-gray-500 mt-1">Déclinées</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
                <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} DH</p>
                <p className="text-xs text-gray-500 mt-1">Potentiel de revenus</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtres et contrôles modernisés */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par ID, email, URL ou texte d'ancrage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
        </div>
      </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">Acceptées</option>
                <option value="rejected">Refusées</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="created_at">Date de création</option>
                <option value="proposed_price">Prix proposé</option>
                <option value="status">Statut</option>
                <option value="anchor_text">Texte d'ancrage</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
              >
                {sortOrder === 'asc' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Liste des demandes modernisée */}
        <div className="space-y-6">
          {filteredAndSortedRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Header avec statut */}
              <div className="p-6 border-b border-gray-100/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Inbox className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Demande #{request.id.slice(0, 8)}
                  </h3>
                      <div className="mt-1">{getStatusBadge(request.status)}</div>
                </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Bouton Messages avec badge de notification */}
                    <div className="relative">
                      <button
                        onClick={() => toggleMessages(request.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                        title="Voir les messages"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      {unreadCounts[request.id] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCounts[request.id]}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openRequestDetails(request)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Prix proposé</span>
                      <span className="font-semibold text-purple-600 text-lg">
                        {request.proposed_price?.toLocaleString() || 'Non spécifié'} DH
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Site concerné</span>
                      <div className="mt-1">
                        <span className="font-semibold text-gray-900">{getSiteName(request)}</span>
                      </div>
                      {request.link_listing?.website?.url && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">{request.link_listing.website.url}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Annonceur</span>
                      <span className="font-semibold text-gray-900">{request.advertiser?.email}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Type de demande</span>
                      <div className="mt-1">
                        {request.link_listing?.title && request.link_listing.title.startsWith('Nouvel article') ? (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            📝 Nouvel article à créer
                          </span>
                        ) : request.link_listing?.title ? (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            🔗 Article existant
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            ❓ Type inconnu
                          </span>
                        )}
                      </div>
                      {request.link_listing?.title && !request.link_listing.title.startsWith('Nouvel article') && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Article:</span>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {request.link_listing.title}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                  <div>
                      <span className="text-sm text-gray-600">URL cible</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 truncate text-sm">{request.target_url}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Texte d'ancrage</span>
                      <p className="font-medium text-gray-900 mt-1">{request.anchor_text}</p>
                    </div>

                    {request.content_option === 'custom' && request.custom_content && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Contenu personnalisé</span>
                          </div>
                          <button
                            onClick={() => openContentModal(request.custom_content || '')}
                            className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Voir</span>
                          </button>
                        </div>
                        <div className="bg-white rounded border border-blue-200 p-2">
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {request.custom_content.replace(/<[^>]*>/g, '').substring(0, 100)}
                            {(request.custom_content.replace(/<[^>]*>/g, '').length > 100) && '...'}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      En attente de votre réponse
                    </div>
                    <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <CheckCircle className="h-4 w-4" />
                      <span>Accepter</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <XCircle className="h-4 w-4" />
                      <span>Refuser</span>
                    </button>
                    </div>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Demande acceptée
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.response_date && new Date(request.response_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="text-sm text-red-600 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Demande refusée
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.response_date && new Date(request.response_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
            </div>

            {/* Section Messages - S'affiche quand expandée */}
            {expandedMessages.has(request.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-100/50 bg-gray-50/50"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                      Messages avec l'annonceur
                    </h4>
                    <button
                      onClick={() => toggleMessages(request.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Zone des messages */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="p-4 space-y-4">
                      {messages[request.id] && messages[request.id].length > 0 ? (
                        messages[request.id].map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${
                              isOwnMessage(message)
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            } rounded-lg p-3 shadow-sm`}>
                              {message.message_type === 'system' && (
                                <div className="text-xs opacity-75 mb-1">Message système</div>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <div className={`text-xs mt-1 ${
                                isOwnMessage(message)
                                  ? 'text-blue-100' 
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
                          <p className="text-sm">Commencez la conversation avec l'annonceur</p>
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
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      disabled={sendingMessage.has(request.id)}
                    />
                    <button
                      onClick={() => handleSendMessage(request.id)}
                      disabled={!newMessage[request.id]?.trim() || sendingMessage.has(request.id)}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        {filteredAndSortedRequests.length > 0 && (
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Détails de la demande #{selectedRequest.id.slice(0, 8)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Site concerné</p>
                <p className="font-medium text-gray-900">{getSiteName(selectedRequest)}</p>
                {selectedRequest.link_listing?.website?.url && (
                  <p className="text-xs text-gray-500 mt-1">{selectedRequest.link_listing.website.url}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Type de demande</p>
                <div className="mt-1">
                  {selectedRequest.link_listing?.title && selectedRequest.link_listing.title.startsWith('Nouvel article') ? (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      📝 Nouvel article à créer
                    </span>
                  ) : selectedRequest.link_listing?.title ? (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      🔗 Article existant
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      ❓ Type inconnu
                    </span>
                  )}
                </div>
                {selectedRequest.link_listing?.title && !selectedRequest.link_listing.title.startsWith('Nouvel article') && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Article:</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedRequest.link_listing.title}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Prix proposé</p>
                <p className="font-medium text-gray-900">{selectedRequest.proposed_price?.toLocaleString() || 'Non spécifié'} MAD</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">URL cible</p>
                <p className="font-medium text-gray-900 break-all">{selectedRequest.target_url}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Texte d'ancrage</p>
                <p className="font-medium text-gray-900">{selectedRequest.anchor_text}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Durée proposée</p>
                <p className="font-medium text-gray-900">{selectedRequest.proposed_duration} mois</p>
              </div>

              {selectedRequest.message && (
                <div>
                  <p className="text-sm text-gray-600">Message de l'annonceur</p>
                  <p className="font-medium text-gray-900">{selectedRequest.message}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Annonceur</p>
                <p className="font-medium text-gray-900">{selectedRequest.advertiser?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>

              {selectedRequest.response_date && (
                <div>
                  <p className="text-sm text-gray-600">Date de réponse</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedRequest.response_date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleAcceptRequest(selectedRequest.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Accepter la demande</span>
                  </button>
                  <button
                    onClick={() => {
                      handleRejectRequest(selectedRequest.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Refuser la demande</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Modal pour saisir l'URL placée modernisé */}
        {showUrlModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirmer l'acceptation
                </h3>
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    URL où le lien a été placé *
                  </label>
                  <input
                    type="url"
                    value={placedUrl}
                    onChange={(e) => setPlacedUrl(e.target.value)}
                    placeholder="https://votresite.com/article-avec-le-lien"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Saisissez l'URL exacte de la page où vous avez placé le lien
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={handleConfirmPlacement}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Accepter et confirmer</span>
                  </button>
                  <button
                    onClick={() => setShowUrlModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-400 transition-all duration-200"
                  >
                    Annuler
                  </button>
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
                <RichTextEditor
                  value={modalContent}
                  onChange={setModalContent}
                  placeholder="Modifiez votre contenu personnalisé..."
                  rows={8}
                  className="w-full"
                />
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

export default PurchaseRequests; 