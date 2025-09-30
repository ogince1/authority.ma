import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Globe,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategoryLabel } from '../../utils/categories';
import Favicon from '../Common/Favicon';
import { 
  getLinkRecommendations, 
  getCurrentUser
} from '../../lib/supabase';
import toast from 'react-hot-toast';

interface QuickBuyItem {
  listing: any; // Peut être LinkListing ou Website transformé
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
  const [opportunities, setOpportunities] = useState<any[]>([]);
  // Panier maintenant unifié - pas besoin de state local
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
  const [trafficRange, setTrafficRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 });
  const [trustFlowRange, setTrustFlowRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [keywordsRange, setKeywordsRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [localFilters, setLocalFilters] = useState<Record<string, { search: string; priceRange: { min: number; max: number } }>>({});
  // Variables supprimées car le panier est maintenant unifié
  const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, trafficRange, trustFlowRange, keywordsRange]);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Variables supprimées car le panier est maintenant unifié

      // Charger les opportunités de liens (sans campaignId pour l'achat rapide)
      const recommendations = await getLinkRecommendations('quick-buy');
      console.log('Recommendations received:', recommendations);
      console.log('Type of recommendations:', typeof recommendations);
      
      // Extraire les données du résultat
      if (recommendations) {
        const websites = recommendations.websites || [];
        const linkListings = recommendations.link_listings || [];
        
        console.log('Websites (headers):', websites.length);
        console.log('Link listings (articles):', linkListings.length);
        
        // Créer la structure d'accordéon : websites comme headers, link_listings comme contenu
        const accordionData = websites.map(website => {
          // Trouver les articles existants pour ce site
          const siteArticles = linkListings.filter((listing: any) => listing.website_id === website.id);
          
          return {
            website: {
              id: website.id,
              name: website.title || website.name || 'Site sans nom',
              url: website.url || '',
              category: website.category || 'various',
              tf: website.metrics?.domain_authority || 0, // Trust Flow
              cf: 0, // Pas de CF dans websites
              description: website.description || '',
              monthly_traffic: website.metrics?.monthly_traffic || 0,
              organic_keywords: website.metrics?.organic_keywords || 0
            },
            existingArticles: siteArticles,
            newArticle: {
              id: `new-${website.id}`,
              website_id: website.id,
              title: website.title || website.name || 'Site sans nom',
              description: website.description || '',
              target_url: website.url || '',
              price: website.new_article_price || 80, // Utiliser le prix défini par l'éditeur
              currency: 'MAD',
              type: 'new_article'
            }
          };
        });
        
        setOpportunities(accordionData);
      } else {
        console.warn('No recommendations received, setting empty array');
        setOpportunities([]);
      }

      // Panier maintenant unifié - pas besoin de charger le panier local
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = Array.isArray(opportunities) ? opportunities.filter(data => {
    const website = data.website;
    const newArticle = data.newArticle;
    const existingArticles = data.existingArticles || [];

    const matchesSearch = (website?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (website?.url || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (newArticle?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         existingArticles.some((article: any) => 
                           (article?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article?.target_url || '').toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesCategory = selectedCategory === 'all' || website?.category === selectedCategory;
    
    const matchesPrice = (newArticle?.price || 0) >= priceRange.min && (newArticle?.price || 0) <= priceRange.max ||
                         existingArticles.some((article: any) => (article?.price || 0) >= priceRange.min && (article?.price || 0) <= priceRange.max);
    
    // Filtres pour les métriques
    const matchesTraffic = (website?.monthly_traffic || 0) >= trafficRange.min && (website?.monthly_traffic || 0) <= trafficRange.max;
    const matchesTrustFlow = (website?.tf || 0) >= trustFlowRange.min && (website?.tf || 0) <= trustFlowRange.max;
    const matchesKeywords = (website?.organic_keywords || 0) >= keywordsRange.min && (website?.organic_keywords || 0) <= keywordsRange.max;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesTraffic && matchesTrustFlow && matchesKeywords;
  }) : [];

  // Tri supprimé car le panier est maintenant unifié

  const toggleWebsiteExpansion = (websiteKey: string) => {
    const newExpanded = new Set(expandedWebsites);
    if (newExpanded.has(websiteKey)) {
      newExpanded.delete(websiteKey);
    } else {
      newExpanded.add(websiteKey);
      // Initialiser les filtres locaux quand on ouvre un site
      if (!localFilters[websiteKey]) {
        setLocalFilters(prev => ({
          ...prev,
          [websiteKey]: {
            search: '',
            priceRange: { min: 0, max: 50000 }
          }
        }));
      }
    }
    setExpandedWebsites(newExpanded);
  };

  const updateLocalFilter = (websiteKey: string, field: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [websiteKey]: {
        ...prev[websiteKey],
        [field]: value
      }
    }));
  };

  const getLocalFilter = (websiteKey: string) => {
    return localFilters[websiteKey] || {
      search: '',
      priceRange: { min: 0, max: 50000 }
    };
  };

  const getFilteredExistingArticles = (websiteKey: string, articles: any[]) => {
    const filter = getLocalFilter(websiteKey);
    return articles.filter(article => {
      const matchesSearch = !filter.search || 
        (article.title || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (article.target_url || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (article.description || '').toLowerCase().includes(filter.search.toLowerCase());
      
      const matchesPrice = (article.price || 0) >= filter.priceRange.min && 
                          (article.price || 0) <= filter.priceRange.max;
      
      return matchesSearch && matchesPrice;
    });
  };

  // Logique de pagination
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOpportunities = filteredOpportunities.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const addToCart = (listing: any) => {
    const isVirtual = listing.type === 'new_article';
    const newItem: QuickBuyItem = {
      listing,
      quantity: 1,
      anchorText: '',
      targetUrl: '',
      isVirtual,
      contentOption: isVirtual ? 'platform' : undefined,
        platformContentPrice: isVirtual ? 90 : 0
    };

    // Ajouter directement au panier principal
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = [...existingCart, newItem];
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    toast.success('Article ajouté au panier principal');
    
    // Rediriger vers le panier principal
    navigate('/panier');
  };

  // Fonctions supprimées car le panier est maintenant unifié

  // Fonction processQuickBuy supprimée car le panier est maintenant unifié

  const categories = ['all', ...Array.from(new Set(Array.isArray(opportunities) ? opportunities.map(o => o.website?.category).filter(Boolean) : []))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10"></div>
        <div className="relative">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Zap className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Achat Rapide
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Achetez des liens directement sans créer de campagne
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Sites disponibles</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {opportunities.length}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Articles total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {opportunities.reduce((total, data) => total + data.existingArticles.length + (data.newArticle ? 1 : 0), 0)}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Dans le panier</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                0 MAD
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Filtres et recherche */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            {/* Barre de recherche et filtres en une ligne */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par site ou par mot-clés..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div className="lg:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Toutes catégories' : getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>


              {/* Plage de prix compacte */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Prix:</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  className="w-20 px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  className="w-20 px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 text-sm"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">MAD</span>
              </div>
            </div>

            {/* Filtres pour les métriques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Filtre Trafic mensuel (TR) */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">Trafic mensuel (TR)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={trafficRange.min}
                    onChange={(e) => setTrafficRange({ ...trafficRange, min: Number(e.target.value) })}
                    className="w-20 px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                  />
                  <span className="text-blue-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={trafficRange.max}
                    onChange={(e) => setTrafficRange({ ...trafficRange, max: Number(e.target.value) })}
                    className="w-20 px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                  />
                  <span className="text-xs text-blue-600">visiteurs</span>
                </div>
              </div>

              {/* Filtre Trust Flow (TF) */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-purple-800">Trust Flow (TF)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={trustFlowRange.min}
                    onChange={(e) => setTrustFlowRange({ ...trustFlowRange, min: Number(e.target.value) })}
                    className="w-20 px-2 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                  />
                  <span className="text-purple-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={trustFlowRange.max}
                    onChange={(e) => setTrustFlowRange({ ...trustFlowRange, max: Number(e.target.value) })}
                    className="w-20 px-2 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                  />
                  <span className="text-xs text-purple-600">/100</span>
                </div>
              </div>

              {/* Filtre Mots-clés organiques (MO) */}
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-emerald-800">Mots-clés (MO)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={keywordsRange.min}
                    onChange={(e) => setKeywordsRange({ ...keywordsRange, min: Number(e.target.value) })}
                    className="w-20 px-2 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm"
                  />
                  <span className="text-emerald-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={keywordsRange.max}
                    onChange={(e) => setKeywordsRange({ ...keywordsRange, max: Number(e.target.value) })}
                    className="w-20 px-2 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm"
                  />
                  <span className="text-xs text-emerald-600">mots-clés</span>
                </div>
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {(searchTerm || selectedCategory !== 'all' || priceRange.min > 0 || priceRange.max < 50000 || trafficRange.min > 0 || trafficRange.max < 1000000 || trustFlowRange.min > 0 || trustFlowRange.max < 100 || keywordsRange.min > 0 || keywordsRange.max < 100000) && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-sm font-medium text-emerald-800">Filtres actifs:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    Recherche: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    Catégorie: {getCategoryLabel(selectedCategory as any)}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(priceRange.min > 0 || priceRange.max < 50000) && (
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    Prix: {priceRange.min} - {priceRange.max} MAD
                    <button
                      onClick={() => setPriceRange({ min: 0, max: 50000 })}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(trafficRange.min > 0 || trafficRange.max < 1000000) && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    TR: {trafficRange.min.toLocaleString()} - {trafficRange.max.toLocaleString()} visiteurs
                    <button
                      onClick={() => setTrafficRange({ min: 0, max: 1000000 })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(trustFlowRange.min > 0 || trustFlowRange.max < 100) && (
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    TF: {trustFlowRange.min} - {trustFlowRange.max}
                    <button
                      onClick={() => setTrustFlowRange({ min: 0, max: 100 })}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(keywordsRange.min > 0 || keywordsRange.max < 100000) && (
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    MO: {keywordsRange.min.toLocaleString()} - {keywordsRange.max.toLocaleString()} mots-clés
                    <button
                      onClick={() => setKeywordsRange({ min: 0, max: 100000 })}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Liste des sites web avec accordéon */}
          <div className="space-y-3">
            {paginatedOpportunities.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Globe className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun site web trouvé</h3>
                <p className="text-gray-600">Ajustez vos filtres pour voir plus de résultats</p>
              </div>
            ) : (
              paginatedOpportunities.map((data, index) => (
                <motion.div
                  key={data.website.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden"
                >
                {/* En-tête du site web */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleWebsiteExpansion(data.website.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-1.5 bg-gray-100 rounded-md flex-shrink-0">
                        {expandedWebsites.has(data.website.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <Favicon 
                            url={data.website.url} 
                            size={24}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{data.website.name}</h3>
                          <p className="text-xs text-gray-600 truncate">{data.website.url}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Métriques compactes */}
                    <div className="flex items-center space-x-2 text-xs flex-shrink-0">
                      <div className="text-center bg-gray-50 rounded-md p-1.5 min-w-[60px]">
                        <span className="text-gray-500 text-xs">Catégorie</span>
                        <p className="font-semibold text-gray-900 text-xs leading-tight truncate">{getCategoryLabel(data.website.category)}</p>
                      </div>
                      <div className="text-center bg-blue-50 rounded-md p-1.5 min-w-[45px]">
                        <span className="text-gray-500 text-xs">TR</span>
                        <p className="font-bold text-blue-600 text-sm">{data.website.monthly_traffic?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="text-center bg-purple-50 rounded-md p-1.5 min-w-[45px]">
                        <span className="text-gray-500 text-xs">TF</span>
                        <p className="font-bold text-purple-600 text-sm">{data.website.tf}</p>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-md p-1.5 min-w-[45px]">
                        <span className="text-gray-500 text-xs">MO</span>
                        <p className="font-bold text-emerald-600 text-sm">{data.website.organic_keywords?.toLocaleString() || '0'}</p>
                      </div>
                      {data.newArticle && (
                        <div className="text-center bg-green-50 rounded-md p-1.5 min-w-[70px]">
                          <span className="text-gray-500 text-xs">Prix</span>
                          <p className="font-bold text-green-600 text-xs">{data.newArticle.price.toLocaleString()} MAD</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Bouton pour commander directement les nouveaux articles */}
                    {data.newArticle && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(data.newArticle!);
                          }}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-300 text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow-md"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1.5" />
                          Ajouter
                        </button>
                      </div>
                    )}
                  </div>
                </div>


                {/* Contenu de l'accordéon - Articles existants */}
                {expandedWebsites.has(data.website.id) && data.existingArticles.length > 0 && (
                  <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="text-md font-bold text-gray-900">Articles existants</h4>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {getFilteredExistingArticles(data.website.id, data.existingArticles).length} article{getFilteredExistingArticles(data.website.id, data.existingArticles).length > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Filtres locaux pour les articles existants */}
                      <div className="bg-white rounded-lg p-3 mb-4 border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Recherche locale */}
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="text"
                              placeholder="Rechercher dans les articles..."
                              value={getLocalFilter(data.website.id).search}
                              onChange={(e) => updateLocalFilter(data.website.id, 'search', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* Prix local */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Prix:</span>
                            <input
                              type="number"
                              placeholder="Min"
                              value={getLocalFilter(data.website.id).priceRange.min}
                              onChange={(e) => updateLocalFilter(data.website.id, 'priceRange', { 
                                ...getLocalFilter(data.website.id).priceRange, 
                                min: Number(e.target.value) 
                              })}
                              className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={getLocalFilter(data.website.id).priceRange.max}
                              onChange={(e) => updateLocalFilter(data.website.id, 'priceRange', { 
                                ...getLocalFilter(data.website.id).priceRange, 
                                max: Number(e.target.value) 
                              })}
                              className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-xs text-gray-500">MAD</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Message si aucun article ne correspond aux filtres */}
                      {getFilteredExistingArticles(data.website.id, data.existingArticles).length === 0 ? (
                        <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                          <div className="text-gray-400 mb-2">
                            <FileText className="h-8 w-8 mx-auto" />
                          </div>
                          <p className="text-gray-600 text-sm">
                            Aucun article ne correspond aux filtres appliqués
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Site</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Prix</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredExistingArticles(data.website.id, data.existingArticles).map((article) => (
                              <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{article.title}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{article.target_url}</p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm font-bold text-emerald-600">{article.price} MAD</span>
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => addToCart(article)}
                                    className="inline-flex items-center px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
                                  >
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Ajouter
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}

          {/* Informations de pagination */}
          {filteredOpportunities.length > 0 && (
            <div className="text-center text-sm text-gray-600 mt-4">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredOpportunities.length)} sur {filteredOpportunities.length} sites
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuickBuyPage;
