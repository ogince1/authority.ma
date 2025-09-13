import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink, MessageCircle, Eye, Inbox, Target } from 'lucide-react';
import { 
  getLinkPurchaseRequests, 
  updateLinkPurchaseRequestStatus, 
  createCreditTransaction,
  checkAdvertiserBalance,
  getCurrentUser,
  supabase,
  acceptPurchaseRequest,
  acceptPurchaseRequestWithUrl,
  getPurchaseRequestDetails
} from '../../lib/supabase';
import { LinkPurchaseRequest } from '../../types';
import toast from 'react-hot-toast';
import CampaignStatusBadge from './CampaignStatusBadge';
import { trackPageView } from '../../utils/analytics';

const PurchaseRequests: React.FC = () => {
  const [requests, setRequests] = React.useState<LinkPurchaseRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRequest, setSelectedRequest] = React.useState<LinkPurchaseRequest | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/dashboard/purchase-requests', 'Demandes Reçues | Back.ma');
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const userRequests = await getLinkPurchaseRequests({ publisher_id: user.id });
      setRequests(userRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement des demandes...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune demande reçue</h2>
        <p className="text-gray-600">
          Vous n'avez pas encore reçu de demandes d'achat pour vos liens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Demandes reçues</h2>
          <p className="text-gray-600 mt-1">
            {requests.length} demande{requests.length > 1 ? 's' : ''} en attente
          </p>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="grid gap-4">
        {requests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Demande #{request.id.slice(0, 8)}
                  </h3>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Lien</p>
                    <p className="font-medium text-gray-900">#{request.link_listing_id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prix proposé</p>
                    <p className="font-medium text-gray-900">{request.proposed_price?.toLocaleString() || 'Non spécifié'} MAD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">URL cible</p>
                    <p className="font-medium text-gray-900 truncate">{request.target_url}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Texte d'ancrage</p>
                    <p className="font-medium text-gray-900">{request.anchor_text}</p>
                  </div>
                  {request.campaign_id && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Campagne associée</p>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">Campagne #{request.campaign_id.slice(0, 8)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Annonceur: {request.advertiser?.email}</span>
                  <span>Date: {new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => openRequestDetails(request)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Accepter</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>Refuser</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de détails */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la demande #{selectedRequest.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Lien concerné</p>
                <p className="font-medium text-gray-900">#{selectedRequest.link_listing_id.slice(0, 8)}</p>
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
              <div className="flex items-center space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    handleAcceptRequest(selectedRequest.id);
                    setShowModal(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Accepter la demande</span>
                </button>
                <button
                  onClick={() => {
                    handleRejectRequest(selectedRequest.id);
                    setShowModal(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Refuser la demande</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal pour saisir l'URL placée */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer l'acceptation
              </h3>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL où le lien a été placé *
                </label>
                <input
                  type="url"
                  value={placedUrl}
                  onChange={(e) => setPlacedUrl(e.target.value)}
                  placeholder="https://votresite.com/article-avec-le-lien"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Saisissez l'URL exacte de la page où vous avez placé le lien
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleConfirmPlacement}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Accepter et confirmer</span>
                </button>
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests; 