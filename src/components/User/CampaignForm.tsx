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
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateCampaignData, LinkOpportunity, LinkQualityType } from '../../types';
import { createCampaign, analyzeURL, getLinkRecommendations } from '../../lib/supabase';
import toast from 'react-hot-toast';

const CampaignForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<'form' | 'analysis'>('form');
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
  const [activeTab, setActiveTab] = React.useState<'existing' | 'new'>('existing');
  const [filters, setFilters] = React.useState({
    price_min: '',
    price_max: '',
    dr_min: '',
    tf_min: '',
    type: '',
    ps_min: ''
  });
  const [searchTerm, setSearchTerm] = React.useState('');
  // Ajout d'un state pour les IDs du panier
  const [cartIds, setCartIds] = React.useState<string[]>([]);

  // Charger les IDs du panier au montage
  React.useEffect(() => {
    const currentCart = localStorage.getItem('cart');
    const cartItems = currentCart ? JSON.parse(currentCart) : [];
    setCartIds(cartItems.map((item: any) => item.listing?.id));
    // Mettre à jour si le panier change
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom de campagne');
      return;
    }

    if (!formData.urls.some(url => url.trim())) {
      toast.error('Veuillez saisir au moins une URL');
      return;
    }

    setLoading(true);
                    try {
                  // Créer la campagne
                  const campaign = await createCampaign(formData);
                  setCreatedCampaignId(campaign.id);
                  
                  // Sauvegarder l'ID de campagne dans localStorage pour le panier
                  localStorage.setItem('current_campaign_id', campaign.id);

                  // Analyser les URLs
                  setAnalyzing(true);
                  const analyses = await Promise.all(
                    formData.urls.filter(url => url.trim()).map(url => analyzeURL(url.trim()))
                  );
                  setAnalysisResults(analyses);

                  // Mettre à jour la campagne avec les métriques
                  // await updateCampaignMetrics(campaign.id, analyses[0]?.metrics);

                  // Récupérer les recommandations de liens
                  try {
                    const recommendationsData = await getLinkRecommendations(campaign.id, {});
                    setRecommendations(recommendationsData);
                  } catch (error) {
                    console.error('Error fetching recommendations:', error);
                    toast.error('Erreur lors du chargement des recommandations');
                  }

                  setStep('analysis');
                  toast.success('Campagne créée avec succès !');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erreur lors de la création de la campagne');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const filterOpportunities = (opportunities: LinkOpportunity[], type: 'existing' | 'new') => {
    return opportunities.filter(opportunity => {
      // Filtre par prix
      if (filters.price_min && opportunity.price < parseFloat(filters.price_min)) return false;
      if (filters.price_max && opportunity.price > parseFloat(filters.price_max)) return false;
      
      // Filtre par DR
      if (filters.dr_min && (opportunity.site_metrics.dr || 0) < parseFloat(filters.dr_min)) return false;
      
      // Filtre par TF
      if (filters.tf_min && (opportunity.site_metrics.tf || 0) < parseFloat(filters.tf_min)) return false;
      
      // Filtre par PS
      if (filters.ps_min && (opportunity.site_metrics.ps || 0) < parseFloat(filters.ps_min)) return false;
      
      // Filtre par type de qualité
      if (filters.type && opportunity.quality_type !== filters.type) return false;
      
      // Filtre par recherche
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
      // Créer un objet listing compatible avec LinkListing pour les deux types
      const listing: any = {
        id: opportunity.id,
        title: type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name,
        target_url: type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url,
        price: opportunity.price,
        currency: opportunity.currency || 'MAD',
        link_type: 'dofollow' as any,
        position: 'content' as any,
        minimum_contract_duration: 1,
        allowed_niches: [opportunity.theme as any],
        forbidden_keywords: [],
        status: 'active',
        user_id: opportunity.id, // Utiliser l'ID de l'opportunité comme user_id
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

      // Récupérer le panier actuel
      const currentCart = localStorage.getItem('cart');
      const cartItems = currentCart ? JSON.parse(currentCart) : [];

      // Vérifier si l'item existe déjà
      const existingItemIndex = cartItems.findIndex((item: any) => item.listing?.id === opportunity.id);
      
      if (existingItemIndex >= 0) {
        // Incrémenter la quantité
        cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
        toast.success('Quantité mise à jour dans le panier !');
      } else {
        // Ajouter un nouvel item avec la structure attendue
        cartItems.push({
          listing: listing,
          quantity: 1,
          anchorText: '',
          targetUrl: listing.target_url,
          isVirtual: type === 'new' // Marquer comme virtuel si c'est un nouveau article
        });
        toast.success('Ajouté au panier !');
      }

      // Sauvegarder le panier
      localStorage.setItem('cart', JSON.stringify(cartItems));
      
      // Forcer le re-render du badge du panier dans le header
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
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

  if (step === 'analysis') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Analyse terminée !
            </h1>
            <p className="text-gray-600">
              Vos URLs ont été analysées avec succès. Voici les métriques extraites :
            </p>
          </div>

          {/* Résultats d'analyse */}
          <div className="space-y-6">
            {analysisResults.map((analysis, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {analysis.url}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {analysis.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysis.metrics.traffic.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Trafic</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysis.metrics.mc.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">MC</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysis.metrics.dr}
                    </div>
                    <div className="text-sm text-gray-500">DR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysis.metrics.cf}
                    </div>
                    <div className="text-sm text-gray-500">CF</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysis.metrics.tf}
                    </div>
                    <div className="text-sm text-gray-500">TF</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <button
              onClick={() => setStep('form')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
            <button
              onClick={() => navigate('/dashboard/campaigns')}
              className="inline-flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Search className="w-4 h-4 mr-2" />
              Retour aux campagnes
            </button>
          </div>

          {/* Recommandations de liens */}
          {recommendations && (
            <div className="mt-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Recommandations de Liens
                </h2>
                <p className="text-gray-600">
                  Opportunités personnalisées basées sur l'analyse de vos URLs
                </p>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">Prix moyen</div>
                      <div className="text-lg font-bold text-blue-900">
                        {Math.round(recommendations?.average_price || 0)} MAD
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-green-900">Articles existants</div>
                      <div className="text-lg font-bold text-green-900">
                        {recommendations?.existing_articles?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-purple-900">Nouveaux articles</div>
                      <div className="text-lg font-bold text-purple-900">
                        {recommendations?.new_articles?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('existing')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'existing'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Liens sur Articles Existants ({recommendations?.existing_articles?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('new')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'new'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Liens sur Nouveaux Articles ({recommendations?.new_articles?.length || 0})
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === 'existing' ? (
                    <div>
                      {/* Section Articles Existants */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Liste des articles positionnés les plus pertinents pour votre URL
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Ces articles existent déjà sur des sites de qualité. Vous pouvez acheter un lien 
                          directement sur ces contenus pour un impact immédiat.
                        </p>
                        
                        {/* Encart pédagogique */}
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                            <Info className="w-5 h-5 text-pink-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-pink-900 mb-1">
                                LE SAVIEZ-VOUS ?
                              </h4>
                              <p className="text-sm text-pink-700">
                                Les backlinks sur des articles existants ont un impact plus rapide sur votre SEO 
                                car ils bénéficient déjà du trafic et de l'autorité du contenu. La Proximité 
                                Sémantique (PS) indique la pertinence thématique entre votre site et l'article.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                                    {/* Filtres intelligents */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix min</label>
                    <input
                      type="number"
                      value={filters.price_min}
                      onChange={(e) => setFilters({ ...filters, price_min: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix max</label>
                    <input
                      type="number"
                      value={filters.price_max}
                      onChange={(e) => setFilters({ ...filters, price_max: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">DR min</label>
                    <input
                      type="number"
                      value={filters.dr_min}
                      onChange={(e) => setFilters({ ...filters, dr_min: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">TF min</label>
                    <input
                      type="number"
                      value={filters.tf_min}
                      onChange={(e) => setFilters({ ...filters, tf_min: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PS min</label>
                    <input
                      type="number"
                      value={filters.ps_min}
                      onChange={(e) => setFilters({ ...filters, ps_min: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qualité</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="">Tous</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre, URL ou thème..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Tableau des opportunités */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thème</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cmd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filterOpportunities(recommendations?.existing_articles || [], 'existing').map((opportunity: LinkOpportunity, index: number) => (
                      <OpportunityRow key={opportunity.id} opportunity={opportunity} type="existing" />
                    ))}
                  </tbody>
                </table>
              </div>
                    </div>
                  ) : (
                    <div>
                      {/* Section Nouveaux Articles */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Liste des sites par proximité sémantique
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Ces sites sont pertinents pour publier un nouvel article avec votre lien. 
                          L'article sera créé spécialement pour votre campagne.
                        </p>
                        
                        {/* Note importante */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                                Note importante
                              </h4>
                              <p className="text-sm text-yellow-700">
                                Articles seront à 2 clics de la page d'accueil. Durée d'engagement minimum : 1 an.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tableau des opportunités */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PS</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thème</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imp.</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Out Links</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DR</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CF</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AT</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PT</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radius</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Focus</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Théma</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NL</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votre ancre</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cmd</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filterOpportunities(recommendations?.new_articles || [], 'new').map((opportunity: LinkOpportunity, index: number) => (
                              <OpportunityRow key={opportunity.id} opportunity={opportunity} type="new" />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Bouton Confirmer la campagne et passer au panier */}
          {recommendations && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  // Sauvegarder l'ID de la campagne dans localStorage
                  if (createdCampaignId) {
                    localStorage.setItem('current_campaign_id', createdCampaignId);
                  }
                  navigate('/panier');
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow"
              >
                Confirmer la campagne et passer au panier
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trouvez des liens pertinents en quelques clics ! 🔍
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Créez une nouvelle campagne en saisissant vos URLs. Notre système analysera automatiquement 
            vos sites et vous proposera les meilleures opportunités de liens.
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              URLs à analyser
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
                      <AlertCircle className="w-5 h-5" />
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

          {/* Langue */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Français">Français</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Deutsch">Deutsch</option>
              <option value="Italiano">Italiano</option>
              <option value="Português">Português</option>
              <option value="العربية">العربية</option>
            </select>
          </div>

          {/* Budget (optionnel) */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget (optionnel)
            </label>
            <div className="relative">
              <input
                type="number"
                id="budget"
                placeholder="0"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-sm">MAD</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Laissez vide pour définir le budget plus tard
            </p>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Comment ça marche ?
                </h3>
                <p className="text-sm text-blue-700">
                  Notre système analysera automatiquement vos URLs pour extraire les métriques SEO 
                  (DR, TF, CF, trafic) et vous proposera les meilleures opportunités de liens 
                  basées sur la proximité sémantique et la qualité des sites.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/campaigns')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Créer la campagne
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CampaignForm; 