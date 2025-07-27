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
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing } from '../types';
import { getLinkListings, deleteLinkListing } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';
import LinkCard from '../components/Links/LinkCard';
import LinkListingForm from '../components/Links/LinkListingForm';
import { trackPageView } from '../utils/analytics';
import toast from 'react-hot-toast';

const UserLinkListingsPage: React.FC = () => {
  const [linkListings, setLinkListings] = React.useState<LinkListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingListing, setEditingListing] = React.useState<LinkListing | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  React.useEffect(() => {
    trackPageView('/dashboard/link-listings', 'Mes Annonces de Liens | Authority.ma');
    fetchLinkListings();
  }, []);

  const fetchLinkListings = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const listingsData = await getLinkListings({ 
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      await deleteLinkListing(listingId);
      setLinkListings(prev => prev.filter(l => l.id !== listingId));
      toast.success('Annonce supprimée avec succès');
    } catch (error) {
      console.error('Error deleting link listing:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleFormSuccess = (listing: LinkListing) => {
    if (editingListing) {
      setLinkListings(prev => prev.map(l => l.id === listing.id ? listing : l));
      toast.success('Annonce mise à jour avec succès');
    } else {
      setLinkListings(prev => [listing, ...prev]);
      toast.success('Annonce créée avec succès');
    }
    setShowForm(false);
    setEditingListing(null);
  };

  const filteredListings = linkListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.anchor_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesType = typeFilter === 'all' || listing.link_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: linkListings.length,
    active: linkListings.filter(l => l.status === 'active').length,
    pending: linkListings.filter(l => l.status === 'pending').length,
    sold: linkListings.filter(l => l.status === 'sold').length,
    totalValue: linkListings.reduce((sum, l) => sum + l.price, 0)
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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

  const getTypeLabel = (type: string) => {
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

  if (showForm) {
    return (
      <LinkListingForm
        linkListing={editingListing || undefined}
        isEdit={!!editingListing}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingListing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Annonces de Liens</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos annonces de liens et suivez vos ventes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une annonce</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <LinkIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actives</p>
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
              <p className="text-sm font-medium text-gray-600">Vendues</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur totale</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} MAD</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
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
                placeholder="Rechercher une annonce..."
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
              <option value="active">Actives</option>
              <option value="pending">En attente</option>
              <option value="sold">Vendues</option>
              <option value="inactive">Inactives</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="dofollow">Dofollow</option>
              <option value="nofollow">Nofollow</option>
              <option value="sponsored">Sponsored</option>
              <option value="ugc">UGC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des annonces */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Aucune annonce trouvée'
              : 'Aucune annonce pour le moment'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre première annonce de lien'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer une annonce
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header avec statut */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(listing.status)}`}>
                      {getStatusLabel(listing.status)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTypeLabel(listing.link_type)}
                    </span>
                  </div>
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {listing.target_url}
                </p>
              </div>

              {/* Détails */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {listing.price.toLocaleString()} {listing.currency}
                    </div>
                    <div className="text-xs text-gray-500">Prix mensuel</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {listing.minimum_contract_duration}
                    </div>
                    <div className="text-xs text-gray-500">Mois min.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {listing.position}
                    </div>
                    <div className="text-xs text-gray-500">Position</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {listing.allowed_niches.length}
                    </div>
                    <div className="text-xs text-gray-500">Niches autorisées</div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {listing.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Texte d'ancrage: <strong>{listing.anchor_text}</strong></span>
                  <span>Max {listing.max_links_per_page || 1} lien(s)/page</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Link
                      to={`/lien/${listing.slug}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Voir</span>
                    </Link>
                    <button
                      onClick={() => {
                        setEditingListing(listing);
                        setShowForm(true);
                      }}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
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

export default UserLinkListingsPage; 