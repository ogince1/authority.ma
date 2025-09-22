import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Wallet,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing } from '../../types';
import { getUserBalance, createLinkPurchaseRequest, processLinkPurchase, addFundsToBalance, createCreditTransaction, updateCampaign, createNotification, getCurrentUser } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';
import RichTextEditor from '../Editor/RichTextEditor';

interface CartItem {
  listing: LinkListing;
  quantity: number;
  anchorText: string;
  targetUrl: string;
  isVirtual?: boolean;
  // Options de contenu pour les nouveaux articles
  contentOption?: 'platform' | 'custom';
  customContent?: string;
  platformContentPrice?: number;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [balance, setBalance] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/panier', 'Panier | Back.ma');
    loadCartAndBalance();
  }, []);

  const loadCartAndBalance = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Charger le solde de l'utilisateur
      const userBalance = await getUserBalance(user.id);
      setBalance(userBalance);

      // Charger les éléments du panier depuis localStorage
      let savedCart = localStorage.getItem('cart');
      
      // Si le panier principal est vide, essayer de charger depuis quick-buy-cart
      if (!savedCart || savedCart === '[]') {
        const quickBuyCart = localStorage.getItem('quick-buy-cart');
        if (quickBuyCart && quickBuyCart !== '[]') {
          // Synchroniser le panier quick-buy vers le panier principal
          localStorage.setItem('cart', quickBuyCart);
          savedCart = quickBuyCart;
          console.log('Synchronisation du panier quick-buy vers le panier principal');
        }
      }
      
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        
        // Nettoyer le panier des liens invalides (mais garder les liens virtuels)
        const validCartItems = cartItems.filter((item: any) => {
          const isValid = item.listing && 
                         item.listing.id && 
                         (item.listing.user_id || item.isVirtual); // Accepter les liens virtuels
          
          if (!isValid) {
            console.log('Removing invalid cart item:', item.listing?.id);
          }
          
          return isValid;
        });
        
        // Mettre à jour le localStorage si des éléments ont été supprimés
        if (validCartItems.length !== cartItems.length) {
          localStorage.setItem('cart', JSON.stringify(validCartItems));
          localStorage.setItem('quick-buy-cart', JSON.stringify(validCartItems));
          toast(`${cartItems.length - validCartItems.length} lien(s) invalide(s) supprimé(s) du panier`);
        }
        
        setCartItems(validCartItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQuantity;
    setCartItems(updatedItems);
    
    // Synchroniser avec le panier quick-buy
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedItems));
  };

  const removeItem = (index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
    
    // Synchroniser avec le panier quick-buy
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedItems));
    
    toast.success('Article supprimé du panier');
  };

  const updateItemDetails = (index: number, field: 'anchorText' | 'targetUrl', value: string) => {
    const updatedItems = [...cartItems];
    updatedItems[index][field] = value;
    setCartItems(updatedItems);
    
    // Synchroniser avec le panier quick-buy
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedItems));
  };

  const updateContentOption = (index: number, option: 'platform' | 'custom', customContent?: string) => {
    const updatedItems = [...cartItems];
    updatedItems[index] = { 
      ...updatedItems[index], 
      contentOption: option,
      customContent: customContent || '',
      platformContentPrice: option === 'platform' ? 250 : 0
    };
    setCartItems(updatedItems);
    
    // Synchroniser avec le panier quick-buy
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedItems));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.listing.price * item.quantity;
      const contentPrice = (item.isVirtual && item.contentOption === 'platform') ? (item.platformContentPrice || 0) * item.quantity : 0;
      return total + basePrice + contentPrice;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    // Validation des options de contenu pour les nouveaux articles
    for (const item of cartItems) {
      if (item.isVirtual) {
        if (!item.contentOption) {
          toast.error('Veuillez sélectionner une option de contenu pour tous les nouveaux articles');
          return;
        }
        if (item.contentOption === 'custom' && (!item.customContent || item.customContent.trim().length < 100)) {
          toast.error('Le contenu personnalisé doit contenir au moins 100 caractères');
          return;
        }
      }
    }

    // Procéder directement au paiement
    await processPurchases();
  };

  const processPurchases = async () => {
    try {
      setProcessing(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const results: Array<{ success: boolean; item: string; requestId?: string; error?: string }> = [];

      const total = calculateTotal();
      
      // Vérifier le solde actuel en base de données
      const currentBalance = await getUserBalance(user.id);
      console.log('Current balance from DB:', currentBalance);
      console.log('Displayed balance:', balance);
      console.log('Total required:', total);
      
      // Mettre à jour le solde affiché avec la valeur réelle
      setBalance(currentBalance);
      
      if (currentBalance < total) {
        console.log('Balance insufficient, auto-crediting account');
        const requiredAmount = total - currentBalance;
        
        // Créditer automatiquement le compte
        try {
          await addFundsToBalance(user.id, requiredAmount, 'manual', 'Rechargement automatique pour achat');
          console.log('Account credited successfully');
          
          // Mettre à jour le solde affiché
          const newBalance = await getUserBalance(user.id);
          setBalance(newBalance);
          
          toast.success(`Compte rechargé de ${requiredAmount.toLocaleString()} MAD`);
        } catch (error) {
          console.error('Error crediting account:', error);
          toast.error('Erreur lors du rechargement automatique');
          return;
        }
      }
      
      // Récupérer l'ID de campagne depuis le localStorage si disponible
      const campaignId = localStorage.getItem('current_campaign_id');
      
      // Traiter chaque achat
      for (const item of cartItems) {
        const isVirtualLink = item.isVirtual || false;
        
        // Déterminer l'ID de l'éditeur et l'ID du listing
        let publisherId: string;
        let listingId: string;
        
        if (isVirtualLink) {
          // Pour les nouveaux articles, récupérer le publisher_id du website
          // L'ID du listing pour les nouveaux articles est "new-{website_id}"
          const websiteId = item.listing.id.replace('new-', '');
          
          const { data: website, error: websiteError } = await supabase
            .from('websites')
            .select('user_id')
            .eq('id', websiteId)
            .single();
          
          if (websiteError) {
            console.error('Error fetching website owner:', websiteError);
            toast.error('Erreur lors de la récupération du propriétaire du website');
            return;
          }
          
          publisherId = website.user_id;
          // Pour les nouveaux articles, utiliser l'ID du website comme référence
          listingId = websiteId;
        } else {
          // Pour les articles existants, utiliser le publisher_id du listing
          if (!item.listing.user_id) {
            console.error('Missing publisher ID for link:', item.listing.id);
            toast.error('Erreur: Informations d\'éditeur manquantes. Veuillez rafraîchir la page.');
            return;
          }
          
          publisherId = item.listing.user_id;
          listingId = item.listing.id;
        }
        
        // Vérifier si une demande d'achat existe déjà pour ce lien et cette URL
        const { data: existingRequest, error: checkError } = await supabase
          .from('link_purchase_requests')
          .select('id')
          .eq('link_listing_id', listingId)
          .eq('user_id', user.id)
          .eq('target_url', item.targetUrl)
          .eq('status', 'pending')
          .single();

        if (existingRequest) {
          console.log(`⚠️ Demande d'achat déjà existante pour ce lien: ${listingId}`);
          continue; // Passer au prochain item
        }
        
        console.log('Processing purchase for link:', {
          linkId: listingId,
          publisherId: publisherId,
          price: item.listing.price,
          quantity: item.quantity,
          totalPrice: item.listing.price * item.quantity,
          isVirtual: isVirtualLink
        });
        
        // Créer la demande d'achat (même logique pour tous les types)
        try {
          const purchaseRequest = await createLinkPurchaseRequest({
            link_listing_id: listingId,
            user_id: user.id,
            publisher_id: publisherId,
            target_url: item.targetUrl,
            anchor_text: item.anchorText,
            message: item.message,
            custom_content: item.customContent,
            content_option: item.contentOption,
            proposed_price: (item.listing.price + (item.isVirtual && item.contentOption === 'platform' ? (item.platformContentPrice || 0) : 0)) * item.quantity,
            proposed_duration: 1,
            campaign_id: campaignId || undefined
          });

          console.log(`Demande d'achat créée pour: ${item.listing.title} - ID: ${purchaseRequest.id}`);

          results.push({
            success: true,
            item: item.listing.title,
            requestId: purchaseRequest.id
          });
        } catch (error) {
          console.error('Error creating purchase request:', error);
          results.push({
            success: false,
            item: item.listing.title,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      // Traiter les résultats
      const successfulPurchases = results.filter(r => r.success);
      const failedPurchases = results.filter(r => !r.success);

      if (successfulPurchases.length > 0) {
        console.log(`${successfulPurchases.length} achat(s) traité(s) avec succès`);
      }

      if (failedPurchases.length > 0) {
        console.error(`${failedPurchases.length} achat(s) échoué(s):`, failedPurchases);
        toast.error(`${failedPurchases.length} achat(s) ont échoué. Vérifiez les détails.`);
      }

      if (successfulPurchases.length === 0 && failedPurchases.length > 0) {
        throw new Error('Tous les achats ont échoué');
      }

      
      // Mettre à jour le statut de la campagne
      if (campaignId) {
        try {
          // Mettre à jour le statut de la campagne en "active" directement via Supabase
          const { error: campaignError } = await supabase
            .from('campaigns')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', campaignId);
          
          if (campaignError) {
            console.error('Error updating campaign status:', campaignError);
          } else {
            console.log('Campaign status updated to approved');
          }
          
          toast.success('Campagne activée avec succès !');
        } catch (error) {
          console.error('Error updating campaign status:', error);
          toast.error('Achats traités mais erreur lors de l\'activation de la campagne');
        }
      }

      // Recharger le solde
      const newBalance = await getUserBalance(user.id);
      setBalance(newBalance);
      
      // Sauvegarder les données avant de vider le panier
      const cartItemsCount = cartItems.length;
      const finalTotal = total;
      
      // Envoyer l'email de confirmation de commande AVANT de vider le panier
      try {
        // Import dynamique avec gestion d'erreur améliorée
          const emailModule = await import('../../utils/emailServiceClient');
        const { emailServiceClient } = emailModule;
        
        await emailServiceClient.sendTemplateEmail(
          'ADVERTISER_ORDER_PLACED',
          user.email,
          {
            user_name: user.user_metadata?.name || user.email,
            order_id: `CART-${Date.now()}`,
            total_amount: finalTotal,
            sites_count: cartItemsCount,
            dashboard_url: `${window.location.origin}/dashboard`
          },
          ['order_placed', 'advertiser', 'confirmation']
        );
      } catch (emailError) {
        console.error('Erreur envoi email commande:', emailError);
        // Ne pas bloquer le processus si l'email échoue
      }
      
      // Vider le panier et nettoyer les données de campagne APRÈS l'envoi de l'email
      setCartItems([]);
      localStorage.removeItem('cart');
      localStorage.removeItem('quick-buy-cart');
      localStorage.removeItem('current_campaign_id');

      toast.success('Achats traités avec succès ! Email de confirmation envoyé.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error processing purchases:', error);
      toast.error('Erreur lors du traitement des achats');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h2>
            <p className="text-gray-600 mb-6">
              Ajoutez des liens à votre panier pour commencer vos achats
            </p>
            <Link
              to="/liens"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explorer les liens</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const hasInsufficientBalance = balance < total;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panier</h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier
            </p>
          </div>
          <Link
            to="/liens"
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continuer les achats</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des articles */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={`${item.listing.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.listing.title}
                      </h3>
                      {item.isVirtual && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nouveau lien
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.listing.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Prix: {item.listing.price.toLocaleString()} MAD</span>
                      <span>Type: {item.listing.link_type}</span>
                      <span>Position: {item.listing.position}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Détails de l'achat */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL cible *
                    </label>
                    <input
                      type="url"
                      value={item.targetUrl}
                      onChange={(e) => updateItemDetails(index, 'targetUrl', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://votre-site.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Texte d'ancrage *
                    </label>
                    <input
                      type="text"
                      value={item.anchorText}
                      onChange={(e) => updateItemDetails(index, 'anchorText', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre texte d'ancrage"
                    />
                  </div>

                  {/* Options de contenu pour les nouveaux articles */}
                  {item.isVirtual && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Options de contenu</h4>
                      
                      <div className="space-y-3">
                        {/* Option 1: Rédaction par la plateforme */}
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={`platform-${index}`}
                            name={`content-option-${index}`}
                            checked={item.contentOption === 'platform'}
                            onChange={() => updateContentOption(index, 'platform')}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="flex-1">
                            <label htmlFor={`platform-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                              Rédaction par la plateforme
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Article de 800 mots rédigé par nos rédacteurs professionnels
                            </p>
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              +250 MAD par article
                            </p>
                          </div>
                        </div>

                        {/* Option 2: Contenu personnalisé */}
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={`custom-${index}`}
                            name={`content-option-${index}`}
                            checked={item.contentOption === 'custom'}
                            onChange={() => updateContentOption(index, 'custom')}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="flex-1">
                            <label htmlFor={`custom-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                              Fournir mon propre contenu
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Vous rédigez l'article vous-même
                            </p>
                          </div>
                        </div>

                        {/* Champ de contenu personnalisé */}
                        {item.contentOption === 'custom' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Votre contenu *
                            </label>
                            <RichTextEditor
                              value={item.customContent || ''}
                              onChange={(content) => updateContentOption(index, 'custom', content)}
                              placeholder="Rédigez votre article ici (minimum 300 mots recommandé)..."
                              rows={6}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Longueur actuelle: {(item.customContent || '').replace(/<[^>]*>/g, '').length} caractères
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 border border-gray-300 rounded">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {(item.listing.price * item.quantity).toLocaleString()} MAD
                        {item.isVirtual && item.contentOption === 'platform' && (
                          <span className="text-sm text-green-600 ml-2">
                            +{(item.platformContentPrice || 0) * item.quantity} MAD (rédaction)
                          </span>
                        )}
                      </p>
                      {item.isVirtual && item.contentOption === 'platform' && (
                        <p className="text-sm text-gray-500">
                          Total: {((item.listing.price + (item.platformContentPrice || 0)) * item.quantity).toLocaleString()} MAD
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Résumé de commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé de commande</h2>
              
              {/* Solde actuel */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Solde actuel</span>
                  <span className="font-semibold text-gray-900">{balance.toLocaleString()} MAD</span>
                </div>
              </div>

              {/* Détails */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{total.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Commission plateforme (10%)</span>
                  <span>{(total * 0.1).toLocaleString()} MAD</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{total.toLocaleString()} MAD</span>
                  </div>
                </div>
              </div>

              {/* Avertissement solde insuffisant */}
              {hasInsufficientBalance && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Solde insuffisant. Il vous manque {(total - balance).toLocaleString()} MAD
                    </span>
                  </div>
                </div>
              )}

              {/* Bouton de paiement */}
              <button
                onClick={handleCheckout}
                disabled={processing || cartItems.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  hasInsufficientBalance
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    {hasInsufficientBalance ? (
                      <>
                        <Wallet className="h-4 w-4" />
                        <span>Recharger le compte</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Procéder au paiement</span>
                      </>
                    )}
                  </>
                )}
              </button>

              {/* Informations supplémentaires */}
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>• Paiement sécurisé par crédit</p>
                <p>• Commission plateforme de 10%</p>
                <p>• Demande envoyée à l'éditeur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 