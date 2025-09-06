import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getUserBalance,
  getCurrentUserProfile,
  getLinkPurchaseRequests,
  getCreditTransactions
} from '../lib/supabase';

const TestFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTestData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        setUser(currentUser);

        const profile = await getCurrentUserProfile();
        setUserProfile(profile);

        const userBalance = await getUserBalance(currentUser.id);
        setBalance(userBalance);

        // Charger les demandes d'achat
        const requests = await getLinkPurchaseRequests({ user_id: currentUser.id });
        setPurchaseRequests(requests);

        // Charger les transactions
        const userTransactions = await getCreditTransactions(currentUser.id);
        setTransactions(userTransactions.slice(0, 5));

      } catch (error) {
        console.error('Erreur lors du chargement des données de test:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, [navigate]);

  const resetCart = () => {
    localStorage.removeItem('cart');
    localStorage.removeItem('current_campaign_id');
    alert('Panier réinitialisé !');
  };

  const addTestFunds = async () => {
    try {
      // Simuler l'ajout de fonds de test
      const testAmount = 1000;
      alert(`Fonds de test ajoutés: ${testAmount} MAD\n(En réalité, vous devriez utiliser le système de paiement)`);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test du Flux Complet - Back.ma
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Informations utilisateur */}
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Informations utilisateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Nom:</strong> {userProfile?.name || 'Non défini'}</p>
              <p><strong>Rôle:</strong> {userProfile?.role || 'Non défini'}</p>
            </div>
            <div>
              <p><strong>Solde:</strong> <span className="text-green-600 font-bold">{balance} MAD</span></p>
              <p><strong>ID:</strong> {user?.id}</p>
            </div>
          </div>
        </div>

        {/* Actions de test */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Créer une campagne</h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer une nouvelle campagne avec vos URLs cibles.
            </p>
            <button
              onClick={() => navigate('/campagne/nouvelle')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Créer une campagne
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🛒 Voir le panier</h3>
            <p className="text-gray-600 mb-4">
              Consultez et gérez les liens dans votre panier d'achat.
            </p>
            <button
              onClick={() => navigate('/panier')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Voir le panier
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Recharger le compte</h3>
            <p className="text-gray-600 mb-4">
              Ajoutez des fonds à votre compte pour effectuer des achats.
            </p>
            <button
              onClick={addTestFunds}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
            >
              Ajouter des fonds
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Accédez à votre tableau de bord personnel.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Mon Dashboard
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Demandes d'achat</h3>
            <p className="text-gray-600 mb-4">
              Consultez vos demandes d'achat envoyées.
            </p>
            <button
              onClick={() => navigate('/dashboard?tab=requests')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700"
            >
              Mes demandes
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Réinitialiser</h3>
            <p className="text-gray-600 mb-4">
              Vider le panier et réinitialiser les données de test.
            </p>
            <button
              onClick={resetCart}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* État actuel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demandes d'achat */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 Demandes d'achat récentes ({purchaseRequests.length})
            </h2>
            {purchaseRequests.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                Aucune demande d'achat
              </div>
            ) : (
              <div className="space-y-3">
                {purchaseRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.link_listing?.title || 'Lien'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Prix: {request.proposed_price} MAD
                        </p>
                        <p className="text-sm text-gray-600">
                          Statut: {request.status}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions récentes */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💰 Transactions récentes ({transactions.length})
            </h2>
            {transactions.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                Aucune transaction
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount} MAD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions de test */}
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📖 Instructions de test
          </h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>1.</strong> Créez une campagne avec vos URLs cibles</p>
            <p><strong>2.</strong> Ajoutez des liens recommandés au panier</p>
            <p><strong>3.</strong> Configurez les URLs cibles et textes d'ancrage</p>
            <p><strong>4.</strong> Procédez au paiement (utilisez le solde du compte)</p>
            <p><strong>5.</strong> Vérifiez que les demandes apparaissent dans le dashboard éditeur</p>
            <p><strong>6.</strong> Testez l'acceptation/rejet des demandes côté éditeur</p>
          </div>
        </div>

        {/* Liens rapides */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/liens')}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Voir les liens disponibles
          </button>
          <button
            onClick={() => navigate('/dashboard/publisher')}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Dashboard Éditeur
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          >
            Actualiser les données
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestFlowPage;
