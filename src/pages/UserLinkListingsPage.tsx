import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Link as LinkIcon,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  Tag,
  ExternalLink,
  BarChart3,
  Users,
  Calendar,
  Star,
  Settings,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing } from '../types';
import { getLinkListings, deleteLinkListing } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';
import LinkListingForm from '../components/Links/LinkListingForm';
import BulkLinkImport from '../components/Links/BulkLinkImport';
import LinkCard from '../components/Links/LinkCard';
import { trackPageView } from '../utils/analytics';
import toast from 'react-hot-toast';

const UserLinkListingsPage: React.FC = () => {
  const [linkListings, setLinkListings] = React.useState<LinkListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [showBulkImport, setShowBulkImport] = React.useState(false);
  const [editingListing, setEditingListing] = React.useState<LinkListing | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | LinkListing['status']>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | LinkListing['link_type']>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = React.useState<string>('created_at');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    trackPageView('/dashboard/link-listings', 'Mes Liens Existants | Back.ma');
    fetchLinkListings();
  }, []);

  const fetchLinkListings = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const listingsData: LinkListing[] = await getLinkListings({ 
        user_id: user.id
      });
      setLinkListings(listingsData);
    } catch (error) {
      console.error('Error fetching link listings:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    // Récupérer les infos du lien à supprimer pour afficher des infos
    const listingToDelete = linkListings.find(l => l.id === listingId);
    if (!listingToDelete) {
      toast.error('Lien non trouvé');
      return;
    }

    // Vérifications préalables
    if (listingToDelete.status === 'sold') {
      toast.error('Impossible de supprimer un lien vendu');
      return;
    }

    const confirmMessage = listingToDelete.status === 'active' 
      ? 'Êtes-vous sûr de vouloir supprimer cette annonce ? Si elle a des demandes d\'achat, elle sera marquée comme inactive.'
      : 'Êtes-vous sûr de vouloir supprimer cette annonce ?';

    if (!confirm(confirmMessage)) return;

    try {
      await deleteLinkListing(listingId);
      
      // Mettre à jour la liste locale
      setLinkListings((prev: LinkListing[]) => 
        prev.map((l: LinkListing) => 
          l.id === listingId 
            ? { ...l, status: 'inactive' as const } // Marquer comme inactive si pas supprimé
            : l
        ).filter((l: LinkListing) => l.id !== listingId) // Ou supprimer complètement
      );
      
      toast.success('Annonce supprimée avec succès');
    } catch (error) {
      console.error('Error deleting link listing:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleFormSuccess = (listing: LinkListing) => {
    if (editingListing) {
      setLinkListings((prev: LinkListing[]) => prev.map((l: LinkListing) => l.id === listing.id ? listing : l));
      toast.success('Annonce mise à jour avec succès');
    } else {
      setLinkListings((prev: LinkListing[]) => [listing, ...prev]);
      toast.success('Annonce créée avec succès');
    }
    setShowForm(false);
    setEditingListing(null);
  };

  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = linkListings.filter((listing: LinkListing) => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (listing.anchor_text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (listing.target_url || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
      const matchesType = typeFilter === 'all' || listing.link_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Tri des annonces
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'link_type':
          aValue = a.link_type;
          bValue = b.link_type;
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
  }, [linkListings, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const stats = {
    total: linkListings.length,
    active: linkListings.filter((l: LinkListing) => l.status === 'active').length,
    pending: linkListings.filter((l: LinkListing) => l.status === 'pending').length,
    sold: linkListings.filter((l: LinkListing) => l.status === 'sold').length,
    totalValue: linkListings.reduce((sum: number, l: LinkListing) => sum + l.price, 0)
  };

  const getStatusColor = (status: LinkListing['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: LinkListing['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'En attente';
      case 'sold':
        return 'Vendue';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: LinkListing['link_type']) => {
    switch (type) {
      case 'dofollow':
        return 'Dofollow';
      case 'nofollow':
        return 'Nofollow';
      case 'sponsored':
        return 'Sponsored';
      case 'ugc':
        return 'UGC';
      default:
        return type;
    }
  };

  const handleBulkImportSuccess = (createdListings: LinkListing[]) => {
    setShowBulkImport(false);
    setLinkListings(prev => [...createdListings, ...prev]);
    toast.success(`${createdListings.length} annonces créées avec succès !`);
  };

  const handleBulkImportCancel = () => {
    setShowBulkImport(false);
  };

  const handleShowBulkImport = () => {
    setShowBulkImport(true);
  };

  if (showBulkImport) {
    return (
      <BulkLinkImport
        onSuccess={handleBulkImportSuccess}
        onCancel={handleBulkImportCancel}
      />
    );
  }

  if (showForm) {
    return (
      <LinkListingForm
        listing={editingListing || undefined}
        isEdit={!!editingListing}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingListing(null);
        }}
        onBulkImport={handleShowBulkImport}
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
                Mes Liens Existants
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Gérez vos annonces de liens existants et maximisez vos revenus
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter un lien existant</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats modernisées */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Liens</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Annonces créées</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <LinkIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actives</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">Disponibles</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">En validation</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendues</p>
                <p className="text-3xl font-bold text-blue-600">{stats.sold}</p>
                <p className="text-xs text-gray-500 mt-1">Revenus générés</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} DH</p>
                <p className="text-xs text-gray-500 mt-1">Potentiel de revenus</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-purple-600" />
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
                  placeholder="Rechercher par titre, texte d'ancrage ou URL..."
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
                onChange={(e) => setStatusFilter(e.target.value as 'all' | LinkListing['status'])}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="pending">En attente</option>
                <option value="sold">Vendues</option>
                <option value="inactive">Inactives</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | LinkListing['link_type'])}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="all">Tous les types</option>
                <option value="dofollow">Dofollow</option>
                <option value="nofollow">Nofollow</option>
                <option value="sponsored">Sponsored</option>
                <option value="ugc">UGC</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="created_at">Date de création</option>
                <option value="title">Titre</option>
                <option value="price">Prix</option>
                <option value="status">Statut</option>
                <option value="link_type">Type de lien</option>
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

        {/* Liste des annonces modernisée */}
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
        ) : filteredAndSortedListings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg border border-white/20 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LinkIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Aucune annonce trouvée'
                : 'Aucune annonce pour le moment'
              }
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche pour trouver vos annonces'
                : 'Commencez par ajouter votre premier lien existant pour générer des revenus'
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Ajouter un lien existant
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedListings.map((listing: LinkListing, index: number) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Header avec statut et type */}
                <div className="p-6 border-b border-gray-100/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                        <LinkIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(listing.status)}`}>
                          {getStatusLabel(listing.status)}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {getTypeLabel(listing.link_type)}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {listing.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Target className="h-4 w-4" />
                    <span className="line-clamp-1">{listing.target_url}</span>
                  </div>
                </div>

                {/* Détails du lien */}
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Prix</span>
                      <span className="font-semibold text-purple-600">{listing.price} DH</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Texte d'ancrage</span>
                      <span className="font-semibold text-gray-900 line-clamp-1 max-w-32">{listing.anchor_text || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Date de création</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Actions modernisées */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                    <div className="flex space-x-3">
                      <Link
                        to={`/lien/${listing.slug}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Voir</span>
                      </Link>
                      <button
                        onClick={() => {
                          setEditingListing(listing);
                          setShowForm(true);
                        }}
                        className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
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

export default UserLinkListingsPage; 