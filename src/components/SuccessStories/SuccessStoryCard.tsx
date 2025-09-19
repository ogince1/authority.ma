import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { SuccessStory } from '../../types';

interface SuccessStoryCardProps {
  story: SuccessStory;
  index?: number;
}

const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({ story, index = 0 }) => {
  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'revenue':
      case 'growth':
        return TrendingUp;
      case 'clients':
      case 'users':
        return Users;
      default:
        return Star;
    }
  };

  const formatMetricValue = (key: string, value: string) => {
    if (key === 'revenue') {
      return `${value} MAD`;
    }
    return value;
  };

  const getMetricLabel = (key: string) => {
    switch (key) {
      case 'revenue': return 'Chiffre d\'affaires';
      case 'growth': return 'Croissance';
      case 'clients': return 'Clients';
      case 'users': return 'Utilisateurs';
      case 'markets': return 'Marchés';
      case 'producers': return 'Producteurs';
      case 'orders': return 'Commandes/mois';
      case 'cities': return 'Villes';
      default: return key;
    }
  };

  // Get top 3 metrics for display
  const topMetrics = Object.entries(story.metrics).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* Header with company info */}
      <div className="relative p-6 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="flex items-center space-x-4">
          {story.company_logo && (
            <img
              src={story.company_logo}
              alt={story.company_name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
              {story.company_name}
            </h3>
            <p className="text-gray-600">{story.founder_name}</p>
            <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium mt-1">
              {story.industry}
            </span>
          </div>
          {story.featured && (
            <div className="absolute top-4 right-4">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          {story.title}
        </h4>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {story.description}
        </p>

        {/* Key Metrics */}
        {topMetrics.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {topMetrics.map(([key, value]) => {
              const Icon = getMetricIcon(key);
              return (
                <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                  <Icon className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-gray-900">
                    {formatMetricValue(key, value as string)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getMetricLabel(key)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tags */}
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {story.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {story.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                +{story.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Read More */}
        <Link
          to={`/success-stories/${story.slug}`}
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors group"
        >
          Lire l'histoire complète
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

export default SuccessStoryCard;