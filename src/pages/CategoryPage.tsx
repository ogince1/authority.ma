import React from 'react';
import { useParams } from 'react-router-dom';
import { Project, ProjectFilterOptions } from '../types';
import { getProjects } from '../lib/supabase';
import Header from '../components/Layout/Header';
import { trackPageView, trackSearch } from '../utils/analytics';
import Footer from '../components/Layout/Footer';
import ProjectGrid from '../components/Projects/ProjectGrid';
import ProjectFilters from '../components/Projects/ProjectFilters';
import SEOHead from '../components/SEO/SEOHead';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ProjectFilterOptions>({
    category: category as 'mvp' | 'startup' | 'website' | undefined
  });
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    // Track page view
    trackPageView(window.location.pathname, `${getCategoryInfo(category || '').title} | GoHaya`);
    
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects({
          ...filters,
          search: search || undefined
        });
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
  }, [filters, search]);

  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: category as 'mvp' | 'startup' | 'website' | undefined
    }));
  }, [category]);

  // Gérer le changement de recherche
  const handleSearchChange = (value: string) => {
    setSearch(value);
    
    // Ne pas tracker immédiatement pour éviter trop d'événements
    // Le tracking se fera lors du chargement des résultats
  };

  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'mvp':
        return {
          title: 'MVP - Produits Minimum Viables',
          description: 'Découvrez des MVP testés et validés par le marché, prêts à être développés',
          seoTitle: 'MVP à Vendre au Maroc | GoHaya',
          seoDescription: 'Achetez des MVP (Minimum Viable Products) testés et validés au Maroc. Projets innovants prêts à être développés à Casablanca, Rabat, Marrakech, Tanger.'
        };
      case 'startups':
        return {
          title: 'Startups Établies',
          description: 'Startups avec traction et revenus, prêtes pour une acquisition stratégique',
          seoTitle: 'Startups à Vendre au Maroc | GoHaya',
          seoDescription: 'Investissez dans des startups établies au Maroc. Entreprises avec traction et revenus prêtes pour acquisition à Casablanca, Rabat, Marrakech, Tanger.'
        };
      case 'websites':
        return {
          title: 'Sites Web & Templates',
          description: 'Sites web complets et templates prêts à utiliser pour votre business',
          seoTitle: 'Sites Web à Vendre au Maroc | GoHaya',
          seoDescription: 'Achetez des sites web complets et templates au Maroc. Solutions prêtes à utiliser pour votre business à Casablanca, Rabat, Marrakech, Tanger.'
        };
      default:
        return {
          title: 'Tous les Projets',
          description: 'Explorez notre catalogue complet de projets digitaux',
          seoTitle: 'Projets Digitaux à Vendre au Maroc | GoHaya',
          seoDescription: 'Découvrez tous nos projets digitaux à vendre au Maroc. MVP, startups et sites web de qualité à Casablanca, Rabat, Marrakech, Tanger.'
        };
    }
  };

  const categoryInfo = getCategoryInfo(category || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title={categoryInfo.seoTitle}
        description={categoryInfo.seoDescription}
      />
      <Header onSearchChange={handleSearchChange} searchValue={search} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {categoryInfo.title}
          </h1>
          <p className="text-gray-600">
            {categoryInfo.description}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {loading ? 'Chargement...' : `${projects.length} projet(s) trouvé(s)`}
          </p>
        </div>

        {/* Projects Grid */}
        <ProjectGrid
          projects={projects}
          loading={loading}
          emptyMessage={
            search 
              ? `Aucun projet trouvé pour "${search}"`
              : `Aucun projet trouvé dans cette catégorie`
          }
        />
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;