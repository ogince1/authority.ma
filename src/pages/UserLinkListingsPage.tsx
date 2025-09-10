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
import LinkListingForm from '../components/Links/LinkListingForm';
import LinkCard from '../components/Links/LinkCard';
import { trackPageView } from '../utils/analytics';
import toast from 'react-hot-toast';

const UserLinkListingsPage: React.FC = () => {
  const [linkListings, setLinkListings] = React.useState<LinkListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingListing, setEditingListing] = React.useState<LinkListing | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | LinkListing['status']>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | LinkListing['link_type']>('all');

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

  const filteredListings = linkListings.filter((listing: LinkListing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (listing.anchor_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesType = typeFilter === 'all' || listing.link_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
                      <h1 className="text-2xl font-bold text-gray-900">Mes Liens Existants</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos annonces de liens et suivez vos ventes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un lien existant</span>
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
              onChange={(e) => setStatusFilter(e.target.value as 'all' | LinkListing['status'])}
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
              onChange={(e) => setTypeFilter(e.target.value as 'all' | LinkListing['link_type'])}
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
          {[...Array(6)].map((_: any, i: number) => (
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
              : 'Commencez par ajouter votre premier lien existant'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter un lien existant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing: LinkListing, index: number) => (
            <LinkCard
              key={listing.id}
              listing={listing}
              onEdit={(listing: LinkListing) => {
                setEditingListing(listing);
                setShowForm(true);
              }}
              onDelete={handleDeleteListing}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserLinkListingsPage; 