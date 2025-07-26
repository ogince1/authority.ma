import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, Send, DollarSign, Tag, Globe, Image, FileText, Code, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import { trackPageView } from '../utils/analytics';
import { getCurrentUser } from '../lib/supabase';
import AuthModal from '../components/Auth/AuthModal';

const SellStartupPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

  React.useEffect(() => {
    // Track page view
    trackPageView(window.location.pathname, 'Vendre votre Startup | GoHaya');
    
    // Check if user is already logged in
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
      
      // If user is logged in, redirect to dashboard
      if (currentUser) {
        navigate('/dashboard');
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
          navigate('/dashboard');
        }
        setUser(currentUser);
      }
    };

    checkUserAndRedirect();
  }, [loading, showAuthModal, navigate, user]);

  const benefits = [
    {
      icon: Upload,
      title: 'Processus Simple',
      description: 'Soumettez votre projet en quelques minutes avec notre formulaire intuitif'
    },
    {
      icon: FileText,
      title: 'Validation Rapide',
      description: 'Notre équipe examine votre projet sous 48h et vous donne un retour détaillé'
    },
    {
      icon: DollarSign,
      title: 'Valorisation Optimale',
      description: 'Nous vous aidons à fixer le prix optimal pour maximiser vos chances de vente'
    },
    {
      icon: Globe,
      title: 'Visibilité Maximale',
      description: 'Votre projet sera visible par notre réseau d\'entrepreneurs et investisseurs'
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
        title="Vendre votre Startup au Maroc | GoHaya - Plateforme de Vente"
        description="Vendez votre MVP, startup ou site web sur GoHaya au Maroc. Processus simple, validation rapide et visibilité maximale auprès d'investisseurs à Casablanca, Rabat, Marrakech, Tanger."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Vendez Votre Projet Digital
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transformez votre MVP, startup ou site web en opportunité d'investissement. 
              Rejoignez notre plateforme et connectez-vous avec des acheteurs sérieux.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Validation sous 48h</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Commission transparente</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <span>Support personnalisé</span>
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
              Pourquoi Vendre sur GoHaya ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une plateforme conçue pour maximiser vos chances de succès avec un accompagnement personnalisé
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
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
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

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-4">
              Prêt à Vendre Votre Projet ?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Connectez-vous à votre compte pour accéder au formulaire de soumission et commencer 
              à présenter votre projet à notre réseau d'investisseurs qualifiés.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Se Connecter
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors inline-flex items-center justify-center border-2 border-blue-400"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Créer un Compte
              </button>
            </div>
            
            <div className="mt-6 text-sm text-blue-100">
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

      {/* Process Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça Marche ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un processus simple et transparent pour vendre votre projet digital
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Inscription',
                description: 'Créez votre compte gratuitement sur notre plateforme'
              },
              {
                step: '2',
                title: 'Soumission',
                description: 'Remplissez le formulaire avec les détails de votre projet'
              },
              {
                step: '3',
                title: 'Validation',
                description: 'Notre équipe examine votre projet sous 48h'
              },
              {
                step: '4',
                title: 'Vente',
                description: 'Votre projet est publié et vous recevez des propositions'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
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

export default SellStartupPage;