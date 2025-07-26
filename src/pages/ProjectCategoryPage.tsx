import React from 'react';
import { useParams } from 'react-router-dom';
import { Project, ProjectFilterOptions, ProjectType, ProjectCategory, RealProjectCategory } from '../types';
import { getProjects } from '../lib/supabase';
import { getDigitalCategoryInfo, getRealCategoryInfo, getProjectTypeFromCategory } from '../utils/categories';
import Header from '../components/Layout/Header';
import { trackPageView, trackSearch } from '../utils/analytics';
import Footer from '../components/Layout/Footer';
import ProjectGrid from '../components/Projects/ProjectGrid';
import ProjectFilters from '../components/Projects/ProjectFilters';
import SEOHead from '../components/SEO/SEOHead';
import { Search, Filter, TrendingUp, Star, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectCategoryPage: React.FC = () => {
  const { type, category } = useParams<{ type: string; category: string }>();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ProjectFilterOptions>({});
  const [search, setSearch] = React.useState('');

  // Déterminer le type de projet et obtenir les informations de catégorie
  const projectType = (type === 'projets-digitaux' ? 'digital' : 'real') as ProjectType;
  const categoryInfo = projectType === 'digital' 
    ? getDigitalCategoryInfo(category as ProjectCategory)
    : getRealCategoryInfo(category as RealProjectCategory);

  React.useEffect(() => {
    // Track page view
    trackPageView(window.location.pathname, categoryInfo.seoTitle);
    
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectFilters: ProjectFilterOptions = {
          ...filters,
          project_type: projectType,
          search: search || undefined
        };

        // Ajouter le filtre de catégorie approprié
        if (projectType === 'digital') {
          projectFilters.category = category as ProjectCategory;
        } else {
          projectFilters.real_category = category as RealProjectCategory;
        }

        const projectsData = await getProjects(projectFilters);
        setProjects(projectsData);
        
        // Si une recherche est active, tracker l'événement de recherche
        if (search) {
          trackSearch(search, projectsData.length, category);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filters, search, category, projectType]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleFiltersChange = (newFilters: ProjectFilterOptions) => {
    setFilters(newFilters);
  };

  const stats = [
    { label: 'Projets Disponibles', value: projects.length, icon: TrendingUp },
    { label: 'Catégorie', value: categoryInfo.label, icon: Target },
    { label: 'Type', value: projectType === 'digital' ? 'Digital' : 'Réel', icon: Star }
  ];

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Catégorie non trouvée</h1>
          <p className="text-gray-600">La catégorie demandée n'existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title={categoryInfo.seoTitle}
        description={categoryInfo.seoDescription}
      />
      <Header onSearchChange={handleSearchChange} searchValue={search} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">{categoryInfo.icon}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {categoryInfo.label}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {categoryInfo.longDescription}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Filters Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            </div>
            <ProjectFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </section>

        {/* Results Summary */}
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {loading ? 'Chargement...' : `${projects.length} projet(s) trouvé(s)`}
            </p>
            
            {search && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Search className="h-4 w-4" />
                <span>Recherche: "{search}"</span>
              </div>
            )}
          </div>
        </section>

        {/* Projects Grid */}
        <section>
          <ProjectGrid
            projects={projects}
            loading={loading}
            emptyMessage={
              search 
                ? `Aucun projet trouvé pour "${search}" dans cette catégorie`
                : `Aucun projet ${categoryInfo.label.toLowerCase()} trouvé pour le moment`
            }
          />
        </section>

        {/* Info Section */}
        <section className="mt-16 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pourquoi choisir {categoryInfo.label} ?
            </h2>
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p>{categoryInfo.longDescription}</p>
              
              {projectType === 'digital' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Avantages des projets digitaux
                  </h3>
                  <ul className="space-y-2">
                    <li>• Scalabilité et croissance rapide</li>
                    <li>• Faibles coûts d'exploitation</li>
                    <li>• Marché global accessible</li>
                    <li>• Revenus récurrents possibles</li>
                  </ul>
                </div>
              )}

              {projectType === 'real' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Avantages des projets réels
                  </h3>
                  <ul className="space-y-2">
                    <li>• Actifs tangibles et sécurisés</li>
                    <li>• Revenus stables et prévisibles</li>
                    <li>• Protection contre l'inflation</li>
                    <li>• Potentiel d'appréciation à long terme</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectCategoryPage;