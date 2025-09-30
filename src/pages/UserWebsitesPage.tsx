import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Star,
  Settings,
  Link as LinkIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Website } from '../types';
import { getWebsites, deleteWebsite } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';
import WebsiteCard from '../components/Websites/WebsiteCard';
import WebsiteForm from '../components/Websites/WebsiteForm';
import BulkWebsiteForm from '../components/Websites/BulkWebsiteForm';
import { trackPageView } from '../utils/analytics';
import { getCategoryOptions } from '../utils/categories';
import toast from 'react-hot-toast';

const UserWebsitesPage: React.FC = () => {
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [showBulkForm, setShowBulkForm] = React.useState(false);
  const [editingWebsite, setEditingWebsite] = React.useState<Website | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = React.useState<string>('created_at');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    trackPageView('/dashboard/websites', 'Mes Sites Web | Back.ma');
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const websitesData = await getWebsites({ 
        user_id: user.id
      });
      setWebsites(websitesData);
    } catch (error) {
      console.error('Error fetching websites:', error);
      toast.error('Erreur lors du chargement des sites web');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce site web ?')) return;

    try {
      await deleteWebsite(websiteId);
      setWebsites(prev => prev.filter(w => w.id !== websiteId));
      toast.success('Site web supprimé avec succès');
    } catch (error) {
      console.error('Error deleting website:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleFormSuccess = (website: Website) => {
    if (editingWebsite) {
      setWebsites(prev => prev.map(w => w.id === website.id ? website : w));
      toast.success('Site web mis à jour avec succès');
    } else {
      setWebsites(prev => [website, ...prev]);
      toast.success('Site web créé avec succès');
    }
    setShowForm(false);
    setEditingWebsite(null);
  };

  const handleBulkFormSuccess = () => {
    setShowBulkForm(false);
    fetchWebsites(); // Recharger la liste des sites web
  };

  const filteredAndSortedWebsites = React.useMemo(() => {
    let filtered = websites.filter(website => {
      const matchesSearch = website.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           website.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || website.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || website.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Tri des sites
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'url':
          aValue = a.url.toLowerCase();
          bValue = b.url.toLowerCase();
          break;
        case 'domain_authority':
          aValue = a.metrics?.domain_authority || 0;
          bValue = b.metrics?.domain_authority || 0;
          break;
        case 'monthly_traffic':
          aValue = a.metrics?.monthly_traffic || 0;
          bValue = b.metrics?.monthly_traffic || 0;
          break;
        case 'new_article_price':
          aValue = a.new_article_price || 0;
          bValue = b.new_article_price || 0;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [websites, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  const stats = {
    total: websites.length,
    active: websites.filter(w => w.status === 'active').length,
    pending: 0, // Plus de sites en attente d'approbation
    rejected: websites.filter(w => w.status === 'suspended').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  };

  if (showForm) {
    return (
      <WebsiteForm
        website={editingWebsite || undefined}
        isEdit={!!editingWebsite}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingWebsite(null);
        }}
        onBulkImport={() => {
          setShowForm(false);
          setShowBulkForm(true);
        }}
      />
    );
  }

  if (showBulkForm) {
    return (
      <BulkWebsiteForm
        onSuccess={handleBulkFormSuccess}
        onCancel={() => setShowBulkForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mes Sites Web
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Gérez vos sites web et maximisez vos revenus avec des liens sponsorisés
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter un site</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats modernisées */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Sites enregistrés</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sites Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">En ligne</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Potentiels</p>
                <p className="text-3xl font-bold text-purple-600">
                  {websites.reduce((sum, w) => sum + (w.new_article_price || 0), 0).toLocaleString()} DH
                </p>
                <p className="text-xs text-gray-500 mt-1">Prix total</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emplacements</p>
                <p className="text-3xl font-bold text-orange-600">
                  {websites.reduce((sum, w) => sum + (w.available_link_spots || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Liens disponibles</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <LinkIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtres et contrôles modernisés */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de site ou URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filtres */}
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="suspended">Suspendus</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="all">Toutes les catégories</option>
                {getCategoryOptions().map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="created_at">Date de création</option>
                <option value="title">Nom du site</option>
                <option value="domain_authority">Domain Authority</option>
                <option value="monthly_traffic">Trafic mensuel</option>
                <option value="new_article_price">Prix</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
              >
                {sortOrder === 'asc' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
              </button>
            </div>
            
          </div>
        </motion.div>

        {/* Liste des sites web modernisée */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedWebsites.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg border border-white/20 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? 'Aucun site web trouvé'
                : 'Aucun site web pour le moment'
              }
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche pour trouver vos sites'
                : 'Commencez par ajouter votre premier site web pour vendre des liens et générer des revenus'
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter un site web</span>
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedWebsites.map((website, index) => (
              <motion.div
                key={website.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Header avec favicon et statut */}
                <div className="p-6 border-b border-gray-100/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(website.status)}`}>
                          {getStatusLabel(website.status)}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-2">
                    {website.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <ExternalLink className="h-4 w-4" />
                    <span className="line-clamp-1">{website.url}</span>
                  </div>
                </div>

                {/* Métriques modernisées */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <div className="text-xl font-bold text-blue-600">
                        {website.metrics?.domain_authority || 'N/A'}
                      </div>
                      <div className="text-xs text-blue-500 font-medium">Domain Authority</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <div className="text-xl font-bold text-green-600">
                        {website.metrics?.monthly_traffic 
                          ? `${(website.metrics.monthly_traffic / 1000).toFixed(1)}K`
                          : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-green-500 font-medium">Visiteurs/mois</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Emplacements disponibles</span>
                      <span className="font-semibold text-gray-900">{website.available_link_spots}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Prix par article</span>
                      <span className="font-semibold text-purple-600">{website.new_article_price || 0} DH</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Temps de réponse</span>
                      <span className="font-semibold text-gray-900">{website.average_response_time || 'N/A'}h</span>
                    </div>
                  </div>

                  {/* Actions modernisées */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="flex space-x-3">
                      <Link
                        to={`/site/${website.slug}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Voir</span>
                      </Link>
                      <button
                        onClick={() => {
                          setEditingWebsite(website);
                          setShowForm(true);
                        }}
                        className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteWebsite(website.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWebsitesPage; 