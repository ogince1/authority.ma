import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getLinkPurchaseRequests,
  updateLinkPurchaseRequestStatus,
  acceptPurchaseRequestWithUrl,
  getUserBalance,
  getCreditTransactions,
  getCurrentUserProfile
} from '../../lib/supabase';
import { LinkPurchaseRequest, CreditTransaction, User } from '../../types';
import { RefreshCw, Bell, DollarSign, TrendingUp, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const PublisherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [purchaseRequests, setPurchaseRequests] = useState<LinkPurchaseRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LinkPurchaseRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [placedUrl, setPlacedUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fonction pour recharger le solde
  const refreshBalance = async () => {
    if (user) {
      try {
        const userBalance = await getUserBalance(user.id);
        setBalance(userBalance);
        console.log('💰 Solde éditeur mis à jour:', userBalance);
      } catch (error) {
        console.error('Error refreshing publisher balance:', error);
      }
    }
  };

  // Fonction pour recharger toutes les données
  const refreshAllData = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      // Recharger les demandes d'achat
      const requests = await getLinkPurchaseRequests(user.id);
      setPurchaseRequests(requests);
      
      // Recharger le solde
      await refreshBalance();
      
      // Recharger les transactions
      const userTransactions = await getCreditTransactions(user.id);
      setTransactions(userTransactions);
      
      setLastSyncTime(new Date());
      console.log('🔄 Données éditeur synchronisées');
    } catch (error) {
      console.error('Error refreshing publisher data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Vérifier l'authentification et charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const userProfile = await getCurrentUserProfile();
        if (!userProfile || userProfile.role !== 'publisher') {
          setError('Accès non autorisé. Ce dashboard est réservé aux éditeurs.');
          return;
        }

        setUser(userProfile);

        // Charger les demandes d'achat pour cet éditeur
        const requests = await getLinkPurchaseRequests({ 
          publisher_id: currentUser.id 
        });
        setPurchaseRequests(requests);

        // Charger le solde
        const userBalance = await getUserBalance(currentUser.id);
        setBalance(userBalance);

        // Charger les transactions récentes
        const userTransactions = await getCreditTransactions(currentUser.id, {
          date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 derniers jours
        });
        setTransactions(userTransactions.slice(0, 10)); // 10 plus récentes
        
        // Initialiser le temps de synchronisation
        setLastSyncTime(new Date());

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      if (user) {
        refreshAllData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate, user]);

  // Écouter les événements de mise à jour du solde
  useEffect(() => {
    const handleBalanceUpdate = () => {
      refreshBalance();
    };

    // Écouter les événements personnalisés pour la mise à jour du solde
    window.addEventListener('balance-updated', handleBalanceUpdate);
    
    // Recharger le solde toutes les 30 secondes
    const interval = setInterval(refreshBalance, 30000);

    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      clearInterval(interval);
    };
  }, [user]);

  // Gérer la réponse à une demande
  const handleRespondToRequest = async (request: LinkPurchaseRequest, status: 'accepted' | 'rejected') => {
    setProcessing(true);
    setError(null);

    try {
      if (status === 'accepted' && !placedUrl.trim()) {
        setError('Veuillez fournir l\'URL où le lien a été placé');
        return;
      }

      if (status === 'accepted') {
        // Accepter avec l'URL placée
        const result = await acceptPurchaseRequestWithUrl(request.id, placedUrl);
        if (!result.success) {
          throw new Error(result.error || 'Erreur lors de l\'acceptation');
        }

        // Envoyer un email de confirmation à l'annonceur
        try {
          const emailModule = await import('../../utils/emailServiceClient');
          const { emailServiceClient } = emailModule;
          
          await emailServiceClient.sendTemplateEmail(
            'ADVERTISER_ORDER_ACCEPTED',
            request.user_email || '',
            {
              user_name: request.user_name || 'Utilisateur',
              order_id: request.id,
              sites_count: 1,
              total_amount: request.proposed_price || 0,
              dashboard_url: `${window.location.origin}/dashboard/orders`
            },
            ['order_accepted', 'advertiser', 'confirmation']
          );
          
          console.log('Email de commande acceptée envoyé');
        } catch (emailError) {
          console.error('Erreur envoi email commande acceptée:', emailError);
          // Ne pas bloquer le processus si l'email échoue
        }
      } else {
        // Rejeter avec une réponse
        await updateLinkPurchaseRequestStatus(
          request.id, 
          'rejected', 
          responseText || 'Demande rejetée'
        );

        // Envoyer un email de rejet à l'annonceur
        try {
          const emailModule = await import('../../utils/emailServiceClient');
          const { emailServiceClient } = emailModule;
          
          await emailServiceClient.sendTemplateEmail(
            'ADVERTISER_ORDER_REJECTED',
            request.user_email || '',
            {
              user_name: request.user_name || 'Utilisateur',
              order_id: request.id,
              rejection_reason: responseText || 'Demande rejetée par l\'éditeur',
              refund_amount: request.proposed_price || 0,
              dashboard_url: `${window.location.origin}/dashboard/orders`
            },
            ['order_rejected', 'advertiser', 'notification']
          );
          
          console.log('Email de commande rejetée envoyé');
        } catch (emailError) {
          console.error('Erreur envoi email commande rejetée:', emailError);
          // Ne pas bloquer le processus si l'email échoue
        }
      }

      // Recharger les données
      const requests = await getLinkPurchaseRequests({ 
        publisher_id: user?.id 
      });
      setPurchaseRequests(requests);

      const userBalance = await getUserBalance(user?.id || '');
      setBalance(userBalance);

      setShowResponseModal(false);
      setSelectedRequest(null);
      setResponseText('');
      setPlacedUrl('');

    } catch (error) {
      console.error('Erreur lors de la réponse:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la réponse');
    } finally {
      setProcessing(false);
    }
  };

  // Ouvrir le modal de réponse
  const openResponseModal = (request: LinkPurchaseRequest) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
    setResponseText('');
    setPlacedUrl('');
  };

  // Fermer le modal
  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedRequest(null);
    setResponseText('');
    setPlacedUrl('');
  };

  // Statistiques
  const stats = {
    totalRequests: purchaseRequests.length,
    pendingRequests: purchaseRequests.filter(r => r.status === 'pending').length,
    acceptedRequests: purchaseRequests.filter(r => r.status === 'accepted').length,
    rejectedRequests: purchaseRequests.filter(r => r.status === 'rejected').length,
    totalEarnings: transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0)
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️ Erreur</div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Éditeur
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Dernière mise à jour: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Jamais'}
              {refreshing && <span className="ml-2 text-blue-600">🔄 Synchronisation en cours...</span>}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Synchronisation...' : 'Synchroniser'}</span>
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Bonjour, {user?.name}</p>
              <p className="text-lg font-medium text-green-600">
                Solde: {balance} MAD
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
                <div className="text-sm text-gray-600">Total demandes</div>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.acceptedRequests}</div>
                <div className="text-sm text-gray-600">Acceptées</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalEarnings} MAD</div>
                <div className="text-sm text-gray-600">Gains totaux</div>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Demandes d'achat */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Demandes d'achat reçues
          </h2>

          {purchaseRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune demande d'achat reçue pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        Demande de lien - {request.link_listing?.title || 'Lien'}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>De: {request.advertiser?.name || request.advertiser?.email}</span>
                        <span>Prix proposé: {request.proposed_price} MAD</span>
                        <span>Durée: {request.proposed_duration} mois</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status === 'pending' ? 'En attente' :
                         request.status === 'accepted' ? 'Acceptée' :
                         request.status === 'rejected' ? 'Rejetée' :
                         request.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL cible</label>
                      <p className="text-sm text-gray-900 break-all">{request.target_url}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Texte d'ancrage</label>
                      <p className="text-sm text-gray-900">{request.anchor_text}</p>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Message de l'annonceur</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{request.message}</p>
                    </div>
                  )}

                  {request.editor_response && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Votre réponse</label>
                      <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded">{request.editor_response}</p>
                    </div>
                  )}

                  {request.placed_url && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">URL où le lien a été placé</label>
                      <p className="text-sm text-gray-900 break-all">{request.placed_url}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Reçue le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openResponseModal(request)}
                          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
                        >
                          Répondre
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions récentes */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Transactions récentes
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune transaction récente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount} MAD
                    </p>
                    <p className="text-sm text-gray-600">
                      Solde: {transaction.balance_after} MAD
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de réponse */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Répondre à la demande
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL où le lien a été placé *
                </label>
                <input
                  type="url"
                  value={placedUrl}
                  onChange={(e) => setPlacedUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/page-with-link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optionnel)
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Message pour l'annonceur..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeResponseModal}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRespondToRequest(selectedRequest, 'accepted')}
                disabled={processing || !placedUrl.trim()}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Traitement...' : 'Accepter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublisherDashboard;
