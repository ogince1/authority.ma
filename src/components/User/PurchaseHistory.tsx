import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  DollarSign,
  Calendar,
  Eye,
  TrendingUp
} from 'lucide-react';
import { getLinkPurchaseRequests } from '../../lib/supabase';
import { LinkPurchaseRequest } from '../../types';
import toast from 'react-hot-toast';

const PurchaseHistory: React.FC = () => {
  const [purchases, setPurchases] = useState<LinkPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<LinkPurchaseRequest | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPurchaseHistory();
  }, []);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      const { getCurrentUser } = await import('../../lib/supabase');
      const user = await getCurrentUser();
      if (!user) return;

      const userPurchases = await getLinkPurchaseRequests({ user_id: user.id });
      setPurchases(userPurchases);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast.error('Erreur lors du chargement de l\'historique');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openPurchaseDetails = (purchase: LinkPurchaseRequest) => {
    setSelectedPurchase(purchase);
    setShowModal(true);
  };

  const getTotalSpent = () => {
    return purchases
      .filter(p => p.status === 'accepted')
      .reduce((sum, p) => sum + (p.proposed_price || 0), 0);
  };

  const getAcceptedCount = () => {
    return purchases.filter(p => p.status === 'accepted').length;
  };

  const getPendingCount = () => {
    return purchases.filter(p => p.status === 'pending').length;
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
            <h1 className="text-2xl font-bold text-gray-900">Mes Achats</h1>
            <p className="text-gray-600 mt-1">
              Historique de vos achats de liens
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total dépensé</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalSpent()} MAD</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Liens acceptés</p>
              <p className="text-2xl font-bold text-gray-900">{getAcceptedCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{getPendingCount()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des achats */}
      {purchases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun achat effectué</h2>
          <p className="text-gray-600">
            Vous n'avez pas encore effectué d'achat de liens
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Historique des achats</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {purchase.anchor_text}
                        </h4>
                        {getStatusBadge(purchase.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {purchase.target_url}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(purchase.created_at)}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {purchase.proposed_price} MAD
                        </span>
                        {purchase.placed_url && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Lien placé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openPurchaseDetails(purchase)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExternalLink className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Détails de l'achat
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Texte d'ancrage</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPurchase.anchor_text}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">URL cible</label>
                        <p className="mt-1 text-sm text-gray-900 break-all">{selectedPurchase.target_url}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Prix</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPurchase.proposed_price} MAD</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Durée</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPurchase.proposed_duration} jours</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Statut</label>
                        <div className="mt-1">{getStatusBadge(selectedPurchase.status)}</div>
                      </div>
                      {selectedPurchase.placed_url && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">URL placée</label>
                          <a 
                            href={selectedPurchase.placed_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-1 text-sm text-blue-600 hover:text-blue-800 break-all"
                          >
                            {selectedPurchase.placed_url}
                          </a>
                        </div>
                      )}
                      {selectedPurchase.message && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Message</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPurchase.message}</p>
                        </div>
                      )}
                      {selectedPurchase.editor_response && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Réponse de l'éditeur</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPurchase.editor_response}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date de création</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPurchase.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PurchaseHistory;


