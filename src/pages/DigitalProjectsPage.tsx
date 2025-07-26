import React from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectFilterOptions } from '../types';
import { getProjects } from '../lib/supabase';
import { DIGITAL_CATEGORIES, getAllDigitalCategories } from '../utils/categories';
import Header from '../components/Layout/Header';
import { trackPageView, trackSearch } from '../utils/analytics';
import Footer from '../components/Layout/Footer';
import ProjectGrid from '../components/Projects/ProjectGrid';
import ProjectFilters from '../components/Projects/ProjectFilters';
import SEOHead from '../components/SEO/SEOHead';
import { Search, ArrowRight, TrendingUp, Star, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DigitalProjectsPage: React.FC = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ProjectFilterOptions>({
    project_type: 'digital'
  });
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    // Track page view
    trackPageView('/projets-digitaux', 'Projets Digitaux - Startups, MVP, SaaS à Vendre | GoHaya');
    
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects({
          ...filters,
          project_type: 'digital',
          search: search || undefined
        });
        setProjects(projectsData);
        
        // Si une recherche est active, tracker l'événement de recherche
        if (search) {
          trackSearch(search, projectsData.length, 'digital');
        }
      } catch (error) {
        console.error('Error fetching digital projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filters, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleFiltersChange = (newFilters: ProjectFilterOptions) => {
    setFilters({
      ...newFilters,
      project_type: 'digital'
    });
  };

  const digitalCategories = getAllDigitalCategories();
  const stats = [
    { label: 'Projets Disponibles', value: projects.length, icon: TrendingUp },
    { label: 'Catégories', value: digitalCategories.length, icon: Target },
    { label: 'Type', value: 'Digital', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Projets Digitaux à Vendre - Startups, MVP, SaaS | GoHaya"
        description="Découvrez notre sélection de projets digitaux à vendre au Maroc : startups, MVP, applications mobiles, plateformes SaaS et sites web actifs. Investissement digital rentable."
      />
      <Header onSearchChange={handleSearchChange} searchValue={search} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">💻</div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Projets Digitaux
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Découvrez notre sélection de projets digitaux innovants : startups établies, MVP prêts à scaler, 
              applications mobiles rentables et plateformes SaaS avec revenus récurrents.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
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

        {/* Categories Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Catégories de Projets Digitaux
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Explorez nos différentes catégories de projets digitaux
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {digitalCategories.map((categoryKey, index) => {
                const category = DIGITAL_CATEGORIES[categoryKey];
                return (
                  <motion.div
                    key={categoryKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/projets-digitaux/${categoryKey}`}
                      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 group"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-4">{category.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700 transition-colors">
                          <span className="text-sm font-medium">Explorer</span>
                          <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* Filters Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtrer les Projets</h2>
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
              {loading ? 'Chargement...' : `${projects.length} projet(s) digital(s) trouvé(s)`}
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
        <section className="mb-16">
          <ProjectGrid
            projects={projects}
            loading={loading}
            emptyMessage={
              search 
                ? `Aucun projet digital trouvé pour "${search}"`
                : 'Aucun projet digital disponible pour le moment'
            }
          />
        </section>

        {/* Why Choose Digital Projects */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Zap className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">
                Pourquoi Investir dans le Digital ?
              </h2>
              <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">
                Les projets digitaux offrent une scalabilité unique et des opportunités de croissance exponentielles
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">🚀</div>
                  <h3 className="font-semibold mb-2">Scalabilité</h3>
                  <p className="text-sm opacity-80">Croissance rapide sans limites géographiques</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <h3 className="font-semibold mb-2">Revenus Récurrents</h3>
                  <p className="text-sm opacity-80">Modèles d'abonnement et revenus prévisibles</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🌍</div>
                  <h3 className="font-semibold mb-2">Marché Global</h3>
                  <p className="text-sm opacity-80">Accès à des marchés internationaux</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-2">Innovation</h3>
                  <p className="text-sm opacity-80">Technologies émergentes et tendances futures</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DigitalProjectsPage;