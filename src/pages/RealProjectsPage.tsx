import React from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectFilterOptions } from '../types';
import { getProjects } from '../lib/supabase';
import { REAL_CATEGORIES, getAllRealCategories } from '../utils/categories';
import Header from '../components/Layout/Header';
import { trackPageView, trackSearch } from '../utils/analytics';
import Footer from '../components/Layout/Footer';
import ProjectGrid from '../components/Projects/ProjectGrid';
import ProjectFilters from '../components/Projects/ProjectFilters';
import SEOHead from '../components/SEO/SEOHead';
import { Search, ArrowRight, TrendingUp, Star, Target, Building } from 'lucide-react';
import { motion } from 'framer-motion';

const RealProjectsPage: React.FC = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ProjectFilterOptions>({
    project_type: 'real'
  });
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    // Track page view
    trackPageView('/projets-reels', 'Projets Réels - Immobilier, Commerce, Industrie | GoHaya');
    
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects({
          ...filters,
          project_type: 'real',
          search: search || undefined
        });
        setProjects(projectsData);
        
        // Si une recherche est active, tracker l'événement de recherche
        if (search) {
          trackSearch(search, projectsData.length, 'real');
        }
      } catch (error) {
        console.error('Error fetching real projects:', error);
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
      project_type: 'real'
    });
  };

  const realCategories = getAllRealCategories();
  const stats = [
    { label: 'Projets Disponibles', value: projects.length, icon: TrendingUp },
    { label: 'Catégories', value: realCategories.length, icon: Target },
    { label: 'Type', value: 'Réel', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Projets Réels à Vendre - Immobilier, Commerce, Industrie | GoHaya"
        description="Découvrez notre sélection de projets réels à vendre au Maroc : fonds de commerce, immobilier, projets industriels, franchises et établissements de luxe. Investissement tangible et rentable."
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
            <div className="text-6xl mb-6">🏢</div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Projets Réels
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Investissez dans des projets tangibles et rentables : fonds de commerce établis, 
              biens immobiliers, projets industriels et franchises à haute valeur ajoutée.
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
                    <stat.icon className="h-8 w-8 text-emerald-600" />
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
              Catégories de Projets Réels
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Explorez nos différentes catégories de projets à haute valeur ajoutée
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {realCategories.map((categoryKey, index) => {
                const category = REAL_CATEGORIES[categoryKey];
                return (
                  <motion.div
                    key={categoryKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/projets-reels/${categoryKey}`}
                      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 group"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-4">{category.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-center text-emerald-600 group-hover:text-emerald-700 transition-colors">
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
              {loading ? 'Chargement...' : `${projects.length} projet(s) réel(s) trouvé(s)`}
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
                ? `Aucun projet réel trouvé pour "${search}"`
                : 'Aucun projet réel disponible pour le moment'
            }
          />
        </section>

        {/* Why Choose Real Projects */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Building className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">
                Pourquoi Investir dans le Réel ?
              </h2>
              <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">
                Les projets réels offrent une sécurité d'investissement et des rendements stables
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏗️</div>
                  <h3 className="font-semibold mb-2">Actifs Tangibles</h3>
                  <p className="text-sm opacity-80">Investissements dans des biens physiques et durables</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💎</div>
                  <h3 className="font-semibold mb-2">Valeur Stable</h3>
                  <p className="text-sm opacity-80">Protection contre l'inflation et volatilité</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <h3 className="font-semibold mb-2">Revenus Réguliers</h3>
                  <p className="text-sm opacity-80">Flux de revenus prévisibles et constants</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-2">Expertise Local</h3>
                  <p className="text-sm opacity-80">Connaissance approfondie du marché marocain</p>
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

export default RealProjectsPage;