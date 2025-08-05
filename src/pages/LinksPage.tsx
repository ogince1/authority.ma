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
        title="Liens de Qualité pour SEO - Authority.ma"
        description="Découvrez notre catalogue de liens de qualité pour améliorer votre SEO. Liens dofollow, placement garanti, éditeurs vérifiés. Prix compétitifs et résultats garantis."
        keywords="liens SEO, backlinks, dofollow, placement liens, autorité domaine, DR, TF, CF, Maroc"
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
              Pourquoi Choisir Authority.ma ?
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
            Rejoignez des centaines d'entreprises qui font confiance à Authority.ma
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

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions Fréquentes
            </h2>
                        </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Combien de temps faut-il pour voir les résultats ?
              </h3>
              <p className="text-gray-600">
                Les premiers résultats peuvent être visibles en 2-4 semaines, avec des améliorations continues sur 3-6 mois.
                          </p>
                        </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Les liens sont-ils garantis ?
              </h3>
              <p className="text-gray-600">
                Oui, tous nos liens sont garantis pour une durée minimale d'un an. Si un lien est supprimé, nous le remplaçons gratuitement.
              </p>
                    </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je choisir le texte d'ancrage ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez spécifier le texte d'ancrage de votre choix lors de la commande.
              </p>
              </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comment sont sélectionnés les sites ?
              </h3>
              <p className="text-gray-600">
                Nous sélectionnons rigoureusement chaque site en vérifiant leur autorité, leur trafic et la qualité de leur contenu.
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