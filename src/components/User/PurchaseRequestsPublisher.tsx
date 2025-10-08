import React, { useState, useEffect, Suspense } from 'react';
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
  Send,
  FileText,
  PenTool
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
// ✅ OPTIMISATION: Chargement paresseux du RichTextEditor
const RichTextEditor = React.lazy(() => import('../Editor/RichTextEditor'));

interface PurchaseRequestsProps {
  initialUser?: any;
}

const PurchaseRequests: React.FC<PurchaseRequestsProps> = ({ initialUser }) => {
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
  
  // États pour le nouveau processus en deux étapes
  const [showPlacementModal, setShowPlacementModal] = React.useState(false);
  const [placementUrl, setPlacementUrl] = React.useState('');
  const [placementNotes, setPlacementNotes] = React.useState('');
  const [selectedRequestForPlacement, setSelectedRequestForPlacement] = React.useState<LinkPurchaseRequest | null>(null);
  
  // ✅ État pour empêcher les clics multiples
  const [isSubmittingPlacement, setIsSubmittingPlacement] = React.useState(false);
  
  // État pour afficher l'article complet
  const [showArticleModal, setShowArticleModal] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/dashboard/purchase-requests', 'Demandes Reçues | Back.ma');
    
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

      const result = await getLinkPurchaseRequests({ 
        publisher_id: user.id,
        page,
        limit: itemsPerPage
      });
      
      setRequests(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
      
      // ✅ OPTIMISATION: Charger les messages non lus en arrière-plan (sans bloquer)
      if (result.data && result.data.length > 0) {
        loadUnreadCountsForRequests(result.data).catch(error => {
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
        .select('purchase_request_id, unread_count_publisher')
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
          unreadCountsMap[conv.purchase_request_id] = conv.unread_count_publisher || 0;
        }
      });

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
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Déterminer le nouveau statut selon le type de contenu
      const request = requests.find(r => r.id === requestId);
      let newStatus: string;
      
      if (request?.content_option === 'platform') {
        // Si rédaction par la plateforme, passer en attente d'article
        newStatus = 'accepted_waiting_article';
        // Utiliser extended_status au lieu de status
        const { error } = await supabase
          .from('link_purchase_requests')
          .update({
            extended_status: newStatus,
            status: 'accepted', // Garder le statut original pour la compatibilité
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);
        
        if (error) throw error;

        // ✅ FIX: Créer une conversation pour les articles avec rédaction par la plateforme
        try {
          const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .insert({
              purchase_request_id: requestId,
              advertiser_id: request.user_id, // Annonceur
              publisher_id: request.publisher_id, // Éditeur
              subject: `Demande acceptée - ${request.anchor_text}`,
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
                sender_id: request.publisher_id, // Éditeur
                receiver_id: request.user_id, // Annonceur
                content: `Bonjour ! J'ai accepté votre demande pour le lien "${request.anchor_text}". L'équipe va maintenant rédiger l'article pour vous.`,
                message_type: 'text',
                related_purchase_request_id: requestId
              });

            if (messageError) {
              console.error('Error creating initial message:', messageError);
            }
          }
        } catch (conversationError) {
          console.error('Error in conversation creation:', conversationError);
          // Ne pas bloquer le processus principal
        }
        
        toast.success('Demande acceptée ! En attente de rédaction d\'article par l\'admin.');
        loadRequests();
      } else {
        // Si contenu personnalisé, ouvrir le modal de placement directement
    setSelectedRequestId(requestId);
    setPlacedUrl('');
    setShowUrlModal(true);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Erreur lors de l\'acceptation');
    }
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
      const { supabase } = await import('../../lib/supabase');
      
      // Récupérer les détails de la demande avant l'acceptation
      const requestDetails = await getPurchaseRequestDetails(selectedRequestId!);
      
      if (!requestDetails) {
        toast.error('Impossible de récupérer les détails de la demande');
        return;
      }

      // Mettre à jour le statut et ajouter l'URL placée
      const { error } = await supabase
        .from('link_purchase_requests')
        .update({
          status: 'placement_completed',
          placed_url: placedUrl.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequestId);

      if (error) throw error;

      // Créer une transaction de crédit pour l'éditeur
      await createCreditTransaction({
        user_id: requestDetails.publisher_id!,
        type: 'commission',
        amount: Math.round(requestDetails.proposed_price! * 0.7), // 70% pour l'éditeur
        description: `Commission pour placement de lien - Demande #${selectedRequestId.slice(0, 8)}`,
        related_purchase_request_id: selectedRequestId
      });

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

      toast.success(`URL de placement ajoutée avec succès ! Commission créditée. Une conversation a été créée avec l'annonceur.`);
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


  // ✅ FIX: Fonction pour ajouter l'URL de placement (étape 2) - SÉCURISÉE
  const handleAddPlacementUrl = async () => {
    if (!selectedRequestForPlacement || !placementUrl.trim()) {
      toast.error('Veuillez saisir une URL de placement');
      return;
    }

    // ✅ PROTECTION: Empêcher les clics multiples
    if (isSubmittingPlacement) {
      console.log('⚠️ Traitement déjà en cours, veuillez patienter...');
      return;
    }

    try {
      setIsSubmittingPlacement(true);
      console.log('🚀 Début du traitement de placement pour:', selectedRequestForPlacement.id);
      
      const { supabase } = await import('../../lib/supabase');
      
      // ✅ Vérifier la session AVANT toute opération
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return;
      }
      
      // ✅ Mettre à jour la demande avec l'URL de placement
      const { error: updateError } = await supabase
        .from('link_purchase_requests')
        .update({
          extended_status: 'placement_completed',
          status: 'accepted', // Garder le statut original pour la compatibilité
          placed_url: placementUrl.trim(),
          placement_notes: placementNotes.trim() || null,
          placed_at: new Date().toISOString(), // ✅ Ajouter timestamp
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequestForPlacement.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour demande:', updateError);
        throw new Error(`Mise à jour impossible: ${updateError.message}`);
      }

      console.log('✅ Demande mise à jour avec succès');

      // ✅ Créer la transaction de crédit AVEC gestion d'erreur séparée
      try {
        await createCreditTransaction({
          user_id: selectedRequestForPlacement.publisher_id!,
          type: 'commission',
          amount: Math.round(selectedRequestForPlacement.proposed_price! * 0.7), // 70% pour l'éditeur
          description: `Commission pour placement de lien - Demande #${selectedRequestForPlacement.id.slice(0, 8)}`,
          related_purchase_request_id: selectedRequestForPlacement.id
        });
        console.log('✅ Transaction de crédit créée');
      } catch (creditError) {
        console.error('❌ Erreur transaction crédit:', creditError);
        // ⚠️ Le lien est placé mais pas de crédit
        toast.warning('⚠️ Lien placé mais erreur lors du crédit. Contactez le support avec le code: ' + selectedRequestForPlacement.id.slice(0, 8));
      }

      toast.success('✅ URL de placement ajoutée avec succès ! Commission créditée.');
      
      // ✅ Fermer modal et réinitialiser AVANT de recharger
      setShowPlacementModal(false);
      setSelectedRequestForPlacement(null);
      setPlacementUrl('');
      setPlacementNotes('');
      
      // ✅ Invalider le cache si disponible
      try {
        const { cache } = await import('../../lib/cache');
        cache.invalidate('purchase_requests_');
        console.log('🗑️  Cache invalidé après placement');
      } catch (cacheError) {
        console.log('⚠️ Cache non disponible (normal en dev)');
      }
      
      // ✅ IMPORTANT: AWAIT le rechargement des données
      console.log('🔄 Rechargement des demandes...');
      await loadRequests();
      console.log('✅ Rechargement terminé');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'URL de placement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      // ✅ TOUJOURS débloquer le bouton
      setIsSubmittingPlacement(false);
      console.log('🏁 Traitement terminé');
    }
  };

  const getStatusBadge = (request: any) => {
    // Utiliser extended_status si disponible, sinon status
    const status = request.extended_status || request.status;
    
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Acceptée
          </span>
        );
      case 'accepted_waiting_article':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente d'article
          </span>
        );
      case 'article_ready':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FileText className="h-3 w-3 mr-1" />
            Article prêt
          </span>
        );
      case 'placement_pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Target className="h-3 w-3 mr-1" />
            Placement en attente
          </span>
        );
      case 'placement_completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Placement terminé
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
                        {request.content_option === 'platform' || request.content_option === 'custom' ? (
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

                    {/* Article rédigé par la plateforme */}
                    {request.content_option === 'platform' && (request.article_title || request.article_content) && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
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
                          <div className="mb-2">
                            <span className="text-xs text-green-700 font-medium">Titre:</span>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{request.article_title}</p>
                          </div>
                        )}

                        {request.article_content && (
                          <div className="mb-2">
                            <span className="text-xs text-green-700 font-medium">Contenu:</span>
                            <div className="bg-white rounded border border-green-200 p-2 mt-1">
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {request.article_content.replace(/<[^>]*>/g, '').substring(0, 100)}
                                {(request.article_content.replace(/<[^>]*>/g, '').length > 100) && '...'}
                              </div>
                            </div>
                            <button
                              onClick={() => openContentModal(request.article_content || '')}
                              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-100 hover:bg-green-200 rounded transition-colors mt-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Voir l'article complet</span>
                            </button>
                          </div>
                        )}

                        {request.article_keywords && request.article_keywords.length > 0 && (
                          <div>
                            <span className="text-xs text-green-700 font-medium">Mots-clés:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(request.extended_status || request.status) === 'pending' && (
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

                {/* Statut: En attente d'article (rédaction par la plateforme) */}
                {(request.extended_status || request.status) === 'accepted_waiting_article' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="text-sm text-blue-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      En attente de rédaction d'article par l'admin
                    </div>
                    <div className="text-sm text-gray-500">
                      L'équipe rédaction va créer l'article
                    </div>
                  </div>
                )}

                {/* Statut: Article prêt, en attente de placement */}
                {(request.extended_status || request.status) === 'article_ready' && (
                  <div className="pt-4 border-t border-gray-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-purple-600 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Article rédigé, en attente de placement
                      </div>
                    </div>
                    
                    {/* Affichage de l'article */}
                    {request.article_title && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                          <PenTool className="h-4 w-4 mr-2" />
                          {request.article_title}
                        </h4>
                        {request.writer_name && (
                          <p className="text-sm text-purple-700 mb-2">
                            <strong>Rédigé par :</strong> {request.writer_name}
                          </p>
                        )}
                        {request.article_keywords && request.article_keywords.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-purple-700 mb-1"><strong>Mots-clés :</strong></p>
                            <div className="flex flex-wrap gap-1">
                              {request.article_keywords.map((keyword, index) => (
                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {request.article_content && (
                          <div>
                            <p className="text-sm text-purple-700 mb-1"><strong>Contenu :</strong></p>
                            <div className="text-sm text-gray-700 bg-white border border-purple-200 rounded p-3 max-h-32 overflow-y-auto">
                              {request.article_content.length > 200 
                                ? `${request.article_content.substring(0, 200)}...` 
                                : request.article_content
                              }
                            </div>
                            {request.article_content.length > 200 && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowArticleModal(true);
                                }}
                                className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
                              >
                                Voir l'article complet
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowArticleModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Voir l'article</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequestForPlacement(request);
                          setShowPlacementModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Target className="h-4 w-4" />
                        <span>Ajouter l'URL de placement</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Statut: Placement en attente */}
                {(request.extended_status || request.status) === 'placement_pending' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="text-sm text-orange-600 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      En attente d'ajout de l'URL de placement
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRequestForPlacement(request);
                        setShowPlacementModal(true);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded-xl hover:bg-orange-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Target className="h-4 w-4" />
                      <span>Ajouter l'URL de placement</span>
                    </button>
                  </div>
                )}

                {/* Statut: Placement terminé */}
                {(request.extended_status || request.status) === 'placement_completed' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Placement terminé
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.placed_url && (
                        <a 
                          href={request.placed_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Voir le lien placé
                        </a>
                      )}
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
                  {selectedRequest.content_option === 'platform' || selectedRequest.content_option === 'custom' ? (
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

      {/* Modal pour ajouter l'URL de placement */}
      {showPlacementModal && selectedRequestForPlacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Ajouter l'URL de placement</h3>
                <button
                  onClick={() => setShowPlacementModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de la page où le lien a été placé *
                  </label>
                  <input
                    type="url"
                    value={placementUrl}
                    onChange={(e) => setPlacementUrl(e.target.value)}
                    placeholder="https://votresite.com/page-avec-le-lien"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes sur le placement (optionnel)
                  </label>
                  <textarea
                    value={placementNotes}
                    onChange={(e) => setPlacementNotes(e.target.value)}
                    placeholder="Détails sur le placement du lien..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {selectedRequestForPlacement.content_option === 'platform' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Article rédigé par la plateforme</span>
                    </div>
                    {selectedRequestForPlacement.article_title && (
                      <p className="text-sm text-green-700 font-medium">{selectedRequestForPlacement.article_title}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1">
                      L'article a été rédigé par {selectedRequestForPlacement.writer_name || 'l\'équipe rédaction'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleAddPlacementUrl}
                  disabled={isSubmittingPlacement || !placementUrl.trim()}
                  className={`flex-1 bg-green-600 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isSubmittingPlacement || !placementUrl.trim()
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmittingPlacement ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Traitement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      <span>Confirmer le placement</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!isSubmittingPlacement) {
                      setShowPlacementModal(false);
                    }
                  }}
                  disabled={isSubmittingPlacement}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal pour afficher l'article complet */}
      {showArticleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  {selectedRequest.article_title || 'Article rédigé par la plateforme'}
                </h3>
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations de l'article */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedRequest.writer_name && (
                      <div>
                        <span className="font-medium text-purple-700">Rédigé par :</span>
                        <span className="ml-2 text-gray-700">{selectedRequest.writer_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-purple-700">Demande :</span>
                      <span className="ml-2 text-gray-700">#{selectedRequest.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  
                  {selectedRequest.article_keywords && selectedRequest.article_keywords.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-purple-700 block mb-2">Mots-clés ciblés :</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.article_keywords.map((keyword, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenu de l'article */}
                {selectedRequest.article_content && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <PenTool className="h-4 w-4 mr-2 text-purple-600" />
                      Contenu de l'article
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <div 
                          className="text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: selectedRequest.article_content.replace(/\n/g, '<br>') 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowArticleModal(false);
                      setSelectedRequestForPlacement(selectedRequest);
                      setShowPlacementModal(true);
                    }}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Target className="h-4 w-4" />
                    <span>Ajouter l'URL de placement</span>
                  </button>
                  <button
                    onClick={() => setShowArticleModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-400 transition-all duration-200"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests; 