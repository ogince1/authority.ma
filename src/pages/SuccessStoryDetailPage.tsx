import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  User, 
  Target,
  Lightbulb,
  TrendingUp,
  Star,
  Share2,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SuccessStory } from '../types';
import { getSuccessStoryBySlug } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const SuccessStoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = React.useState<SuccessStory | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStory = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const storyData = await getSuccessStoryBySlug(slug);
        setStory(storyData);
      } catch (error) {
        console.error('Error fetching success story:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [slug]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = story?.title || '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  };

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'revenue':
      case 'growth':
        return TrendingUp;
      case 'clients':
      case 'users':
        return User;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Success story non trouvée
            </h1>
            <p className="text-gray-600 mb-8">
              L'histoire que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/success-stories"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour aux success stories
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={story.meta_title || `${story.title} | Success Stories GoHaya`}
        description={story.meta_description || story.description}
        image={story.company_logo}
        url={`https://gohaya.com/success-stories/${story.slug}`}
        type="article"
      />
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/success-stories"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux success stories
        </Link>

        <article>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
              <div className="flex items-center space-x-6 mb-6">
                {story.company_logo && (
                  <img
                    src={story.company_logo}
                    alt={story.company_name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {story.company_name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{story.founder_name}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                      {story.industry}
                    </span>
                    {story.featured && (
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    )}
                  </div>
                </div>
                {story.founder_image && (
                  <img
                    src={story.founder_image}
                    alt={story.founder_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {story.title}
              </h2>

              <p className="text-lg text-gray-700 leading-relaxed">
                {story.description}
              </p>
            </div>
          </motion.header>

          {/* Key Metrics */}
          {Object.keys(story.metrics).length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Métriques Clés</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(story.metrics).map(([key, value]) => {
                  const Icon = getMetricIcon(key);
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <Icon className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatMetricValue(key, value as string)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getMetricLabel(key)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Main Story */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">L'Histoire</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {story.story_content}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Challenge, Solution, Results */}
          {(story.challenge || story.solution || story.results) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {story.challenge && (
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Target className="h-6 w-6 text-red-600 mr-2" />
                      <h4 className="text-lg font-semibold text-gray-900">Défi</h4>
                    </div>
                    <p className="text-gray-700">{story.challenge}</p>
                  </div>
                )}

                {story.solution && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Lightbulb className="h-6 w-6 text-blue-600 mr-2" />
                      <h4 className="text-lg font-semibold text-gray-900">Solution</h4>
                    </div>
                    <p className="text-gray-700">{story.solution}</p>
                  </div>
                )}

                {story.results && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                      <h4 className="text-lg font-semibold text-gray-900">Résultats</h4>
                    </div>
                    <p className="text-gray-700">{story.results}</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Additional Images */}
          {story.images.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Galerie</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {story.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${story.company_name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Tags */}
          {story.tags.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* Share */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="border-t pt-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600 font-medium">Partager cette success story</span>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default SuccessStoryDetailPage;