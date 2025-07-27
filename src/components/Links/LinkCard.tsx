import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ExternalLink, 
  DollarSign, 
  Clock, 
  Tag, 
  MapPin, 
  Star,
  TrendingUp,
  Eye,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, LinkType, LinkPosition, Website } from '../../types';

interface LinkCardProps {
  link: LinkListing & { website?: Website };
  onPurchase?: (linkId: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onPurchase }) => {
  const getLinkTypeColor = (type: LinkType) => {
    switch (type) {
      case 'dofollow':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'nofollow':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sponsored':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ugc':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPositionIcon = (position: LinkPosition) => {
    switch (position) {
      case 'header':
        return '🔝';
      case 'footer':
        return '🔽';
      case 'sidebar':
        return '📋';
      case 'content':
        return '📄';
      case 'menu':
        return '🍽️';
      case 'popup':
        return '💬';
      default:
        return '📍';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Header avec type de lien et prix */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLinkTypeColor(link.link_type)}`}>
              {link.link_type.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500 flex items-center">
              {getPositionIcon(link.position)} {link.position}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(link.price, link.currency)}
            </div>
            <div className="text-sm text-gray-500">
              par mois
            </div>
          </div>
        </div>

        {/* Titre et description */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {link.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {link.description}
        </p>

        {/* Informations du site web */}
        {link.website && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {link.website.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {link.website.url}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>DA: {link.website.metrics?.domain_authority || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Eye className="h-3 w-3" />
                  <span>{link.website.metrics?.monthly_traffic || 'N/A'} visiteurs/mois</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Détails du lien */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Min. {link.minimum_contract_duration} mois</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Tag className="h-4 w-4" />
            <span>Ancre: "{link.anchor_text}"</span>
          </div>
        </div>

        {/* Tags et niches autorisées */}
        {link.allowed_niches && link.allowed_niches.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Niches autorisées:</div>
            <div className="flex flex-wrap gap-1">
              {link.allowed_niches.slice(0, 3).map((niche, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {niche}
                </span>
              ))}
              {link.allowed_niches.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                  +{link.allowed_niches.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mots-clés interdits */}
        {link.forbidden_keywords && link.forbidden_keywords.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Mots-clés interdits:</div>
            <div className="flex flex-wrap gap-1">
              {link.forbidden_keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {link.forbidden_keywords.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                  +{link.forbidden_keywords.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            to={`/lien/${link.slug}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>Voir détails</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          
          <button
            onClick={() => onPurchase?.(link.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <DollarSign className="h-4 w-4" />
            <span>Acheter</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LinkCard; 