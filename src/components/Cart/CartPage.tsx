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

interface CartItem {
  listing: LinkListing;
  quantity: number;
  anchorText: string;
  targetUrl: string;
  isVirtual?: boolean;
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
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        
        // Nettoyer le panier des liens invalides (mais garder les liens virtuels)
        const validCartItems = cartItems.filter((item: any) => {
          const isValid = item.listing && 
                         item.listing.id && 
                         item.listing.user_id;
          
          if (!isValid) {
            console.log('Removing invalid cart item:', item.listing?.id);
          }
          
          return isValid;
        });
        
        // Mettre à jour le localStorage si des éléments ont été supprimés
        if (validCartItems.length !== cartItems.length) {
          localStorage.setItem('cart', JSON.stringify(validCartItems));
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
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const removeItem = (index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    toast.success('Article supprimé du panier');
  };

  const updateItemDetails = (index: number, field: 'anchorText' | 'targetUrl', value: string) => {
    const updatedItems = [...cartItems];
    updatedItems[index][field] = value;
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.listing.price * item.quantity);
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    // Procéder directement au paiement
    await processPurchases();
  };

  const processPurchases = async () => {
    try {
      setProcessing(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

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
        // Vérifier que l'ID de l'éditeur est valide
        if (!item.listing.user_id) {
          console.error('Missing publisher ID for link:', item.listing.id);
          toast.error('Erreur: Informations d\'éditeur manquantes. Veuillez rafraîchir la page.');
          return;
        }
        
        const isVirtualLink = item.isVirtual || false;
        
        // Vérifier si une demande d'achat existe déjà pour ce lien et cette URL
        const { data: existingRequest, error: checkError } = await supabase
          .from('link_purchase_requests')
          .select('id')
          .eq('link_listing_id', item.listing.id)
          .eq('user_id', user.id)
          .eq('target_url', item.targetUrl)
          .eq('status', 'pending')
          .single();

        if (existingRequest) {
          console.log(`⚠️ Demande d'achat déjà existante pour ce lien: ${item.listing.id}`);
          continue; // Passer au prochain item
        }
        
        console.log('Processing purchase for link:', {
          linkId: item.listing.id,
          publisherId: item.listing.user_id,
          price: item.listing.price,
          quantity: item.quantity,
          totalPrice: item.listing.price * item.quantity,
          isVirtual: isVirtualLink
        });
        
        if (isVirtualLink) {
          // Pour les nouveaux articles, vérifier d'abord si le listing existe
          try {
            let listingToUse;
            
            // Vérifier si un listing avec cet ID existe déjà
            const { data: existingListing, error: existingError } = await supabase
              .from('link_listings')
              .select('*')
              .eq('id', item.listing.id)
              .single();

            if (existingError && existingError.code !== 'PGRST116') {
              console.error('Error checking existing listing:', existingError);
              throw new Error('Erreur lors de la vérification du listing existant');
            }

            if (existingListing) {
              // Le listing existe déjà, l'utiliser
              console.log('Using existing link listing:', existingListing.id);
              listingToUse = existingListing;
            } else {
              // Le listing n'existe pas, le créer
              console.log('Creating new link listing for new article');
              
              // Récupérer le vrai propriétaire du website
              const { data: website, error: websiteError } = await supabase
                .from('websites')
                .select('user_id')
                .eq('id', item.listing.id)
                .single();
              
              if (websiteError) {
                console.error('Error fetching website owner:', websiteError);
                throw new Error('Erreur lors de la récupération du propriétaire du website');
              }
              
              console.log('Website owner found:', website.user_id);
              
              const { data: newListing, error: listingError } = await supabase
                .from('link_listings')
                .insert([{
                  id: item.listing.id, // Utiliser l'ID du website (UUID valide)
                  title: item.listing.title,
                  description: item.listing.description,
                  target_url: item.targetUrl, // Corrigé: target_url au lieu de url
                  price: item.listing.price,
                  currency: item.listing.currency || 'MAD',
                  link_type: 'dofollow',
                  position: 'content',
                  minimum_contract_duration: 1,
                  max_links_per_page: 1, // Ajout du champ requis
                  allowed_niches: [item.listing.category || 'General'],
                  forbidden_keywords: [],
                  content_requirements: '', // Ajout du champ requis
                  status: 'active',
                  user_id: website.user_id, // Utiliser le vrai propriétaire du website
                  website_id: item.listing.id,
                  anchor_text: item.anchorText,
                  meta_title: item.listing.title,
                  meta_description: `Nouveau lien sur ${item.listing.title}`,
                  slug: item.listing.id,
                  images: [],
                  tags: [item.listing.category || 'General'],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }])
                .select()
                .single();

              if (listingError) {
                console.error('Error creating link listing:', listingError);
                throw new Error('Erreur lors de la création du listing');
              }

              console.log('Link listing created for new article:', newListing.id);
              listingToUse = newListing;
            }

            // Maintenant créer la demande d'achat avec le vrai link_listing_id
            const purchaseRequest = await createLinkPurchaseRequest({
              link_listing_id: listingToUse.id,
              user_id: user.id,
              publisher_id: listingToUse.user_id,
              target_url: item.targetUrl,
              anchor_text: item.anchorText,
              proposed_price: item.listing.price * item.quantity,
              proposed_duration: 1,
              campaign_id: campaignId || undefined
            });

            // Créer la transaction de crédit
            await createCreditTransaction({
              user_id: user.id,
              type: 'purchase',
              amount: item.listing.price * item.quantity,
              description: `Achat de nouveau lien: ${item.listing.title}`,
              payment_method: 'manual',
              related_purchase_request_id: purchaseRequest.id
            });

            console.log('New article purchase processed successfully');
          } catch (error) {
            console.error('Error processing new article purchase:', error);
            throw new Error('Erreur lors du traitement du nouveau article');
          }
        } else {
          // Pour les liens existants, vérifier s'il s'agit d'un vrai lien ou d'une opportunité simulée
          // Vérifier que l'ID du lien est valide
          if (!item.listing.id) {
            console.error('Invalid link listing ID:', item.listing.id);
            toast.error('Erreur: ID de lien invalide. Veuillez rafraîchir la page.');
            return;
          }
          
          
          console.log('Debug - item.listing.user_id:', item.listing.user_id);
          console.log('Debug - campaignId:', campaignId);
          
          try {
            // Vérifier si c'est un vrai lien ou une opportunité simulée
            // Les opportunités simulées ont le même ID pour user_id et id
            const isSimulatedOpportunity = item.listing.user_id === item.listing.id;
            
            console.log('Debug - isSimulatedOpportunity:', isSimulatedOpportunity);
            console.log('Debug - item.isVirtual:', item.isVirtual);
            console.log('Debug - item.listing.id:', item.listing.id);
            
            if (!isSimulatedOpportunity && !item.isVirtual) {
              // C'est un vrai lien existant, créer une LinkPurchaseRequest
              console.log('Creating LinkPurchaseRequest for real link');
              
              // Récupérer le vrai propriétaire du listing depuis la base de données
              const { data: listing, error: listingError } = await supabase
                .from('link_listings')
                .select('user_id')
                .eq('id', item.listing.id)
                .single();
              
              if (listingError) {
                console.error('Error fetching listing owner:', listingError);
                throw new Error('Erreur lors de la récupération du propriétaire du listing');
              }
              
              const publisherId = listing.user_id; // Utiliser le vrai propriétaire
              
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
              
              // Créer la transaction de crédit
              await createCreditTransaction({
                user_id: user.id,
                type: 'purchase',
                amount: item.listing.price * item.quantity,
                description: `Achat de lien: ${item.listing.title}`,
                payment_method: 'manual',
                related_purchase_request_id: purchaseRequest.id
              });
              
              // Créer une notification pour l'éditeur
              await createNotification({
                user_id: publisherId,
                title: 'Nouvelle demande de lien reçue',
                message: `Vous avez reçu une nouvelle demande d'achat de lien pour "${item.listing.title}" de la part d'un annonceur.`,
                type: 'info',
                action_url: `/dashboard/purchase-requests`,
                action_type: 'link_purchase'
              });
              
              console.log('LinkPurchaseRequest, CreditTransaction and Notification created successfully');
            } else {
              // C'est une opportunité simulée, créer seulement la transaction de crédit
              console.log('Creating CreditTransaction for simulated opportunity');
              
              await createCreditTransaction({
                user_id: user.id,
                type: 'purchase',
                amount: item.listing.price * item.quantity,
                description: `Achat d'opportunité: ${item.listing.title}`,
                payment_method: 'manual'
              });
              
              console.log('CreditTransaction created successfully for opportunity');
            }
          } catch (error) {
            console.error('Error processing link purchase:', error);
            throw new Error('Erreur lors du traitement de l\'achat de lien');
          }
        }
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
      
      // Vider le panier et nettoyer les données de campagne
      setCartItems([]);
      localStorage.removeItem('cart');
      localStorage.removeItem('current_campaign_id');

      toast.success('Achats traités avec succès !');
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
                      </p>
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