import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Globe, TrendingUp, DollarSign, Clock, Star, FileText, Plus, ShoppingCart, Eye, Target, Award, AlertCircle, CheckCircle, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const LinksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  // Données statiques pour le SEO
  const linkCategories = [
    {
      name: 'Blogs',
      count: 150,
      avgPrice: 120,
      avgDR: 45,
      description: 'Liens de qualité sur des blogs spécialisés'
    },
    {
      name: 'Actualités',
      count: 80,
      avgPrice: 200,
      avgDR: 65,
      description: 'Liens sur des sites d\'actualités fiables'
    },
    {
      name: 'E-commerce',
      count: 95,
      avgPrice: 150,
      avgDR: 55,
      description: 'Liens sur des sites e-commerce populaires'
    },
    {
      name: 'Tech',
      count: 120,
      avgPrice: 180,
      avgDR: 60,
      description: 'Liens sur des sites technologiques'
    },
    {
      name: 'Lifestyle',
      count: 110,
      avgPrice: 130,
      avgDR: 50,
      description: 'Liens sur des sites lifestyle et bien-être'
    },
    {
      name: 'Business',
      count: 75,
      avgPrice: 250,
      avgDR: 70,
      description: 'Liens sur des sites business et finance'
    }
  ];

  const qualityLevels = [
    {
      name: 'Gold',
      dr: '70+',
      price: '200-500 MAD',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '🥇',
      description: 'Sites de très haute autorité'
    },
    {
      name: 'Silver',
      dr: '40-69',
      price: '120-200 MAD',
      color: 'bg-gray-100 text-gray-800',
      icon: '🥈',
      description: 'Sites de haute autorité'
    },
    {
      name: 'Bronze',
      dr: '20-39',
      price: '80-120 MAD',
      color: 'bg-amber-100 text-amber-800',
      icon: '🥉',
      description: 'Sites de bonne autorité'
    }
  ];

  const features = [
    {
      icon: CheckCircle,
      title: 'Liens Dofollow',
      description: 'Tous nos liens sont dofollow pour un maximum d\'impact SEO'
    },
    {
      icon: Target,
      title: 'Placement Garanti',
      description: 'Placement dans le contenu principal, pas en sidebar ou footer'
    },
    {
      icon: Clock,
      title: 'Durée Minimum 1 An',
      description: 'Tous nos liens sont garantis pour une durée minimale d\'un an'
    },
    {
      icon: Users,
      title: 'Éditeurs Vérifiés',
      description: 'Tous nos éditeurs sont vérifiés et leurs sites sont contrôlés'
    },
    {
      icon: BarChart3,
      title: 'Métriques Transparentes',
      description: 'Accès aux métriques DR, TF, CF de chaque site'
    },
    {
      icon: Award,
      title: 'Qualité Premium',
      description: 'Sélection rigoureuse des sites et du contenu'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Acheter des Liens SEO au Maroc - Liens de Qualité | Back.ma"
        description="Achetez des liens SEO de qualité au Maroc ! 630+ liens dofollow disponibles, 150+ éditeurs vérifiés, placement garanti 24h. Améliorez votre référencement avec des liens d'autorité. Prix compétitifs, résultats garantis."
        keywords="acheter liens SEO, liens Maroc, liens dofollow, autorité domaine, DR TF CF, placement liens, netlinking, référencement naturel, améliorer SEO"
      />
      <Header onSearchChange={setSearchTerm} searchValue={searchTerm} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Liens de Qualité pour votre SEO
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Améliorez votre référencement avec nos liens dofollow de haute autorité
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Commencer Maintenant
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">630+</div>
              <div className="text-gray-600">Liens Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">150+</div>
              <div className="text-gray-600">Éditeurs Vérifiés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">Taux de Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24h</div>
              <div className="text-gray-600">Placement Garanti</div>
                  </div>
                </div>
              </div>
      </section>

      {/* Catégories de liens */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Catégories de Liens Disponibles
            </h2>
            <p className="text-xl text-gray-600">
              Trouvez les liens qui correspondent à votre niche
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {linkCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">{category.count}</span>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Prix moyen:</span>
                    <span className="font-medium">{category.avgPrice} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">DR moyen:</span>
                    <span className="font-medium">{category.avgDR}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
        </div>
      </section>

      {/* Niveaux de qualité */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Niveaux de Qualité
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez le niveau de qualité qui correspond à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {qualityLevels.map((level, index) => (
                            <motion.div
                key={level.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold mb-4 ${level.color}`}>
                  <span className="mr-2">{level.icon}</span>
                  {level.name}
                              </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{level.name}</h3>
                <p className="text-gray-600 mb-4">{level.description}</p>
                              <div className="space-y-2">
                  <div className="text-lg font-semibold text-gray-900">DR: {level.dr}</div>
                  <div className="text-lg font-semibold text-blue-600">{level.price}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Back.ma ?
            </h2>
            <p className="text-xl text-gray-600">
              Des avantages exclusifs pour votre stratégie SEO
                          </p>
                        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                            <motion.div
                key={feature.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 text-center"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                              </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
                                </div>
                              </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à Améliorer votre SEO ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Rejoignez des centaines d'entreprises qui font confiance à Back.ma
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Créer un Compte Gratuit
            </Link>
                                <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                                >
              Parler à un Expert
                                </Link>
                              </div>
        </div>
      </section>

      {/* Guide d'Achat Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Guide Complet : Comment Acheter des Liens SEO au Maroc
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tout ce que vous devez savoir pour réussir votre stratégie de netlinking
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🎯 Comment Choisir les Meilleurs Liens pour votre Site ?
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">1. Pertinence Thématique</h4>
                  <p className="text-blue-700">Choisissez des sites dans votre niche ou des thématiques connexes pour un impact SEO maximal.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">2. Autorité du Domaine (DR)</h4>
                  <p className="text-green-700">Privilégiez les sites avec un DR élevé (40+) pour un transfert d'autorité optimal.</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">3. Trafic Organique</h4>
                  <p className="text-orange-700">Vérifiez que le site reçoit du trafic organique réel et non du trafic payant.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">4. Qualité du Contenu</h4>
                  <p className="text-purple-700">Assurez-vous que le contenu autour du lien est de qualité et pertinent.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                💰 Budget et ROI : Combien Investir ?
              </h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Budget Débutant (1,000-3,000 MAD)</h4>
                  <p className="text-green-700">5-10 liens de qualité • Focus sur la pertinence • Résultats en 2-3 mois</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Budget Intermédiaire (3,000-8,000 MAD)</h4>
                  <p className="text-blue-700">15-25 liens diversifiés • Mix autorité/pertinence • Résultats en 1-2 mois</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Budget Avancé (8,000+ MAD)</h4>
                  <p className="text-orange-700">30+ liens premium • Sites haute autorité • Résultats rapides et durables</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">💡 Conseil Pro</h4>
                  <p className="text-gray-700">Commencez petit, mesurez les résultats, puis augmentez progressivement votre budget.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stratégies SEO Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stratégies SEO Avancées avec les Liens
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Maximisez l'impact de vos liens avec ces stratégies éprouvées
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Diversification des Ancres</h3>
              <p className="text-gray-600 mb-4">Utilisez un mix d'ancres : marque, génériques, et mots-clés pour un profil naturel.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 40% ancres de marque</li>
                <li>• 30% ancres génériques</li>
                <li>• 30% ancres exactes</li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Distribution des Pages</h3>
              <p className="text-gray-600 mb-4">Ciblez différentes pages de votre site pour un profil de liens équilibré.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 50% page d'accueil</li>
                <li>• 30% pages produits/services</li>
                <li>• 20% articles de blog</li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Acquisition Progressive</h3>
              <p className="text-gray-600 mb-4">Étalez vos achats sur plusieurs mois pour un profil naturel.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 5-10 liens par mois</li>
                <li>• Évitez les pics soudains</li>
                <li>• Maintenez la régularité</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions Fréquentes sur l'Achat de Liens
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir avant d'acheter des liens
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ⏱️ Combien de temps faut-il pour voir les résultats ?
              </h3>
              <p className="text-gray-600">
                Les premiers résultats peuvent être visibles en 2-4 semaines, avec des améliorations continues sur 3-6 mois. 
                La vitesse dépend de l'autorité des sites sources et de la compétitivité de vos mots-clés.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🛡️ Les liens sont-ils garantis contre les suppressions ?
              </h3>
              <p className="text-gray-600">
                Oui, tous nos liens sont garantis pour une durée minimale d'un an. Si un lien est supprimé, 
                nous le remplaçons gratuitement ou vous remboursons intégralement.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎯 Puis-je choisir le texte d'ancrage et la position ?
              </h3>
              <p className="text-gray-600">
                Absolument ! Vous pouvez spécifier le texte d'ancrage de votre choix et demander un placement 
                dans le contenu principal (pas en sidebar ou footer).
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔍 Comment sont sélectionnés et vérifiés les sites ?
              </h3>
              <p className="text-gray-600">
                Nous vérifions rigoureusement chaque site : autorité (DR/TF/CF), trafic organique, qualité du contenu, 
                historique de spam, et respect des guidelines Google. Seuls les sites de qualité sont acceptés.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💳 Quels sont les modes de paiement acceptés ?
              </h3>
              <p className="text-gray-600">
                Nous acceptons les cartes bancaires, virements, PayPal, et paiements en crypto-monnaies. 
                Tous les paiements sont sécurisés et traités instantanément.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📊 Recevrai-je un rapport détaillé ?
              </h3>
              <p className="text-gray-600">
                Oui, vous recevez un rapport complet avec les métriques du site source, l'URL du lien placé, 
                le texte d'ancrage utilisé, et les métriques de performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LinksPage; 