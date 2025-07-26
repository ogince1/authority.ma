import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye, Star, Clock, MapPin, User, TrendingUp, Target, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackOutboundLink } from '../../utils/analytics';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index = 0 }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mvp':
        return 'MVP';
      case 'startup':
        return 'Startup';
      case 'website':
        return 'Site Web';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mvp':
        return 'bg-orange-100 text-orange-800';
      case 'startup':
        return 'bg-green-100 text-green-800';
      case 'website':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getObjectiveLabel = (objective: string) => {
    switch (objective) {
      case 'vente':
        return 'Vente';
      case 'location':
        return 'Location';
      case 'levee_fonds':
        return 'Levée de fonds';
      default:
        return objective;
    }
  };

  const getObjectiveColor = (objective: string) => {
    switch (objective) {
      case 'vente':
        return 'bg-blue-100 text-blue-800';
      case 'location':
        return 'bg-green-100 text-green-800';
      case 'levee_fonds':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOwnerStatusLabel = (status: string) => {
    switch (status) {
      case 'professionnel':
        return 'Professionnel';
      case 'particulier':
        return 'Particulier';
      case 'entreprise':
        return 'Entreprise';
      default:
        return status;
    }
  };

  const getOwnerStatusIcon = (status: string) => {
    switch (status) {
      case 'professionnel':
        return '👨‍💼';
      case 'particulier':
        return '👤';
      case 'entreprise':
        return '🏢';
      default:
        return '👤';
    }
  };

  const handleDemoClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    // Track outbound link click
    trackOutboundLink(url, 'demo', 'Voir la démo');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.images[0] || 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg'}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(project.category)}`}>
            {getCategoryLabel(project.category)}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Price */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {project.title}
          </h3>
          <div className="text-right ml-2">
            {project.show_price !== false ? (
              <div className="text-lg font-bold text-blue-600">
                {formatPrice(project.price)}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Prix sur demande
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
          {project.description}
        </p>

        {/* Nouvelle structure standardisée */}
        <div className="space-y-3 mb-4">
          {/* 📍 Localisation (si applicable) */}
          {project.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{project.location}</span>
            </div>
          )}

          {/* 👨‍💼 Statut du propriétaire */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>{getOwnerStatusIcon(project.owner_status)} {getOwnerStatusLabel(project.owner_status)}</span>
          </div>

          {/* 📈 Indicateurs */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Indicateurs:</span>
            </div>
            <div className="ml-6 space-y-1 text-xs text-gray-500">
              {project.metrics?.monthly_traffic && (
                <div>• Trafic mensuel: {project.metrics.monthly_traffic.toLocaleString()}</div>
              )}
              {project.metrics?.leads_clients && (
                <div>• Leads/clients: {project.metrics.leads_clients}</div>
              )}
              {project.metrics?.revenue && (
                <div>• Revenus: {project.metrics.revenue.toLocaleString()} MAD/mois</div>
              )}
              {project.metrics?.material_condition && (
                <div>• État: {project.metrics.material_condition}</div>
              )}
              {(!project.metrics?.monthly_traffic && !project.metrics?.leads_clients && !project.metrics?.revenue && !project.metrics?.material_condition) && (
                <div className="italic">Indicateurs non renseignés</div>
              )}
            </div>
          </div>

          {/* 📝 Objectif */}
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getObjectiveColor(project.objective)}`}>
              {getObjectiveLabel(project.objective)}
            </span>
          </div>
        </div>

        {/* Tech Stack (condensé) */}
        {project.tech_stack.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {project.tech_stack.slice(0, 3).map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                >
                  {tech}
                </span>
              ))}
              {project.tech_stack.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                  +{project.tech_stack.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Link
            to={`/project/${project.slug}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium text-sm"
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Voir Détails
          </Link>
          
          {/* 📮 Bouton contacter (pour les investisseurs) */}
          {project.objective === 'levee_fonds' && (
            <button className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">
              <Mail className="h-4 w-4 inline mr-1" />
              Contacter
            </button>
          )}
          
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleDemoClick(e, project.demo_url as string)}
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;