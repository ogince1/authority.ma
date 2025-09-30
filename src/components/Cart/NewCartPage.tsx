import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getUserBalance,
  createLinkPurchaseRequest,
  createCreditTransaction,
  createVirtualLink,
  getOrCreateTestPublisher,
  processLinkPurchase
} from '../../lib/supabase';

interface CartItem {
  id: string;
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
  };
  targetUrl: string;
  anchorText: string;
  quantity: number;
  isVirtualLink: boolean;
}

const NewCartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger le panier et les données utilisateur
  useEffect(() => {
    const loadCartAndUser = async () => {
      try {
        // Charger le panier depuis localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(cart);

        // Charger les données utilisateur
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        setUser(currentUser);

        // Charger le solde utilisateur
        const balance = await getUserBalance(currentUser.id);
        setUserBalance(balance);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données');
      }
    };

    loadCartAndUser();
  }, [navigate]);

  // Calculer le total du panier
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.listing.price * item.quantity), 0);
  };

  // Supprimer un article du panier
  const removeFromCart = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Mettre à jour la quantité
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Mettre à jour l'URL cible
  const updateTargetUrl = (itemId: string, targetUrl: string) => {
    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, targetUrl } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Mettre à jour le texte d'ancrage
  const updateAnchorText = (itemId: string, anchorText: string) => {
    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, anchorText } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Vérifier si le panier est valide
  const isCartValid = () => {
    return cartItems.every(item => 
      item.targetUrl.trim() && 
      item.anchorText.trim() && 
      item.quantity > 0
    );
  };

  // Traiter les achats
  const processPurchases = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    if (!isCartValid()) {
      setError('Veuillez remplir tous les champs requis (URL cible et texte d\'ancrage)');
      return;
    }

    const totalAmount = calculateTotal();
    if (userBalance < totalAmount) {
      setError(`Solde insuffisant. Solde actuel: ${userBalance} MAD, Total requis: ${totalAmount} MAD`);
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const results = [];
      const campaignId = localStorage.getItem('current_campaign_id');

      for (const item of cartItems) {
        try {
          console.log(`Traitement de l'article: ${item.listing.title}`);

          // Déterminer l'ID de l'éditeur
          let publisherId: string;
          
          if (item.isVirtualLink) {
            // Pour les liens virtuels, utiliser l'éditeur de test
            publisherId = await getOrCreateTestPublisher();
            
            // Créer le lien virtuel dans la base de données
            await createVirtualLink({
              id: item.listing.id,
              title: item.listing.title,
              description: item.listing.description,
              url: item.targetUrl,
              price: item.listing.price,
              type: 'dofollow',
              category: item.listing.category,
              user_id: publisherId
            });
            
            console.log(`Lien virtuel créé: ${item.listing.id}`);
          } else {
            // Pour les liens existants, utiliser le vrai publisher_id du listing
            if (item.listing.user_id) {
              publisherId = item.listing.user_id;
            } else {
              // Fallback: utiliser un éditeur de test valide
              publisherId = 'db521baa-5713-496f-84f2-4a635b9e54a4'; // editeur@test.com (ID valide)
            }
          }

          // Créer la demande d'achat
          const purchaseRequest = await createLinkPurchaseRequest({
            link_listing_id: item.listing.id,
            user_id: user.id,
            publisher_id: publisherId,
            target_url: item.targetUrl,
            anchor_text: item.anchorText,
            proposed_price: item.listing.price * item.quantity,
            proposed_duration: 1,
            campaign_id: campaignId || undefined
          });

          console.log(`Demande d'achat créée: ${purchaseRequest.id}`);

          // DÉBIT IMMÉDIAT - L'annonceur est débité dès la création de la demande
          const transaction = await createCreditTransaction({
            user_id: user.id,
            type: 'purchase',
            amount: item.listing.price * item.quantity,
            description: `Achat de lien: ${item.listing.title}`,
            status: 'completed'
          });

          console.log(`Débit immédiat effectué pour: ${item.listing.title} - ${item.listing.price * item.quantity} MAD`);

          results.push({
            success: true,
            item: item.listing.title,
            purchaseRequestId: purchaseRequest.id
          });

        } catch (itemError) {
          console.error(`Erreur pour l'article ${item.listing.title}:`, itemError);
          results.push({
            success: false,
            item: item.listing.title,
            error: itemError instanceof Error ? itemError.message : 'Erreur inconnue'
          });
        }
      }

      // Afficher les résultats
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        setSuccess(`${successful.length} achat(s) traité(s) avec succès !`);
        
        // Vider le panier
        setCartItems([]);
        localStorage.removeItem('cart');
        localStorage.removeItem('current_campaign_id');
        
        // Recharger le solde
        const newBalance = await getUserBalance(user.id);
        setUserBalance(newBalance);
      }

      if (failed.length > 0) {
        setError(`${failed.length} achat(s) ont échoué. Vérifiez les logs pour plus de détails.`);
      }

      // ✅ OPTIMISATION: Redirection après paiement réussi
      if (results.length > 0) {
        setSuccess('Achats traités avec succès !');
        // Vider le panier
        setCartItems([]);
        localStorage.removeItem('cart');
        
        // ✅ OPTIMISATION: Déclencher le rechargement des données
        window.dispatchEvent(new CustomEvent('balance-updated'));
        window.dispatchEvent(new CustomEvent('purchase-completed'));
        
        // Rediriger vers le dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }

    } catch (error) {
      console.error('Erreur lors du traitement des achats:', error);
      setError('Erreur lors du traitement des achats');
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Panier vide</h1>
          <p className="text-gray-600 mb-6">Votre panier est vide. Ajoutez des liens pour commencer.</p>
          <button
            onClick={() => navigate('/liens')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Voir les liens disponibles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Panier d'achat</h1>

        {/* Informations utilisateur */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-medium text-gray-900">Bonjour, {user?.email}</h2>
              <p className="text-sm text-gray-600">Solde disponible: <span className="font-medium text-green-600">{userBalance} MAD</span></p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              Mon Dashboard
            </button>
          </div>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Articles du panier */}
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{item.listing.title}</h3>
                  <p className="text-gray-600">{item.listing.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {item.listing.category}
                    </span>
                    {item.isVirtualLink && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        Lien virtuel
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {item.listing.price * item.quantity} MAD
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.listing.price} MAD × {item.quantity}
                  </p>
                </div>
              </div>

              {/* Champs de configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL cible *
                  </label>
                  <input
                    type="url"
                    value={item.targetUrl}
                    onChange={(e) => updateTargetUrl(item.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texte d'ancrage *
                  </label>
                  <input
                    type="text"
                    value={item.anchorText}
                    onChange={(e) => updateAnchorText(item.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Texte du lien"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer du panier
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Résumé et actions */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Total du panier</h2>
              <p className="text-3xl font-bold text-green-600">{calculateTotal()} MAD</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Solde disponible: {userBalance} MAD</p>
              <p className={`text-sm ${userBalance >= calculateTotal() ? 'text-green-600' : 'text-red-600'}`}>
                {userBalance >= calculateTotal() ? 'Solde suffisant' : 'Solde insuffisant'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard/quick-buy')}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-md hover:bg-gray-600"
            >
              Continuer les achats
            </button>
            <button
              onClick={processPurchases}
              disabled={processing || !isCartValid() || userBalance < calculateTotal()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Traitement en cours...' : 'Procéder au paiement'}
            </button>
          </div>

          {!isCartValid() && (
            <p className="text-sm text-red-600 mt-2">
              Veuillez remplir tous les champs requis avant de procéder au paiement.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewCartPage;
