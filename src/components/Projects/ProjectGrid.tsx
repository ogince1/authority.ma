import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import ProjectCard from './ProjectCard';
import { trackSearch } from '../../utils/analytics';
import { Search } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
  loading?: boolean;
  emptyMessage?: string;
}

const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects, 
  loading = false, 
  emptyMessage = "Aucun projet trouvé" 
}) => {
  // Tracker les résultats de recherche vides si applicable
  React.useEffect(() => {
    if (!loading && projects.length === 0 && emptyMessage.includes('Aucun projet trouvé pour')) {
      const searchTerm = emptyMessage.match(/\"([^\"]+)\"/)?.[1];
      if (searchTerm) {
        trackSearch(searchTerm, 0, window.location.pathname.split('/')[1] || 'all');
      }
    }
  }, [loading, projects.length, emptyMessage]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded w-3/5"></div>
              </div>
              <div className="flex space-x-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-14"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Search className="h-24 w-24 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos filtres ou revenez plus tard pour voir de nouveaux projets.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </motion.div>
  );
};

export default ProjectGrid;