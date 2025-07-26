import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  LogIn,
  UserPlus,
  PieChart,
  BarChart,
  Zap,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import { trackPageView } from '../utils/analytics';
import { getCurrentUser } from '../lib/supabase';
import AuthModal from '../components/Auth/AuthModal';

const FundraisingSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

  React.useEffect(() => {
    // Track page view
    trackPageView(window.location.pathname, 'Lever des Fonds | GoHaya');
    
    // Check if user is already logged in
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
      
      // If user is logged in, redirect to dashboard
      if (currentUser) {
        navigate('/dashboard/fundraising');
      }
    };

    checkAuth();
  }, [navigate]);

  // Monitor user changes to redirect to dashboard after successful login
  React.useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!loading && !showAuthModal) {
        const currentUser = await getCurrentUser();
        if (currentUser && !user) {
          // User just logged in, redirect to dashboard
          navigate('/dashboard/fundraising');
        }
        setUser(currentUser);
      }
    };

    checkUserAndRedirect();
  }, [loading, showAuthModal, navigate, user]);

  const stages = [
    {
      value: 'pre_seed',
      label: 'Pré-Seed',
      description: 'Phase d\'amorçage, validation du concept',
      icon: '🌱',
      typical: '50k - 500k MAD'
    },
    {
      value: 'seed',
      label: 'Seed',
      description: 'Développement produit et premières ventes',
      icon: '🚀',
      typical: '500k - 2M MAD'
    },
    {
      value: 'series_a',
      label: 'Série A',
      description: 'Croissance et expansion du marché',
      icon: '📈',
      typical: '2M - 10M MAD'
    },
    {
      value: 'series_b',
      label: 'Série B',
      description: 'Expansion géographique et développement',
      icon: '🌍',
      typical: '10M+ MAD'
    },
    {
      value: 'bridge',
      label: 'Bridge',
      description: 'Financement de transition',
      icon: '🌉',
      typical: 'Variable'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Réseau d\'Investisseurs',
      description: 'Accédez à notre réseau qualifié d\'investisseurs et business angels'
    },
    {
      icon: Shield,
      title: 'Processus Sécurisé',
      description: 'Toutes les transactions sont sécurisées et vérifiées par notre équipe'
    },
    {
      icon: Zap,
      title: 'Rapidité',
      description: 'Connectez-vous rapidement avec des investisseurs intéressés par votre secteur'
    },
    {
      icon: Users,
      title: 'Accompagnement',
      description: 'Notre équipe vous accompagne tout au long du processus de levée de fonds'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Lever des Fonds au Maroc | GoHaya - Financement Startup"
        description="Levez des fonds pour votre startup avec GoHaya au Maroc. Connectez-vous avec des investisseurs qualifiés et accélérez votre croissance à Casablanca, Rabat, Marrakech, Tanger."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Levez des Fonds pour Votre
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {' '}Startup
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Connectez-vous avec des investisseurs qualifiés et accélérez la croissance de votre startup. 
              Notre plateforme facilite la rencontre entre entrepreneurs et investisseurs.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Investisseurs vérifiés</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Processus sécurisé</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Accompagnement personnalisé</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Lever des Fonds avec GoHaya ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Notre plateforme offre tous les outils nécessaires pour réussir votre levée de fonds
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 text-center shadow-sm"
              >
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <benefit.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Stages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stades d'Investissement
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nous accompagnons les startups à tous les stades de développement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stages.map((stage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3 text-center">{stage.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  {stage.label}
                </h3>
                <p className="text-gray-600 text-sm mb-3 text-center">
                  {stage.description}
                </p>
                <div className="text-center">
                  <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {stage.typical}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-4">
              Prêt à Lever des Fonds ?
            </h2>
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
              Connectez-vous à votre compte pour créer votre profil d'investissement et commencer 
              à recevoir des propositions d'investisseurs qualifiés.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors inline-flex items-center justify-center"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Se Connecter
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="bg-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-400 transition-colors inline-flex items-center justify-center border-2 border-purple-400"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Créer un Compte
              </button>
            </div>
            
            <div className="mt-6 text-sm text-purple-100">
              <p>
                Déjà inscrit ? 
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-white font-medium hover:underline ml-1"
                >
                  Connectez-vous
                </button>
              </p>
              <p className="mt-2">
                Nouveau sur GoHaya ? 
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="text-white font-medium hover:underline ml-1"
                >
                  Créez votre compte gratuitement
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Résultats
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des chiffres qui témoignent de notre succès dans l'accompagnement des startups
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                value: '25M+',
                label: 'MAD Levés',
                color: 'text-green-600'
              },
              {
                icon: Users,
                value: '150+',
                label: 'Investisseurs',
                color: 'text-blue-600'
              },
              {
                icon: PieChart,
                value: '75%',
                label: 'Taux de Réussite',
                color: 'text-purple-600'
              },
              {
                icon: BarChart,
                value: '3M',
                label: 'Ticket Moyen',
                color: 'text-orange-600'
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 text-center shadow-sm"
              >
                <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça Marche ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un processus simple et efficace pour lever des fonds
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Inscription',
                description: 'Créez votre compte et complétez votre profil entreprise'
              },
              {
                step: '2',
                title: 'Pitch Deck',
                description: 'Préparez votre présentation avec notre aide'
              },
              {
                step: '3',
                title: 'Matching',
                description: 'Nous vous connectons avec des investisseurs pertinents'
              },
              {
                step: '4',
                title: 'Financement',
                description: 'Négociez et finalisez votre levée de fonds'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      <Footer />
    </div>
  );
};

export default FundraisingSubmissionPage;