import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ExternalLink, 
  TrendingUp, 
  Eye, 
  Star, 
  MapPin, 
  Calendar,
  CheckCircle,
  Users,
  Globe,
  Tag,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Website, WebsiteCategory, WebsiteNiche } from '../../types';
import { getCategoryLabel, getCategoryColor } from '../../utils/categories';

interface WebsiteCardProps {
  website: Website;
  onViewDetails?: (websiteId: string) => void;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ website, onViewDetails }) => {

  const getNicheColor = (niche: WebsiteNiche) => {
    switch (niche) {
      case 'immobilier':
        return 'bg-orange-100 text-orange-800';
      case 'sante':
        return 'bg-red-100 text-red-800';
      case 'tech':
        return 'bg-blue-100 text-blue-800';
      case 'finance':
        return 'bg-green-100 text-green-800';
      case 'education':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTraffic = (traffic?: number) => {
    if (!traffic) return 'N/A';
    if (traffic >= 1000000) {
      return `${(traffic / 1000000).toFixed(1)}M`;
    } else if (traffic >= 1000) {
      return `${(traffic / 1000).toFixed(1)}K`;
    }
    return traffic.toString();
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'average':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Header avec logo et métriques */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {website.logo ? (
              <img 
                src={website.logo} 
                alt={website.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {website.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate max-w-48">{website.url}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">DA: {website.metrics?.domain_authority || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Eye className="h-4 w-4" />
              <span>{formatTraffic(website.metrics?.monthly_traffic)}/mois</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {website.description}
        </p>

        {/* Catégories et niches */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(website.category)}`}>
            {getCategoryLabel(website.category)}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNicheColor(website.niche)}`}>
            {website.niche}
          </span>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4" />
            <span>{website.available_link_spots} emplacements</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Réponse: {website.average_response_time || 'N/A'}h</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Star className="h-4 w-4" />
            <span className={getQualityColor(website.content_quality)}>
              Qualité: {website.content_quality}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{website.owner_status}</span>
          </div>
        </div>

        {/* Langues et méthodes de paiement */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Langues:</div>
          <div className="flex flex-wrap gap-1">
            {website.languages.slice(0, 3).map((lang, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full"
              >
                {lang}
              </span>
            ))}
            {website.languages.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                +{website.languages.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Paiements acceptés:</div>
          <div className="flex flex-wrap gap-1">
            {website.payment_methods.slice(0, 3).map((method, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
              >
                {method}
              </span>
            ))}
            {website.payment_methods.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                +{website.payment_methods.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Contact info */}
        {website.contact_info && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Contact:</div>
            <div className="text-sm text-gray-600">
              <div>{website.contact_info.name}</div>
              <div className="text-xs text-gray-500">{website.contact_info.email}</div>
              {website.contact_info.phone && (
                <div className="text-xs text-gray-500">{website.contact_info.phone}</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            to={`/site/${website.slug}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>Voir détails</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          
          <button
            onClick={() => onViewDetails?.(website.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Voir les liens</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default WebsiteCard; 