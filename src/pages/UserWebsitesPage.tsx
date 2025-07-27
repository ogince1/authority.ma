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
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Website } from '../types';
import { getWebsites, deleteWebsite } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';
import WebsiteCard from '../components/Websites/WebsiteCard';
import WebsiteForm from '../components/Websites/WebsiteForm';
import { trackPageView } from '../utils/analytics';
import toast from 'react-hot-toast';

const UserWebsitesPage: React.FC = () => {
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingWebsite, setEditingWebsite] = React.useState<Website | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  React.useEffect(() => {
    trackPageView('/dashboard/websites', 'Mes Sites Web | Authority.ma');
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

  const filteredWebsites = websites.filter(website => {
    const matchesSearch = website.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         website.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || website.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: websites.length,
    active: websites.filter(w => w.status === 'active').length,
    pending: websites.filter(w => w.status === 'pending_approval').length,
    rejected: websites.filter(w => w.status === 'suspended').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      case 'pending_approval':
        return 'En attente';
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
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Sites Web</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos sites web et leurs annonces de liens
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un site</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un site web..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending_approval">En attente</option>
              <option value="suspended">Suspendus</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              <option value="blog">Blog</option>
              <option value="ecommerce">E-commerce</option>
              <option value="actualites">Actualités</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="tech">Technologie</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des sites web */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredWebsites.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Aucun site web trouvé'
              : 'Aucun site web pour le moment'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par ajouter votre premier site web pour vendre des liens'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter un site web
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWebsites.map((website, index) => (
            <motion.div
              key={website.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header avec statut */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(website.status)}`}>
                    {getStatusLabel(website.status)}
                  </span>
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {website.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {website.url}
                </p>
              </div>

              {/* Métriques */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {website.metrics?.domain_authority || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Domain Authority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {website.metrics?.monthly_traffic 
                        ? `${(website.metrics.monthly_traffic / 1000).toFixed(1)}K`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-xs text-gray-500">Visiteurs/mois</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{website.available_link_spots} emplacements</span>
                  <span>{website.average_response_time || 'N/A'}h réponse</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Link
                      to={`/site/${website.slug}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Voir</span>
                    </Link>
                    <button
                      onClick={() => {
                        setEditingWebsite(website);
                        setShowForm(true);
                      }}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteWebsite(website.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserWebsitesPage; 