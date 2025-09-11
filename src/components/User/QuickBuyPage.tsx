import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Plus, 
  Minus,
  Eye,
  Globe,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, LinkOpportunity } from '../../types';
import { 
  getLinkRecommendations, 
  getCurrentUser, 
  getUserBalance,
  createLinkPurchaseRequest,
  createCreditTransaction,
  createNotification,
  supabase
} from '../../lib/supabase';
import toast from 'react-hot-toast';

interface QuickBuyItem {
  listing: LinkOpportunity;
  quantity: number;
  anchorText: string;
  targetUrl: string;
  isVirtual?: boolean;
  contentOption?: 'platform' | 'custom';
  customContent?: string;
  platformContentPrice?: number;
}

const QuickBuyPage: React.FC = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<LinkOpportunity[]>([]);
  const [cartItems, setCartItems] = useState<QuickBuyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);
      const userBalance = await getUserBalance(currentUser.id);
      setBalance(userBalance);

      // Charger les opportunités de liens (sans campaignId pour l'achat rapide)
      const recommendations = await getLinkRecommendations('quick-buy');
      console.log('Recommendations received:', recommendations);
      console.log('Type of recommendations:', typeof recommendations);
      
      // Extraire les opportunités du résultat
      if (recommendations) {
        const existingArticles = recommendations.existing_articles || [];
        const newArticles = recommendations.new_articles || [];
        
        // Dédupliquer les opportunités par ID pour éviter les clés dupliquées
        const allOpportunities = [...existingArticles, ...newArticles];
        const uniqueOpportunities = allOpportunities.filter((opportunity, index, self) => 
          index === self.findIndex(o => o.id === opportunity.id)
        );
        
        console.log('Existing articles:', existingArticles.length);
        console.log('New articles:', newArticles.length);
        console.log('Total before deduplication:', allOpportunities.length);
        console.log('Total after deduplication:', uniqueOpportunities.length);
        
        setOpportunities(uniqueOpportunities);
      } else {
        console.warn('No recommendations received, setting empty array');
        setOpportunities([]);
      }

      // Charger le panier depuis localStorage
      const savedCart = localStorage.getItem('quick-buy-cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = Array.isArray(opportunities) ? opportunities.filter(opportunity => {
    const matchesSearch = opportunity.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (opportunity.existing_article?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.site_url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || opportunity.theme === selectedCategory;
    
    const matchesType = selectedType === 'all' || 
                       (selectedType === 'existing' && opportunity.type === 'existing_article') ||
                       (selectedType === 'new' && opportunity.type === 'new_article');
    
    const matchesPrice = opportunity.price >= priceRange.min && opportunity.price <= priceRange.max;
    
    return matchesSearch && matchesCategory && matchesType && matchesPrice;
  }) : [];

  const addToCart = (listing: LinkOpportunity) => {
    const isVirtual = listing.type === 'new_article';
    const newItem: QuickBuyItem = {
      listing,
      quantity: 1,
      anchorText: '',
      targetUrl: '',
      isVirtual,
      contentOption: isVirtual ? 'platform' : undefined,
      platformContentPrice: isVirtual ? 250 : 0
    };

    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedCart));
    toast.success('Article ajouté au panier');
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedCart));
    toast.success('Article supprimé du panier');
  };

  const updateCartItem = (index: number, field: string, value: any) => {
    const updatedCart = [...cartItems];
    updatedCart[index] = { ...updatedCart[index], [field]: value };
    setCartItems(updatedCart);
    localStorage.setItem('quick-buy-cart', JSON.stringify(updatedCart));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItem(index, 'quantity', newQuantity);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.listing.price * item.quantity;
      const contentPrice = (item.isVirtual && item.contentOption === 'platform') ? (item.platformContentPrice || 0) * item.quantity : 0;
      return total + basePrice + contentPrice;
    }, 0);
  };

  const processQuickBuy = async () => {
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    // Validation des champs requis
    for (const item of cartItems) {
      if (!item.anchorText.trim() || !item.targetUrl.trim()) {
        toast.error('Veuillez remplir tous les champs requis (URL cible et texte d\'ancrage)');
        return;
      }
      if (item.isVirtual && !item.contentOption) {
        toast.error('Veuillez sélectionner une option de contenu pour tous les nouveaux articles');
        return;
      }
      if (item.isVirtual && item.contentOption === 'custom' && (!item.customContent || item.customContent.trim().length < 100)) {
        toast.error('Le contenu personnalisé doit contenir au moins 100 caractères');
        return;
      }
    }

    const totalAmount = calculateTotal();
    if (balance < totalAmount) {
      toast.error(`Solde insuffisant. Solde actuel: ${balance} MAD, Total requis: ${totalAmount} MAD`);
      return;
    }

    setProcessing(true);

    try {
      for (const item of cartItems) {
        const isVirtualLink = item.isVirtual;
        let publisherId: string;
        let listingId: string;

        if (isVirtualLink) {
          // Pour les nouveaux articles, récupérer le publisher_id du website
          const { data: website, error: websiteError } = await supabase
            .from('websites')
            .select('user_id')
            .eq('id', item.listing.id)
            .single();
          
          if (websiteError) {
            console.error('Error fetching website owner:', websiteError);
            throw new Error('Erreur lors de la récupération du propriétaire du website');
          }
          
          publisherId = website.user_id;
          // Pour les nouveaux articles, ne pas créer de link_listing
          // Utiliser directement l'ID du website comme référence
          listingId = item.listing.id;
        } else {
          // Pour les articles existants, récupérer le publisher_id du listing
          const { data: existingListing } = await supabase
            .from('link_listings')
            .select('user_id')
            .eq('id', item.listing.id)
            .single();
          
          publisherId = existingListing?.user_id || 'db521baa-5713-496f-84f2-4a635b9e54a4';
          listingId = item.listing.id;
        }

        // Créer la demande d'achat
        const purchaseRequest = await createLinkPurchaseRequest({
          link_listing_id: listingId, // Utiliser l'ID du listing (nouveau ou existant)
          user_id: user.id,
          publisher_id: publisherId,
          target_url: item.targetUrl,
          anchor_text: item.anchorText,
          proposed_price: (item.listing.price + (item.isVirtual && item.contentOption === 'platform' ? (item.platformContentPrice || 0) : 0)) * item.quantity,
          proposed_duration: 1
        });

        // Créer la transaction de crédit
        await createCreditTransaction({
          user_id: user.id,
          type: 'purchase',
          amount: (item.listing.price + (item.isVirtual && item.contentOption === 'platform' ? (item.platformContentPrice || 0) : 0)) * item.quantity,
          description: `Achat rapide: ${item.listing.title}`,
          payment_method: 'manual',
          related_purchase_request_id: purchaseRequest.id
        });

        // Créer une notification pour l'éditeur
        await createNotification({
          user_id: publisherId,
          title: 'Nouvelle demande d\'achat',
          message: `Demande d'achat pour "${item.listing.title}" de ${user.email}`,
          type: 'info', // Type valide selon la contrainte CHECK
          action_url: `/dashboard/purchase-requests`,
          action_type: 'link_purchase'
        });
      }

      // Vider le panier
      setCartItems([]);
      localStorage.removeItem('quick-buy-cart');
      
      // Mettre à jour le solde
      const newBalance = await getUserBalance(user.id);
      setBalance(newBalance);

      toast.success('Achat rapide effectué avec succès !');
      navigate('/dashboard/purchase-requests');
    } catch (error) {
      console.error('Error processing quick buy:', error);
      toast.error('Erreur lors du traitement de l\'achat');
    } finally {
      setProcessing(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(Array.isArray(opportunities) ? opportunities.map(o => o.theme) : []))];
  const types = [
    { value: 'all', label: 'Tous' },
    { value: 'existing', label: 'Articles existants' },
    { value: 'new', label: 'Nouveaux articles' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Zap className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Achat Rapide</h1>
        </div>
        <p className="text-gray-600">Achetez des liens directement sans créer de campagne</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtres et recherche */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher des liens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Toutes catégories' : category}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plage de prix */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plage de prix: {priceRange.min} - {priceRange.max} MAD
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Liste des opportunités */}
          <div className="space-y-4">
            {filteredOpportunities.map((opportunity) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{opportunity.site_name}</h3>
                      {opportunity.type === 'new_article' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">
                      {opportunity.existing_article?.title || 'Nouvel article à créer'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {opportunity.theme}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                        {opportunity.site_url}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                        {opportunity.type === 'existing_article' ? 'Article existant' : 'Nouvel article'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      {opportunity.price.toLocaleString()} MAD
                    </p>
                    <button
                      onClick={() => addToCart(opportunity)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Panier */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Panier</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {cartItems.length}
              </span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Votre panier est vide</p>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{item.listing.site_name}</h4>
                    
                    {/* Champs requis */}
                    <div className="space-y-2 mb-3">
                      <input
                        type="url"
                        placeholder="URL cible *"
                        value={item.targetUrl}
                        onChange={(e) => updateCartItem(index, 'targetUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Texte d'ancrage *"
                        value={item.anchorText}
                        onChange={(e) => updateCartItem(index, 'anchorText', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Options de contenu pour nouveaux articles */}
                    {item.isVirtual && (
                      <div className="mb-3">
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={item.contentOption === 'platform'}
                              onChange={() => updateCartItem(index, 'contentOption', 'platform')}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm">Rédaction plateforme (+250 MAD)</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={item.contentOption === 'custom'}
                              onChange={() => updateCartItem(index, 'contentOption', 'custom')}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm">Contenu personnalisé</span>
                          </label>
                        </div>
                        
                        {item.contentOption === 'custom' && (
                          <textarea
                            value={item.customContent || ''}
                            onChange={(e) => updateCartItem(index, 'customContent', e.target.value)}
                            placeholder="Votre contenu..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    )}

                    {/* Quantité et prix */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {((item.listing.price + (item.isVirtual && item.contentOption === 'platform' ? 250 : 0)) * item.quantity).toLocaleString()} MAD
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(index)}
                      className="w-full mt-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}

                {/* Total et bouton d'achat */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      {calculateTotal().toLocaleString()} MAD
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    Solde disponible: {balance.toLocaleString()} MAD
                  </div>

                  <button
                    onClick={processQuickBuy}
                    disabled={processing || cartItems.length === 0}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Traitement...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Achat Rapide</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBuyPage;
