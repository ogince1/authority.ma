import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, DollarSign, TrendingUp, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackPageView } from '../utils/analytics';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const SellLinksPage: React.FC = () => {
  React.useEffect(() => {
    trackPageView('/vendre-liens', 'Vendre des Liens - Authority.ma');
  }, []);

  const benefits = [
    {
      icon: DollarSign,
      title: 'Revenus Passifs',
      description: 'Gagnez de l\'argent en monétisant votre site web avec des liens de qualité'
    },
    {
      icon: TrendingUp,
      title: 'Trafic Qualifié',
      description: 'Recevez du trafic ciblé de sites web de votre niche'
    },
    {
      icon: Clock,
      title: 'Gestion Simple',
      description: 'Interface intuitive pour gérer vos annonces et demandes'
    },
    {
      icon: Shield,
      title: 'Paiements Sécurisés',
      description: 'Transactions sécurisées avec paiement automatique'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Créer votre profil',
      description: 'Inscrivez-vous et créez votre profil d\'éditeur'
    },
    {
      number: '02',
      title: 'Ajouter votre site',
      description: 'Ajoutez votre site web avec ses métriques SEO'
    },
    {
      number: '03',
      title: 'Créer des annonces',
      description: 'Publiez des annonces de liens avec vos tarifs'
    },
    {
      number: '04',
      title: 'Recevoir des demandes',
      description: 'Gérez les demandes d\'achat et négociez'
    }
  ];

  const requirements = [
    'Site web actif avec du contenu original',
    'Trafic mensuel minimum de 1,000 visiteurs',
    'Contenu de qualité sans spam',
    'Respect des directives Google',
    'Disponibilité pour répondre aux demandes'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Vendre des Liens - Authority.ma"
        description="Monétisez votre site web en vendant des liens de qualité. Rejoignez notre réseau d'éditeurs et gagnez des revenus passifs."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Vendez vos Liens
              <span className="text-blue-600"> en Toute Simplicité</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Transformez votre site web en source de revenus. Rejoignez notre réseau d'éditeurs 
              et commencez à gagner de l'argent en vendant des liens de qualité.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Commencer à Vendre
                <Plus className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                En Savoir Plus
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Vendre sur Authority.ma ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Rejoignez une plateforme sécurisée et professionnelle pour monétiser votre site web
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <benefit.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça Marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              En 4 étapes simples, commencez à gagner de l'argent avec vos liens
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 text-center"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Exigences pour les Éditeurs
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Pour maintenir la qualité de notre réseau, nous demandons à nos éditeurs de respecter certains critères :
              </p>
              <ul className="space-y-4">
                {requirements.map((requirement, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span className="text-gray-700">{requirement}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6">Prêt à Commencer ?</h3>
              <p className="text-blue-100 mb-6">
                Rejoignez des centaines d'éditeurs qui gagnent déjà de l'argent avec Authority.ma
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5" />
                  <span>Inscription gratuite</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5" />
                  <span>Commission de 15% seulement</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  <span>Paiements sécurisés</span>
                </div>
              </div>
              <Link
                to="/register"
                className="inline-block mt-6 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Créer mon Compte
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Chiffres Clés
            </h2>
            <p className="text-xl text-gray-600">
              Notre plateforme en quelques chiffres
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">Sites Web Actifs</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Liens Vendus</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Taux de Satisfaction</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">24h</div>
              <div className="text-gray-600">Temps de Réponse</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Commencez à Gagner de l'Argent Aujourd'hui
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Rejoignez notre réseau d'éditeurs et transformez votre site web en source de revenus
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Créer mon Compte Gratuit
              <Plus className="ml-2 h-5 w-5" />
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

export default SellLinksPage; 