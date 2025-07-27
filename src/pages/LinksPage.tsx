import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Globe, TrendingUp, DollarSign, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, LinkType, LinkPosition, WebsiteCategory, WebsiteNiche } from '../types';
import { getLinkListings } from '../lib/supabase';
import { trackPageView } from '../utils/analytics';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const LinksPage: React.FC = () => {
  const [links, setLinks] = React.useState<LinkListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedLinkType, setSelectedLinkType] = React.useState<LinkType | 'all'>('all');
  const [selectedPosition, setSelectedPosition] = React.useState<LinkPosition | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<WebsiteCategory | 'all'>('all');
  const [selectedNiche, setSelectedNiche] = React.useState<WebsiteNiche | 'all'>('all');
  const [priceRange, setPriceRange] = React.useState({ min: '', max: '' });
  const [sortBy, setSortBy] = React.useState<'price' | 'date' | 'authority'>('date');

  React.useEffect(() => {
    trackPageView('/liens', 'Liens Disponibles - Authority.ma');
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedLinkType !== 'all') filters.link_type = selectedLinkType;
      if (selectedPosition !== 'all') filters.position = selectedPosition;
      if (selectedCategory !== 'all') filters.website_category = selectedCategory;
      if (selectedNiche !== 'all') filters.website_niche = selectedNiche;
      if (priceRange.min) filters.min_price = parseFloat(priceRange.min);
      if (priceRange.max) filters.max_price = parseFloat(priceRange.max);
      if (searchTerm) filters.search = searchTerm;

      const data = await getLinkListings(filters);
      
      // Trier les résultats
      let sortedData = [...data];
      switch (sortBy) {
        case 'price':
          sortedData.sort((a, b) => a.price - b.price);
          break;
        case 'date':
          sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'authority':
          sortedData.sort((a, b) => (b.website?.metrics?.domain_authority || 0) - (a.website?.metrics?.domain_authority || 0));
          break;
      }
      
      setLinks(sortedData);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLinks();
  }, [selectedLinkType, selectedPosition, selectedCategory, selectedNiche, priceRange, sortBy, searchTerm]);

  const linkTypes: { value: LinkType; label: string; color: string }[] = [
    { value: 'dofollow', label: 'Dofollow', color: 'bg-green-100 text-green-800' },
    { value: 'nofollow', label: 'Nofollow', color: 'bg-blue-100 text-blue-800' },
    { value: 'sponsored', label: 'Sponsored', color: 'bg-purple-100 text-purple-800' },
    { value: 'ugc', label: 'UGC', color: 'bg-orange-100 text-orange-800' }
  ];

  const positions: { value: LinkPosition; label: string }[] = [
    { value: 'header', label: 'Header' },
    { value: 'footer', label: 'Footer' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'content', label: 'Contenu' },
    { value: 'menu', label: 'Menu' },
    { value: 'popup', label: 'Popup' }
  ];

  const categories: { value: WebsiteCategory; label: string }[] = [
    { value: 'blog', label: 'Blogs' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'actualites', label: 'Actualités' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'tech', label: 'Tech' },
    { value: 'business', label: 'Business' },
    { value: 'sante', label: 'Santé' },
    { value: 'education', label: 'Éducation' },
    { value: 'immobilier', label: 'Immobilier' },
    { value: 'automobile', label: 'Automobile' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'cuisine', label: 'Cuisine' },
    { value: 'sport', label: 'Sport' },
    { value: 'culture', label: 'Culture' },
    { value: 'politique', label: 'Politique' },
    { value: 'economie', label: 'Économie' }
  ];

  const niches: { value: WebsiteNiche; label: string }[] = [
    { value: 'immobilier', label: 'Immobilier' },
    { value: 'sante', label: 'Santé' },
    { value: 'beaute', label: 'Beauté' },
    { value: 'mode', label: 'Mode' },
    { value: 'tech', label: 'Tech' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Éducation' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'cuisine', label: 'Cuisine' },
    { value: 'sport', label: 'Sport' },
    { value: 'automobile', label: 'Automobile' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' },
    { value: 'actualites', label: 'Actualités' },
    { value: 'culture', label: 'Culture' },
    { value: 'politique', label: 'Politique' },
    { value: 'economie', label: 'Économie' },
    { value: 'art', label: 'Art' },
    { value: 'musique', label: 'Musique' },
    { value: 'cinema', label: 'Cinéma' }
  ];

  const clearFilters = () => {
    setSelectedLinkType('all');
    setSelectedPosition('all');
    setSelectedCategory('all');
    setSelectedNiche('all');
    setPriceRange({ min: '', max: '' });
    setSearchTerm('');
    setSortBy('date');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Liens Disponibles - Authority.ma"
        description="Découvrez des liens de qualité pour améliorer votre SEO. Liens dofollow, nofollow, sponsored et UGC sur des sites web vérifiés au Maroc."
      />
      <Header onSearchChange={setSearchTerm} searchValue={searchTerm} />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Liens Disponibles
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trouvez les liens parfaits pour améliorer votre SEO et augmenter votre visibilité en ligne
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtres :</span>
            </div>

            {/* Link Type Filter */}
            <select
              value={selectedLinkType}
              onChange={(e) => setSelectedLinkType(e.target.value as LinkType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              {linkTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* Position Filter */}
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value as LinkPosition | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les positions</option>
              {positions.map((position) => (
                <option key={position.value} value={position.value}>{position.label}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as WebsiteCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>

            {/* Niche Filter */}
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value as WebsiteNiche | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les niches</option>
              {niches.map((niche) => (
                <option key={niche.value} value={niche.value}>{niche.label}</option>
              ))}
            </select>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Prix min"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Prix max"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'date' | 'authority')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Plus récents</option>
              <option value="price">Prix croissant</option>
              <option value="authority">Autorité décroissante</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Effacer les filtres
            </button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-gray-600">
              {loading ? 'Chargement...' : `${links.length} lien${links.length > 1 ? 's' : ''} trouvé${links.length > 1 ? 's' : ''}`}
            </div>
            <Link
              to="/vendre-liens"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Vendre des Liens
            </Link>
          </div>

          {/* Links Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : links.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  {/* Link Type Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      linkTypes.find(t => t.value === link.link_type)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {linkTypes.find(t => t.value === link.link_type)?.label}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {link.price} {link.currency}
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{link.description}</p>

                  {/* Website Info */}
                  {link.website && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{link.website.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {link.website.metrics?.domain_authority && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>DA: {link.website.metrics.domain_authority}</span>
                          </div>
                        )}
                        {link.website.metrics?.monthly_traffic && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            <span>{link.website.metrics.monthly_traffic.toLocaleString()} visites/mois</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Link Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Position:</span>
                      <span className="font-medium">{positions.find(p => p.value === link.position)?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Durée min:</span>
                      <span className="font-medium">{link.minimum_contract_duration} mois</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ancre:</span>
                      <span className="font-medium text-blue-600">{link.anchor_text}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/lien/${link.slug}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Voir Détails
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun lien trouvé</h3>
              <p className="text-gray-600 mb-6">
                Aucun lien ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Effacer les Filtres
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LinksPage; 