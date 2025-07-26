import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Users, TrendingUp, Laptop, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { getProjects } from '../lib/supabase';
import { getFeaturedSuccessStories } from '../lib/supabase';
import SuccessStoryCard from '../components/SuccessStories/SuccessStoryCard';
import { trackPageView } from '../utils/analytics';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import ProjectGrid from '../components/Projects/ProjectGrid';
import SEOHead from '../components/SEO/SEOHead';

const HomePage: React.FC = () => {
  const [featuredProjects, setFeaturedProjects] = React.useState<Project[]>([]);
  const [featuredStories, setFeaturedStories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Track page view
    trackPageView('/', 'GoHaya - Marketplace de Projets Digitaux et Réels');
    
    const fetchFeaturedProjects = async () => {
      try {
        const [projects, stories] = await Promise.all([
          getProjects(),
          getFeaturedSuccessStories()
        ]);
        setFeaturedProjects(projects.slice(0, 3));
        setFeaturedStories(stories.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  const stats = [
    { label: 'Projets Disponibles', value: '50+', icon: TrendingUp },
    { label: 'Entrepreneurs', value: '200+', icon: Users },
    { label: 'Transactions', value: '25+', icon: Shield },
    { label: 'Taux de Succès', value: '85%', icon: Zap }
  ];

  const projectTypes = [
    {
      type: 'digital',
      title: 'Projets Digitaux',
      description: 'Startups, MVP, SaaS, applications mobiles et sites web rentables',
      icon: Laptop,
      color: 'blue',
      link: '/projets-digitaux',
      examples: ['Startups Tech', 'Plateformes SaaS', 'Applications Mobiles', 'Sites Web Actifs']
    },
    {
      type: 'real',
      title: 'Projets Réels',
      description: 'Fonds de commerce, immobilier, franchises et projets industriels',
      icon: Building,
      color: 'emerald',
      link: '/projets-reels',
      examples: ['Fonds de Commerce', 'Restaurants de Luxe', 'Projets Immobiliers', 'Franchises']
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Transactions Sécurisées',
      description: 'Système de paiement sécurisé avec protection des acheteurs et vendeurs'
    },
    {
      icon: Zap,
      title: 'Validation Rapide',
      description: 'Processus de validation des projets en moins de 48h'
    },
    {
      icon: Users,
      title: 'Communauté Active',
      description: 'Réseau d\'entrepreneurs et d\'investisseurs marocains'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="GoHaya - Marketplace de Projets Digitaux et Réels au Maroc"
        description="Découvrez et achetez des projets digitaux et réels au Maroc : startups, SaaS, fonds de commerce, immobilier. Plateforme sécurisée pour entrepreneurs et investisseurs à Casablanca, Rabat, Marrakech, Tanger."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg')] bg-cover bg-center opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Découvrez des Projets
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600">
                  {' '}Exceptionnels
                </span>
                <br />
                avec GoHaya
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                La plateforme innovante pour découvrir, évaluer et acquérir des projets 
                digitaux et réels de qualité. Connectez-vous avec une communauté d'entrepreneurs 
                et d'investisseurs visionnaires.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/projets-digitaux"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Laptop className="mr-2 h-5 w-5" />
                  Projets Digitaux
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/projets-reels"
                  className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
                >
                  <Building className="mr-2 h-5 w-5" />
                  Projets Réels
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/vendre"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Vendre votre Projet
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Project Types Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Types de Projets
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explorez nos deux catégories principales de projets d'investissement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {projectTypes.map((projectType, index) => (
              <motion.div
                key={projectType.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`bg-gradient-to-r ${projectType.color === 'blue' ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600'} p-8 text-white`}>
                  <projectType.icon className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{projectType.title}</h3>
                  <p className="text-blue-100 mb-4">{projectType.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {projectType.examples.map((example, i) => (
                      <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <Link
                    to={projectType.link}
                    className={`inline-flex items-center px-6 py-3 ${projectType.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg font-medium transition-colors`}
                  >
                    Explorer {projectType.title}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Projets en Vedette
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez une sélection de nos meilleurs projets disponibles à l'achat
            </p>
          </div>
          
          <ProjectGrid projects={featuredProjects} loading={loading} />
          
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/projets-digitaux"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Laptop className="mr-2 h-5 w-5" />
                Projets Digitaux
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/projets-reels"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <Building className="mr-2 h-5 w-5" />
                Projets Réels
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Success Stories */}
      {featuredStories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Success Stories
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Découvrez les histoires inspirantes d'entrepreneurs qui ont réussi avec GoHaya
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {featuredStories.map((story, index) => (
                <SuccessStoryCard key={story.id} story={story} index={index} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                to="/success-stories"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Voir Toutes les Success Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir GoHaya ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une plateforme conçue pour faciliter l'achat et la vente de projets digitaux et réels au Maroc
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm text-center"
              >
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à Commencer ?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Rejoignez notre communauté d'entrepreneurs et trouvez votre prochain projet digital ou réel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/projets-digitaux"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
              >
                <Laptop className="mr-2 h-5 w-5" />
                Projets Digitaux
              </Link>
              <Link
                to="/projets-reels"
                className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center"
              >
                <Building className="mr-2 h-5 w-5" />
                Projets Réels
              </Link>
              <Link
                to="/vendre"
                className="bg-transparent text-white px-8 py-3 rounded-lg font-medium border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Vendre votre Projet
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;