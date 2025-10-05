import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Shield,
  Award,
  Clock,
  MapPin,
  Globe,
  Zap,
  Target,
  Heart,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

const ReviewExchangePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              🌟 Échange d'Avis au Maroc
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Boostez votre réputation Google My Business & Trustpilot au Maroc avec notre système d'échange sécurisé et professionnel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/dashboard/review-exchange"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center space-x-2"
              >
                <Star className="h-5 w-5" />
                <span>Voir la plateforme</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center"
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Entreprises marocaines</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl">
              <Star className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Avis échangés</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-purple-600 mb-2">+85%</div>
              <div className="text-gray-600">Amélioration visibilité</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl">
              <Award className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-orange-600 mb-2">4.8/5</div>
              <div className="text-gray-600">Satisfaction client</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Un système simple et sécurisé en 3 étapes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-2xl shadow-lg text-center"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Créez votre demande</h3>
              <p className="text-gray-600 mb-6">
                Demandez des avis pour votre Google My Business ou Trustpilot. 
                Coût : 2 crédits par demande.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Gratuit :</strong> 4 crédits offerts à l'inscription
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-lg text-center"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Laissez des avis</h3>
              <p className="text-gray-600 mb-6">
                Choisissez des demandes d'autres entreprises et laissez des avis 
                authentiques. Gain : 1 crédit par avis.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Échange 1 pour 1 :</strong> Donnant-donnant équitable
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-8 rounded-2xl shadow-lg text-center"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Boostez votre réputation</h3>
              <p className="text-gray-600 mb-6">
                Recevez des avis authentiques qui améliorent votre visibilité 
                sur Google et Trustpilot.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Résultat :</strong> Plus de clients, plus de ventes
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Plateformes supportées
            </h2>
            <p className="text-xl text-gray-600">
              Optimisez votre présence sur les plateformes les plus importantes au Maroc
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl"
            >
              <div className="flex items-center mb-6">
                <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-600">Google My Business</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Améliorez votre visibilité locale sur Google. Les avis GMB sont cruciaux 
                pour apparaître en première position dans les recherches "près de moi".
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Visibilité locale améliorée
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Apparition dans les recherches Google
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Crédibilité renforcée
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl"
            >
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600">Trustpilot</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Renforcez votre réputation sur Trustpilot, la plateforme d'avis 
                de référence pour les entreprises au Maroc et en Europe.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Réputation internationale
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Confiance des clients européens
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Badge de confiance
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir notre plateforme ?
            </h2>
            <p className="text-xl text-gray-600">
              Les avantages qui font la différence pour les entreprises marocaines
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Sécurité maximale</h3>
              <p className="text-gray-600">
                Guidelines strictes pour éviter la détection par Google et Trustpilot. 
                Protection de votre réputation.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <Clock className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Rapidité d'exécution</h3>
              <p className="text-gray-600">
                Recevez des avis en 24-48h. Notre communauté active d'entreprises 
                marocaines garantit des échanges rapides.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <Target className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Ciblage local</h3>
              <p className="text-gray-600">
                Échangez avec des entreprises du Maroc. Compréhension des enjeux 
                locaux et de la culture d'entreprise marocaine.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <Zap className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Système équitable</h3>
              <p className="text-gray-600">
                Échange 1 pour 1. Donnez un avis, recevez un avis. 
                Système transparent et équilibré.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <MapPin className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Focus Maroc</h3>
              <p className="text-gray-600">
                Spécialement conçu pour le marché marocain. Support en français 
                et arabe, compréhension des spécificités locales.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <Heart className="h-12 w-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Communauté active</h3>
              <p className="text-gray-600">
                Rejoignez une communauté de 500+ entreprises marocaines qui 
                s'entraident pour améliorer leur visibilité en ligne.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Prêt à booster votre réputation ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez les entreprises marocaines qui ont choisi notre plateforme 
              pour améliorer leur visibilité sur Google et Trustpilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Commencer maintenant</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all"
              >
                Nous contacter
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              ✨ Gratuit • 4 crédits offerts • Sans engagement
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Échange d'avis Google My Business et Trustpilot au Maroc
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              <strong>Authority.ma</strong> propose la première plateforme d'échange d'avis 
              dédiée aux entreprises marocaines. Notre système innovant vous permet d'améliorer 
              votre réputation sur Google My Business et Trustpilot de manière sécurisée et professionnelle.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Pourquoi les avis sont-ils cruciaux au Maroc ?
            </h3>
            <p className="text-gray-700 mb-4">
              Au Maroc, <strong>85% des consommateurs</strong> consultent les avis en ligne avant 
              de faire un achat. Les entreprises avec plus de 4 étoiles sur Google My Business 
              voient leur trafic augmenter de <strong>35% en moyenne</strong>.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Nos services pour entreprises marocaines
            </h3>
            <ul className="text-gray-700 space-y-2 mb-6">
              <li>• <strong>Échange d'avis Google My Business</strong> - Améliorez votre visibilité locale</li>
              <li>• <strong>Échange d'avis Trustpilot</strong> - Renforcez votre réputation internationale</li>
              <li>• <strong>Support multilingue</strong> - Français et arabe</li>
              <li>• <strong>Guidelines de sécurité</strong> - Protection contre la détection</li>
              <li>• <strong>Communauté active</strong> - 500+ entreprises marocaines</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Villes couvertes au Maroc
            </h3>
            <p className="text-gray-700 mb-4">
              Notre plateforme couvre toutes les villes marocaines : <strong>Casablanca, Rabat, 
              Marrakech, Fès, Agadir, Tanger, Meknès, Oujda, Safi, Salé</strong> et bien d'autres.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Secteurs d'activité
            </h3>
            <p className="text-gray-700 mb-6">
              Nous accompagnons tous les secteurs : <strong>restaurants, hôtels, immobilier, 
              santé, éducation, e-commerce, services professionnels, tourisme, beauté, 
              automobile</strong> et bien plus encore.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-blue-800 font-semibold">
                🚀 Rejoignez dès maintenant les entreprises marocaines qui ont choisi 
                Authority.ma pour améliorer leur réputation en ligne !
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ReviewExchangePage;
