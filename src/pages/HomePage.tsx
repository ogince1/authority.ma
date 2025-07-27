import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Users, TrendingUp, Globe, Link as LinkIcon, Search, DollarSign, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Website, LinkListing } from '../types';
import { getWebsites, getLinkListings } from '../lib/supabase';
import { trackPageView } from '../utils/analytics';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const HomePage: React.FC = () => {
  const [featuredWebsites, setFeaturedWebsites] = React.useState<Website[]>([]);
  const [featuredLinks, setFeaturedLinks] = React.useState<LinkListing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Track page view
    trackPageView('/', 'Authority.ma - Plateforme de Vente de Liens au Maroc');
    
    const fetchFeaturedContent = async () => {
      try {
        const [websites, links] = await Promise.all([
          getWebsites(),
          getLinkListings()
        ]);
        setFeaturedWebsites(websites.slice(0, 3));
        setFeaturedLinks(links.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  const stats = [
    { label: 'Sites Web Actifs', value: '150+', icon: Globe },
    { label: 'Liens Disponibles', value: '500+', icon: LinkIcon },
    { label: 'Annonceurs', value: '300+', icon: Users },
    { label: 'Taux de Satisfaction', value: '95%', icon: Star }
  ];

  const linkTypes = [
    {
      type: 'dofollow',
      title: 'Liens Dofollow',
      description: 'Liens de haute qualité qui transmettent l\'autorité SEO',
      icon: TrendingUp,
      color: 'blue',
      link: '/liens/dofollow',
      examples: ['Header', 'Footer', 'Contenu', 'Sidebar']
    },
    {
      type: 'nofollow',
      title: 'Liens Nofollow',
      description: 'Liens pour la visibilité et le trafic sans impact SEO',
      icon: Globe,
      color: 'emerald',
      link: '/liens/nofollow',
      examples: ['Articles', 'Commentaires', 'Ressources', 'Partners']
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Liens de Qualité',
      description: 'Sites web vérifiés avec métriques SEO transparentes'
    },
    {
      icon: Zap,
      title: 'Réponse Rapide',
      description: 'Mise en place des liens en moins de 24h'
    },
    {
      icon: DollarSign,
      title: 'Prix Transparents',
      description: 'Tarifs clairs en MAD sans commissions cachées'
    },
    {
      icon: Clock,
      title: 'Suivi Continu',
      description: 'Monitoring des liens et rapports de performance'
    }
  ];

  const websiteCategories = [
    { name: 'Blogs', count: '45+', color: 'bg-blue-100 text-blue-800' },
    { name: 'E-commerce', count: '30+', color: 'bg-green-100 text-green-800' },
    { name: 'Actualités', count: '25+', color: 'bg-red-100 text-red-800' },
    { name: 'Lifestyle', count: '20+', color: 'bg-purple-100 text-purple-800' },
    { name: 'Tech', count: '15+', color: 'bg-orange-100 text-orange-800' },
    { name: 'Business', count: '15+', color: 'bg-indigo-100 text-indigo-800' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Authority.ma - Plateforme de Vente de Liens au Maroc"
        description="Achetez et vendez des liens de qualité au Maroc. Sites web vérifiés, prix transparents, mise en place rapide. Améliorez votre SEO avec des liens dofollow et nofollow de confiance."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg')] bg-cover bg-center opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Vente de Liens au{' '}
              <span className="text-blue-600">Maroc</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              La première plateforme marocaine pour acheter et vendre des liens de qualité. 
              Améliorez votre SEO avec des liens dofollow et nofollow de sites web vérifiés.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/liens"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Acheter des Liens
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/vendre-liens"
                className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Vendre des Liens
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Link Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Types de Liens Disponibles
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le type de lien qui correspond à vos objectifs SEO et marketing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {linkTypes.map((type, index) => (
              <motion.div
                key={type.type}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-lg bg-${type.color}-100 mr-4`}>
                    <type.icon className={`h-8 w-8 text-${type.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{type.title}</h3>
                </div>
                <p className="text-gray-600 mb-6">{type.description}</p>
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Positions disponibles :</h4>
                  <div className="flex flex-wrap gap-2">
                    {type.examples.map((example) => (
                      <span key={example} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to={type.link}
                  className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                >
                  Voir les liens {type.type}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sites Web par Catégorie
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trouvez des liens sur des sites web de votre niche
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {websiteCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${category.color}`}>
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Authority.ma ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme complète et sécurisée pour vos besoins de liens
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Links Section */}
      {!loading && featuredLinks.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Liens en Vedette
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Découvrez nos meilleurs liens disponibles
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {featuredLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      link.link_type === 'dofollow' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {link.link_type}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {link.price} {link.currency}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-gray-600 mb-4">{link.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Position: {link.position}
                    </span>
                    <Link
                      to={`/lien/${link.slug}`}
                      className="text-blue-600 font-semibold hover:text-blue-700"
                    >
                      Voir détails
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                to="/liens"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir Tous les Liens
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Prêt à Améliorer votre SEO ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Rejoignez des centaines d'annonceurs et d'éditeurs qui font confiance à Authority.ma
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/inscription"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Commencer Maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Nous Contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;