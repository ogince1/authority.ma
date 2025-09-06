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
    trackPageView('/vendre-liens', 'Vendre des Liens - Back.ma');
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
        title="Vendre des Liens au Maroc - Monétisez votre Site Web | Back.ma"
        description="Transformez votre site web en source de revenus ! Vendez des liens de qualité sur Back.ma, la plateforme marocaine de netlinking. Rejoignez 150+ éditeurs qui gagnent déjà. Inscription gratuite, paiements sécurisés, commission 15% seulement."
        keywords="vendre liens, monétiser site web, revenus passifs, netlinking Maroc, éditeur liens, Back.ma, commission liens, paiement sécurisé, autorité domaine"
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
              Pourquoi Vendre sur Back.ma ?
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
                Rejoignez des centaines d'éditeurs qui gagnent déjà de l'argent avec Back.ma
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

      {/* Guide Complet Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Guide Complet : Comment Vendre des Liens au Maroc
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tout ce que vous devez savoir pour réussir dans la vente de liens au Maroc
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                💰 Combien Puis-je Gagner en Vendant des Liens ?
              </h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Sites à Haute Autorité (DR 50+)</h4>
                  <p className="text-green-700">200-500 MAD par lien • 5-10 liens/mois = 1,000-5,000 MAD</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Sites Moyenne Autorité (DR 30-49)</h4>
                  <p className="text-blue-700">100-200 MAD par lien • 10-20 liens/mois = 1,000-4,000 MAD</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Sites Débutants (DR 20-29)</h4>
                  <p className="text-orange-700">50-100 MAD par lien • 15-30 liens/mois = 750-3,000 MAD</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🎯 Stratégies pour Maximiser vos Revenus
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Optimisez votre Contenu</h4>
                    <p className="text-gray-600 text-sm">Créez du contenu de qualité qui attire naturellement les liens</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Diversifiez vos Pages</h4>
                    <p className="text-gray-600 text-sm">Proposez des liens sur différentes pages pour plus d'opportunités</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Fixez des Prix Compétitifs</h4>
                    <p className="text-gray-600 text-sm">Analysez le marché et proposez des tarifs attractifs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Répondez Rapidement</h4>
                    <p className="text-gray-600 text-sm">Traitement rapide des demandes = plus de ventes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions Fréquentes sur la Vente de Liens
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💡 Comment Back.ma protège-t-elle les éditeurs ?
              </h3>
              <p className="text-gray-600">
                Nous vérifions tous les acheteurs, sécurisons les paiements et offrons un support dédié. 
                Notre système de réputation protège votre site contre les liens de mauvaise qualité.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ⏰ Combien de temps faut-il pour recevoir le paiement ?
              </h3>
              <p className="text-gray-600">
                Les paiements sont traités automatiquement 48h après la publication du lien. 
                Vous pouvez retirer vos fonds via virement bancaire ou PayPal.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎯 Puis-je refuser une demande de lien ?
              </h3>
              <p className="text-gray-600">
                Absolument ! Vous gardez le contrôle total sur votre contenu. 
                Vous pouvez refuser toute demande qui ne correspond pas à vos critères.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📊 Comment Back.ma calcule-t-elle les prix recommandés ?
              </h3>
              <p className="text-gray-600">
                Nos algorithmes analysent l'autorité de votre domaine, le trafic, la thématique 
                et les prix du marché pour vous suggérer des tarifs optimaux.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🚀 Mon site est nouveau, puis-je quand même vendre des liens ?
              </h3>
              <p className="text-gray-600">
                Oui ! Même les nouveaux sites peuvent vendre des liens. Commencez avec des prix 
                plus bas et augmentez-les au fur et à mesure que votre autorité grandit.
              </p>
            </div>
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