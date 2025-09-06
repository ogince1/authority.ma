import React from 'react';
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
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkPurchaseRequest } from '../../types';
import { getCurrentUser, getLinkPurchaseRequests, getCurrentUserProfile } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

const AdvertiserRequests: React.FC = () => {
  const [requests, setRequests] = React.useState<LinkPurchaseRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRequest, setSelectedRequest] = React.useState<LinkPurchaseRequest | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/dashboard/purchase-requests', 'Mes Demandes | Back.ma');
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      // Pour les annonceurs, on récupère les demandes qu'ils ont envoyées
      const userRequests = await getLinkPurchaseRequests({ user_id: user.id });
      setRequests(userRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
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
        <p className="text-gray-600 mt-4">Chargement de vos demandes...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune demande envoyée</h2>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas encore envoyé de demandes d'achat de liens
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/liens"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorer les liens
          </a>
          <a
            href="/dashboard/campaigns"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Mes campagnes
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mes demandes d'achat</h2>
          <p className="text-gray-600 mt-1">
            {requests.length} demande{requests.length > 1 ? 's' : ''} envoyée{requests.length > 1 ? 's' : ''}
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
                    <p className="text-sm text-gray-600">Lien demandé</p>
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
                  {request.placed_url && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">URL placée</p>
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-green-600" />
                        <a 
                          href={request.placed_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-green-600 hover:text-green-700 truncate"
                        >
                          {request.placed_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Éditeur: {request.publisher?.email}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date: {new Date(request.created_at).toLocaleDateString()}
                  </span>
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
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de détails */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
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
                <p className="text-sm text-gray-600">Prix proposé</p>
                <p className="font-medium text-gray-900">{selectedRequest.proposed_price?.toLocaleString()} MAD</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">URL cible</p>
                <p className="font-medium text-gray-900">{selectedRequest.target_url}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Texte d'ancrage</p>
                <p className="font-medium text-gray-900">{selectedRequest.anchor_text}</p>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <p className="text-sm text-gray-600">Message</p>
                  <p className="font-medium text-gray-900">{selectedRequest.message}</p>
                </div>
              )}
              
              {selectedRequest.placed_url && (
                <div>
                  <p className="text-sm text-gray-600">URL placée</p>
                  <a 
                    href={selectedRequest.placed_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-green-600 hover:text-green-700"
                  >
                    {selectedRequest.placed_url}
                  </a>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-medium text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertiserRequests;
