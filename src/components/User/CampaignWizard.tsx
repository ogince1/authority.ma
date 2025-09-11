import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Globe, 
  Search,
  AlertCircle,
  CheckCircle,
  Loader,
  ShoppingCart,
  Eye,
  Target,
  Award,
  TrendingUp,
  Clock,
  ExternalLink,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateCampaignData, LinkOpportunity, LinkQualityType } from '../../types';
import { createCampaign, analyzeURL, getLinkRecommendations } from '../../lib/supabase';
import toast from 'react-hot-toast';

const CampaignWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateCampaignData>({
    name: '',
    urls: [''],
    language: 'Français'
  });
  const [analysisResults, setAnalysisResults] = React.useState<any[]>([]);
  const [createdCampaignId, setCreatedCampaignId] = React.useState<string | null>(null);
  const [recommendations, setRecommendations] = React.useState<any>(null);
  const [filters, setFilters] = React.useState({
    price_min: '',
    price_max: '',
    dr_min: '',
    tf_min: '',
    type: '',
    ps_min: ''
  });
  const [searchTerm, setSearchTerm] = React.useState('');
  const [cartIds, setCartIds] = React.useState<string[]>([]);
  const [expandedWebsites, setExpandedWebsites] = React.useState<Set<string>>(new Set());

  // Charger les IDs du panier au montage
  React.useEffect(() => {
    const currentCart = localStorage.getItem('cart');
    const cartItems = currentCart ? JSON.parse(currentCart) : [];
    setCartIds(cartItems.map((item: any) => item.listing?.id));
    
    const updateCart = () => {
      const updatedCart = localStorage.getItem('cart');
      const updatedItems = updatedCart ? JSON.parse(updatedCart) : [];
      setCartIds(updatedItems.map((item: any) => item.listing?.id));
    };
    window.addEventListener('storage', updateCart);
    return () => window.removeEventListener('storage', updateCart);
  }, []);

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData({ ...formData, urls: newUrls });
  };

  const addUrl = () => {
    setFormData({ ...formData, urls: [...formData.urls, ''] });
  };

  const removeUrl = (index: number) => {
    if (formData.urls.length > 1) {
      const newUrls = formData.urls.filter((_, i) => i !== index);
      setFormData({ ...formData, urls: newUrls });
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom de campagne');
      return;
    }

    if (!formData.urls.some(url => url.trim())) {
      toast.error('Veuillez saisir au moins une URL');
      return;
    }

    setAnalyzing(true);
    try {
      // Créer la campagne
      const campaign = await createCampaign({
        ...formData,
        budget: 0 // Budget par défaut
      });
      
      setCreatedCampaignId(campaign.id);
      
      // Sauvegarder l'ID de campagne dans localStorage pour le panier
      localStorage.setItem('current_campaign_id', campaign.id);

      // Analyser les URLs
      const analyses = await Promise.all(
        formData.urls.filter(url => url.trim()).map(url => analyzeURL(url.trim()))
      );
      setAnalysisResults(analyses);

      // Récupérer les recommandations de liens
      try {
        const recommendationsData = await getLinkRecommendations(campaign.id, {});
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast.error('Erreur lors du chargement des recommandations');
      }

      setCurrentStep(2);
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erreur lors de la création de la campagne');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const getQualityBadge = (type: LinkQualityType) => {
    const config = {
      bronze: { color: 'bg-amber-100 text-amber-800', icon: '🥉' },
      silver: { color: 'bg-gray-100 text-gray-800', icon: '🥈' },
      gold: { color: 'bg-yellow-100 text-yellow-800', icon: '🥇' }
    };

    const configItem = config[type];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <span className="mr-1">{configItem.icon}</span>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getProximityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrustFlowColor = (tf: number) => {
    if (tf >= 40) return 'bg-green-100 text-green-800';
    if (tf >= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAddToCart = (opportunity: LinkOpportunity, type: 'existing' | 'new') => {
    try {
      const listing: any = {
        id: opportunity.id,
        title: type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name,
        target_url: type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url,
        price: opportunity.price,
        currency: opportunity.currency || 'MAD',
        link_type: 'dofollow' as any,
        position: 'content' as any,
        minimum_contract_duration: 1,
        status: 'active',
        user_id: 'db521baa-5713-496f-84f2-4a635b9e54a4',
        website_id: opportunity.id,
        description: type === 'existing' 
          ? `Lien existant - ${opportunity.site_name}`
          : `Nouveau lien - ${opportunity.site_name}`,
        anchor_text: '',
        meta_title: opportunity.site_name,
        meta_description: `Lien de qualité ${opportunity.quality_type} sur ${opportunity.site_name}`,
        slug: opportunity.id,
        images: [],
        tags: [opportunity.theme, opportunity.quality_type],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const currentCart = localStorage.getItem('cart');
      const cartItems = currentCart ? JSON.parse(currentCart) : [];

      const existingItemIndex = cartItems.findIndex((item: any) => item.listing?.id === opportunity.id);
      
      if (existingItemIndex >= 0) {
        cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
        toast.success('Quantité mise à jour dans le panier !');
      } else {
        cartItems.push({
          listing: listing,
          quantity: 1,
          anchorText: '',
          targetUrl: listing.target_url,
          isVirtual: type === 'new'
        });
        toast.success('Ajouté au panier !');
      }

      localStorage.setItem('cart', JSON.stringify(cartItems));
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  const filterOpportunities = (opportunities: LinkOpportunity[], type: 'existing' | 'new') => {
    return opportunities.filter(opportunity => {
      if (filters.price_min && opportunity.price < parseFloat(filters.price_min)) return false;
      if (filters.price_max && opportunity.price > parseFloat(filters.price_max)) return false;
      if (filters.dr_min && (opportunity.site_metrics.dr || 0) < parseFloat(filters.dr_min)) return false;
      if (filters.tf_min && (opportunity.site_metrics.tf || 0) < parseFloat(filters.tf_min)) return false;
      if (filters.ps_min && (opportunity.site_metrics.ps || 0) < parseFloat(filters.ps_min)) return false;
      if (filters.type && opportunity.quality_type !== filters.type) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const title = type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name;
        const url = type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url;
        const theme = opportunity.theme;
        
        if (!title?.toLowerCase().includes(searchLower) && 
            !url?.toLowerCase().includes(searchLower) && 
            !theme?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Organiser toutes les opportunités par site web (grouper par URL pour éviter les doublons)
  const organizeAllOpportunitiesByWebsite = () => {
    if (!recommendations) return {};
    
    const allOpportunities = [
      ...(recommendations.existing_articles || []),
      ...(recommendations.new_articles || [])
    ];
    
    const filtered = allOpportunities.filter(opportunity => {
      if (filters.price_min && opportunity.price < parseFloat(filters.price_min)) return false;
      if (filters.price_max && opportunity.price > parseFloat(filters.price_max)) return false;
      if (filters.dr_min && (opportunity.site_metrics.dr || 0) < parseFloat(filters.dr_min)) return false;
      if (filters.tf_min && (opportunity.site_metrics.tf || 0) < parseFloat(filters.tf_min)) return false;
      if (filters.ps_min && (opportunity.site_metrics.ps || 0) < parseFloat(filters.ps_min)) return false;
      if (filters.type && opportunity.quality_type !== filters.type) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const title = opportunity.existing_article?.title || opportunity.site_name;
        const url = opportunity.existing_article?.url || opportunity.site_url;
        const theme = opportunity.theme;
        
        if (!title?.toLowerCase().includes(searchLower) && 
            !url?.toLowerCase().includes(searchLower) && 
            !theme?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered.reduce((acc, opportunity) => {
      // Utiliser l'URL comme clé pour grouper correctement
      const websiteKey = opportunity.site_url;
      
      if (!acc[websiteKey]) {
        // Extraire le nom du site sans "(Nouveau)" pour l'affichage
        const cleanSiteName = opportunity.site_name.replace(/\s*\(Nouveau\)\s*$/, '');
        
        acc[websiteKey] = {
          website: {
            name: cleanSiteName,
            url: opportunity.site_url,
            category: opportunity.theme,
            tf: opportunity.site_metrics.tf || 0,
            cf: opportunity.site_metrics.cf || 0
          },
          existingArticles: [],
          newArticle: null
        };
      }
      
      if (opportunity.existing_article) {
        acc[websiteKey].existingArticles.push(opportunity);
      } else if (!acc[websiteKey].newArticle) {
        acc[websiteKey].newArticle = opportunity;
      }
      
      return acc;
    }, {} as Record<string, {
      website: {
        name: string;
        url: string;
        category: string;
        tf: number;
        cf: number;
      };
      existingArticles: LinkOpportunity[];
      newArticle: LinkOpportunity | null;
    }>);
  };

  const toggleWebsiteExpansion = (websiteUrl: string) => {
    const newExpanded = new Set(expandedWebsites);
    if (newExpanded.has(websiteUrl)) {
      newExpanded.delete(websiteUrl);
    } else {
      newExpanded.add(websiteUrl);
    }
    setExpandedWebsites(newExpanded);
  };

  const OpportunityRow: React.FC<{ opportunity: LinkOpportunity; type: 'existing' | 'new' }> = ({ opportunity, type }) => {
    const isInCart = cartIds.includes(opportunity.id);
    return (
      <tr className={`border-b border-gray-200 ${isInCart ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
        <td className="px-4 py-3 text-sm">
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">
              {type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrustFlowColor(opportunity.site_metrics.tf || 0)}`}>
            {opportunity.site_metrics.tf || 0}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {opportunity.site_name}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {opportunity.theme}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {opportunity.price} MAD
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={() => handleAddToCart(opportunity, type)}
              className={`text-blue-600 hover:text-blue-800 ${isInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isInCart}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const steps = [
    { id: 1, name: 'Informations de base', description: 'Nom et URL à travailler' },
    { id: 2, name: 'Achat de liens sponsorisés', description: 'Sélectionnez vos liens' },
    { id: 3, name: 'Récapitulatif', description: 'Vérifiez votre commande' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/campaigns')}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouvelle Campagne</h1>
              <p className="text-gray-600 mt-1">
                Créez une nouvelle campagne de liens sponsorisés
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="flex items-center">
                    <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      currentStep >= step.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div className="ml-4 min-w-0">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Nom de la campagne */}
              <div>
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la campagne
                </label>
                <input
                  type="text"
                  id="campaignName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Campagne SEO E-commerce"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL à travailler
                </label>
                <div className="space-y-3">
                  {formData.urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={index === 0}
                      />
                      {formData.urls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrl(index)}
                          className="px-3 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addUrl}
                    className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Ajouter une autre URL
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="inline-flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      Analyser et continuer
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Achat de liens sponsorisés</h2>
                <p className="text-gray-600">
                  Sélectionnez les liens que vous souhaitez acheter pour votre campagne
                </p>
              </div>
            </div>

            {/* Statistiques */}
            {recommendations && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-900">Total Opportunités</div>
                  <div className="text-2xl font-bold text-blue-900">{recommendations.total_opportunities}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-900">Prix Moyen</div>
                  <div className="text-2xl font-bold text-green-900">{recommendations.average_price?.toFixed(0)} MAD</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-900">Prix Min-Max</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {recommendations.price_range?.min}-{recommendations.price_range?.max} MAD
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-900">Nouveaux Articles</div>
                  <div className="text-2xl font-bold text-yellow-900">{recommendations.new_articles?.length || 0}</div>
                </div>
              </div>
            )}

            {/* Filtres */}
            {recommendations && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix Min</label>
                    <input
                      type="number"
                      value={filters.price_min}
                      onChange={(e) => setFilters({ ...filters, price_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix Max</label>
                    <input
                      type="number"
                      value={filters.price_max}
                      onChange={(e) => setFilters({ ...filters, price_max: e.target.value })}
                      placeholder="1000"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">DR Min</label>
                    <input
                      type="number"
                      value={filters.dr_min}
                      onChange={(e) => setFilters({ ...filters, dr_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">TF Min</label>
                    <input
                      type="number"
                      value={filters.tf_min}
                      onChange={(e) => setFilters({ ...filters, tf_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PS Min</label>
                    <input
                      type="number"
                      value={filters.ps_min}
                      onChange={(e) => setFilters({ ...filters, ps_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qualité</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Toutes</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recherche</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre, URL ou thème..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}


            {/* Liste des sites web avec accordéon */}
            {recommendations && (
              <div className="space-y-4">
                {(() => {
                  const opportunitiesByWebsite = organizeAllOpportunitiesByWebsite();
                  
                  return Object.keys(opportunitiesByWebsite).length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site web trouvé</h3>
                      <p className="text-gray-600">Ajustez vos filtres pour voir plus de résultats</p>
                    </div>
                  ) : (
                    Object.entries(opportunitiesByWebsite).map(([websiteUrl, data]) => (
                      <motion.div
                        key={websiteUrl}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-sm border border-gray-200"
                      >
                        {/* En-tête du site web */}
                        <div 
                          className={`p-6 ${data.existingArticles.length > 0 ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                          onClick={data.existingArticles.length > 0 ? () => toggleWebsiteExpansion(websiteUrl) : undefined}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                              {data.existingArticles.length > 0 && (
                                expandedWebsites.has(websiteUrl) ? (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                )
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{data.website.name}</h3>
                                <p className="text-sm text-gray-600">{data.website.url}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="text-center">
                                  <span className="text-gray-500">Catégorie</span>
                                  <p className="font-medium">{data.website.category}</p>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-500">TF</span>
                                  <p className="font-medium">{data.website.tf}</p>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-500">CF</span>
                                  <p className="font-medium">{data.website.cf}</p>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-500">Articles</span>
                                  <p className="font-medium">{data.existingArticles.length + (data.newArticle ? 1 : 0)}</p>
                                </div>
                                {data.newArticle && (
                                  <div className="text-center">
                                    <span className="text-gray-500">Nouveau</span>
                                    <p className="font-medium text-green-600">{data.newArticle.price.toLocaleString()} MAD</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Bouton pour commander directement les nouveaux articles */}
                              {data.newArticle && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(data.newArticle!, 'new');
                                  }}
                                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Ajouter
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contenu de l'accordéon - Articles existants uniquement */}
                        {expandedWebsites.has(websiteUrl) && data.existingArticles.length > 0 && (
                          <div className="border-t border-gray-200">
                            <div className="p-6">
                              <h4 className="text-md font-semibold text-gray-900 mb-4">Articles existants</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-3 px-4 font-medium text-gray-700">Site</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-700">Catégorie</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-700">TF</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-700">CF</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-700">Prix</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {data.existingArticles.map((article) => {
                                      const isInCart = cartIds.includes(article.id);
                                      return (
                                        <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                                          <td className="py-3 px-4">
                                            <div>
                                              <p className="font-medium text-gray-900">{article.site_name}</p>
                                              <p className="text-sm text-gray-600">{article.existing_article?.title}</p>
                                            </div>
                                          </td>
                                          <td className="py-3 px-4">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                              {article.theme}
                                            </span>
                                          </td>
                                          <td className="py-3 px-4 font-medium">{article.site_metrics.tf || 0}</td>
                                          <td className="py-3 px-4 font-medium">{article.site_metrics.cf || 0}</td>
                                          <td className="py-3 px-4">
                                            <span className="text-lg font-bold text-green-600">
                                              {article.price.toLocaleString()} MAD
                                            </span>
                                          </td>
                                          <td className="py-3 px-4">
                                            <button
                                              onClick={() => handleAddToCart(article, 'existing')}
                                              disabled={isInCart}
                                              className={`inline-flex items-center px-3 py-1 rounded text-sm transition-colors ${
                                                isInCart 
                                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                                              }`}
                                            >
                                              <ShoppingCart className="h-3 w-3 mr-1" />
                                              {isInCart ? 'Dans le panier' : 'Ajouter'}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  );
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleStep2Back}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour
              </button>
              <button
                onClick={handleStep2Next}
                className="inline-flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Récapitulatif</h2>
              <p className="text-gray-600">
                Vérifiez les informations de votre campagne avant de finaliser
              </p>
            </div>

            {/* Récapitulatif de la campagne */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la campagne</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">URLs:</span>
                  <span className="font-medium">{formData.urls.filter(url => url.trim()).length}</span>
                </div>
              </div>
            </div>

            {/* Récapitulatif du panier */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles sélectionnés</h3>
              <div className="text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun article sélectionné</p>
                <p className="text-sm">Retournez à l'étape précédente pour sélectionner des liens</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleStep3Back}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour
              </button>
              <button
                onClick={() => navigate('/panier')}
                className="inline-flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Finaliser la commande
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CampaignWizard;
