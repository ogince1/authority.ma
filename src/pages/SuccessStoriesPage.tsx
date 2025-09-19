import React from 'react';
import { Search, Award, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { SuccessStory } from '../types';
import { getSuccessStories, getFeaturedSuccessStories } from '../lib/supabase';
import { trackPageView, trackSearch, trackFilter } from '../utils/analytics';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SuccessStoryCard from '../components/SuccessStories/SuccessStoryCard';
import SEOHead from '../components/SEO/SEOHead';

const SuccessStoriesPage: React.FC = () => {
  const [stories, setStories] = React.useState<SuccessStory[]>([]);
  const [featuredStories, setFeaturedStories] = React.useState<SuccessStory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIndustry, setSelectedIndustry] = React.useState<string>('all');

  React.useEffect(() => {
    // Track page view
    trackPageView('/success-stories', 'Success Stories GoHaya - Histoires de Réussite d\'Entrepreneurs');
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storiesData, featuredData] = await Promise.all([
        getSuccessStories({ status: 'published' }),
        getFeaturedSuccessStories()
      ]);
      
      setStories(storiesData);
      setFeaturedStories(featuredData);
      
      // Si une recherche est active, tracker l'événement
      if (searchTerm) {
        trackSearch(searchTerm, filteredStories.length, 'success_stories');
      }
    } catch (error) {
      console.error('Error fetching success stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || story.industry === selectedIndustry;
    
    return matchesSearch && matchesIndustry;
  });

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry);
    trackFilter('success_story_industry', industry, 0);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Le tracking se fera après le filtrage des résultats
  };

  // Get unique industries
  const industries = [...new Set(stories.map(story => story.industry))].sort();

  const stats = [
    { label: 'Success Stories', value: stories.length, icon: Award },
    { label: 'Entreprises Inspirantes', value: `${stories.length}+`, icon: TrendingUp },
    { label: 'Secteurs Représentés', value: industries.length, icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Success Stories GoHaya - Histoires de Réussite d'Entrepreneurs"
        description="Découvrez les histoires inspirantes d'entrepreneurs qui ont réussi grâce à GoHaya. Témoignages, métriques et conseils pour votre succès."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Success
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600">
                {' '}Stories
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Découvrez les histoires inspirantes d'entrepreneurs qui ont transformé 
              leurs idées en succès grâce à GoHaya. Laissez-vous inspirer par leurs parcours.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                <span>Histoires vérifiées</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Métriques réelles</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <span>Conseils pratiques</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <stat.icon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Featured Stories */}
        {featuredStories.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Histoires à la Une
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nos success stories les plus inspirantes
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredStories.map((story, index) => (
                <SuccessStoryCard key={story.id} story={story} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher une success story..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => handleIndustryChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">Tous les secteurs</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>

              {/* Results count */}
              <div className="flex items-center text-sm text-gray-600">
                {loading ? 'Chargement...' : `${filteredStories.length} success stor${filteredStories.length > 1 ? 'ies' : 'y'} trouvée(s)`}
              </div>
            </div>
          </div>
        </div>

        {/* All Stories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedIndustry !== 'all' ? `Success Stories - ${selectedIndustry}` : 'Toutes les Success Stories'}
            </h2>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Award className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune success story trouvée
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos filtres ou revenez plus tard pour découvrir de nouvelles histoires.
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map((story, index) => (
                <SuccessStoryCard key={story.id} story={story} index={index} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SuccessStoriesPage;