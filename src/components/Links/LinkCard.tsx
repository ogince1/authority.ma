import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  DollarSign,
  Calendar,
  Target,
  Globe,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing } from '../../types';

interface LinkCardProps {
  listing: LinkListing;
  onEdit?: (listing: LinkListing) => void;
  onDelete?: (listingId: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ listing, onEdit, onDelete }) => {
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

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'header':
        return 'Header';
      case 'footer':
        return 'Footer';
      case 'sidebar':
        return 'Sidebar';
      case 'content':
        return 'Contenu';
      case 'menu':
        return 'Menu';
      case 'popup':
        return 'Popup';
      default:
        return position;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
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
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getPositionLabel(listing.position)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(listing)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Modifier"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(listing.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-1 flex items-center">
          <Globe className="h-3 w-3 mr-1" />
          {listing.target_url}
        </p>
      </div>

      {/* Détails */}
      <div className="p-4">
        {/* Métriques principales */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-green-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {listing.price.toLocaleString()} {listing.currency}
            </div>
            <div className="text-xs text-gray-500">Prix mensuel</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-blue-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {listing.minimum_contract_duration}
            </div>
            <div className="text-xs text-gray-500">Mois min.</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-purple-600 mr-1" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {listing.max_links_per_page || 1}
            </div>
            <div className="text-xs text-gray-500">Lien(s)/page</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>
        </div>

        {/* Informations supplémentaires */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Texte d'ancrage:</span>
            <span className="font-medium text-gray-900">{listing.anchor_text}</span>
          </div>
        </div>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {listing.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {listing.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  +{listing.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            to={`/lien/${listing.id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>Voir détails</span>
          </Link>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Créé le {new Date(listing.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LinkCard; 