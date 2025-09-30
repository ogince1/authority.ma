import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Users, TrendingUp, Globe, Link as LinkIcon, Search, DollarSign, Clock, Star, CheckCircle, AlertTriangle, Target, Award, Brain, BarChart3, Eye, Lock, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { Website, LinkListing } from '../types';
import { getWebsites, getLinkListings } from '../lib/supabase';
import { trackPageView } from '../utils/analytics';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const HomePage: React.FC = () => {
  const [featuredWebsites, setFeaturedWebsites] = useState<Website[]>([]);
  const [featuredLinks, setFeaturedLinks] = useState<LinkListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track page view
    trackPageView('/', 'Back.ma - Plateforme Marocaine pour Acheter des Liens de Qualité');
    
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
    <div className="min-h-screen bg-blue-600">
      <SEOHead 
        title="Back.ma – La plateforme marocaine pour acheter des liens de qualité 🚀"
        description="Bienvenue sur Back.ma, la première plateforme marocaine spécialisée dans l'achat de liens sponsorisés. Aidez les entreprises, agences SEO et e-commerçants à renforcer leur visibilité sur Google et à propulser leur site web dans les résultats de recherche."
      />
      <Header />
      
      {/* Hero Section - Enhanced with Colors */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - 3D Graphics */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* 3D Browser Window */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500 border-2 border-gradient-to-r from-blue-400 to-purple-500">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Site</span>
                    <span className="text-sm font-medium text-gray-600">TF</span>
                    <span className="text-sm font-medium text-gray-600">CF</span>
                    <span className="text-sm font-medium text-gray-600">Traffic</span>
                    <span className="text-sm font-medium text-gray-600">DR</span>
                    <span className="text-sm font-medium text-gray-600">DA</span>
                    <span className="text-sm font-medium text-gray-600">Prix</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <span className="text-sm text-gray-800">www.media.com</span>
                    <span className="text-sm text-gray-600">45</span>
                    <span className="text-sm text-gray-600">38</span>
                    <span className="text-sm text-gray-600">12K</span>
                    <span className="text-sm text-gray-600">65</span>
                    <span className="text-sm text-gray-600">58</span>
                    <span className="text-sm font-bold text-blue-600">641 €</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <span className="text-sm text-gray-800">www.blog.com</span>
                    <span className="text-sm text-gray-600">32</span>
                    <span className="text-sm text-gray-600">28</span>
                    <span className="text-sm text-gray-600">8K</span>
                    <span className="text-sm text-gray-600">52</span>
                    <span className="text-sm text-gray-600">45</span>
                    <span className="text-sm font-bold text-blue-600">420 €</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <span className="text-sm text-gray-800">www.beauty-blog.com</span>
                    <span className="text-sm text-gray-600">28</span>
                    <span className="text-sm text-gray-600">25</span>
                    <span className="text-sm text-gray-600">5K</span>
                    <span className="text-sm text-gray-600">48</span>
                    <span className="text-sm text-gray-600">42</span>
                    <span className="text-sm font-bold text-blue-600">320 €</span>
                  </div>
                </div>
              </div>

              {/* Floating Chart */}
              <div className="absolute -top-8 -right-8 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-500 border border-blue-200">
                <div className="w-32 h-20">
                  <div className="flex items-end justify-between h-full">
                    <div className="w-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style={{height: '60%'}}></div>
                    <div className="w-4 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t" style={{height: '80%'}}></div>
                    <div className="w-4 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t" style={{height: '45%'}}></div>
                    <div className="w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t" style={{height: '90%'}}></div>
                    <div className="w-4 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t" style={{height: '70%'}}></div>
                  </div>
                </div>
              </div>

              {/* Stacked Platforms */}
              <div className="absolute -bottom-8 -left-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg transform rotate-12"></div>
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full shadow-lg absolute -top-2 -left-2 transform -rotate-6"></div>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg absolute -top-4 -left-4 transform rotate-6"></div>
                </div>
              </div>

              {/* Arrows */}
              <div className="absolute top-1/2 -right-16">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg transform rotate-45 shadow-lg"></div>
              </div>
              <div className="absolute bottom-1/4 -left-12">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg transform rotate-45 shadow-lg"></div>
              </div>

              {/* Spheres */}
              <div className="absolute top-1/4 -left-4 w-6 h-6 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full shadow-lg"></div>
              <div className="absolute bottom-1/3 -right-6 w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full shadow-lg"></div>
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white"
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Back.ma, la première plateforme pour centraliser vos campagnes de{' '}
                <span className="text-blue-200">liens sponsorisés</span> au Maroc
              </h1>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-4">
                  <Link
                    to="/register?type=advertiser"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Je suis annonceur
                  </Link>
              <Link
                to="/liens"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ACQUISITION DE LIENS
                  </Link>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Link
                    to="/register?type=publisher"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Je suis éditeur
              </Link>
              <Link
                to="/vendre-liens"
                    className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                    MONÉTISATION
              </Link>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* What is a Link Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Qu'est-ce qu'un lien retour et pourquoi est-ce crucial ?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Un lien retour (ou lien externe), c'est un lien placé sur un autre site internet qui pointe vers votre page. 
                Quand il provient d'un site source fiable, thématique et à forte autorité, il devient un levier énorme pour :
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Améliorer votre référencement naturel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Booster le trafic organique</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Renforcer la confiance autour de votre marque</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Influencer la façon dont les IA (ChatGPT, Perplexity, Gemini, etc.) recommandent votre entreprise</span>
                </li>
              </ul>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <p className="font-semibold">
                  👉 En clair : des liens de qualité augmentent vos chances d'être recommandés par les moteurs de recherche ET par l'intelligence artificielle.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl p-8 shadow-xl">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">L'ère de l'IA</h3>
                  <p className="text-gray-800 mb-6">
                    Aujourd'hui, ce n'est pas seulement Google qui regarde vos liens : les LLMs analysent aussi la popularité et la qualité de vos liens externes pour décider de citer ou non votre marque dans les réponses.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <Search className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-800">Google</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-800">IA Générative</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Buy Links Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi acheter des liens sponsorisés est-il important ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Soyons directs : sans liens, votre site reste invisible. Les liens de qualité sont un élément crucial de toute stratégie SEO.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Améliorer rapidement votre classement Google",
                description: "Un signal puissant aux moteurs de recherche"
              },
              {
                icon: Eye,
                title: "Renforcer la visibilité de votre site web",
                description: "Plus de trafic organique qualifié"
              },
              {
                icon: DollarSign,
                title: "Obtenir un meilleur ROI",
                description: "Retour sur investissement grâce à un trafic qualifié"
              },
              {
                icon: Globe,
                title: "Propulser votre présence",
                description: "Sur le marché marocain et international"
              }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <benefit.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 mb-4">
                Dans un univers compétitif, surtout au Maroc, l'achat de liens sponsorisés est une solution rapide et mesurable pour prendre de l'avance.
              </p>
              <p className="text-blue-600 font-semibold">
                Ils envoient un signal puissant aux moteurs de recherche et aux IA génératives : "Ce site est populaire, fiable et mérite d'être cité."
              </p>
            </div>
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
      <section className="py-20 bg-white">
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

      {/* How to Buy Quality Links Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment acheter des liens de qualité ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pas question de faire du black hat à l'aveugle. Chez Back.ma, on vous guide pour acheter des liens de qualité, adaptés à votre activité et alignés avec les bonnes pratiques SEO.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                step: "1",
                title: "Définissez vos objectifs",
                description: "Plus de trafic, meilleure visibilité, lancement produit, etc."
              },
              {
                step: "2", 
                title: "Choisissez vos sites partenaires",
                description: "Blogs marocains, médias français, sites internationaux indexés"
              },
              {
                step: "3",
                title: "Validez votre commande",
                description: "En ligne avec un suivi clair"
              },
              {
                step: "4",
                title: "Recevez vos liens",
                description: "Publiés et indexés avec rapport détaillé"
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Résultat garanti</h3>
            <p className="text-lg text-gray-700">
              Un profil de liens propre, pertinent et durable qui respecte les algorithmes Google et les critères des IA.
            </p>
          </div>
        </div>
      </section>

      {/* Quality Criteria Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quels critères pour choisir des liens ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un bon lien se reconnaît facilement si vous vérifiez ces éléments essentiels
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: "Qualité et pertinence du site source",
                description: "Le site doit être fiable et thématiquement proche de votre activité"
              },
              {
                icon: Target,
                title: "Thématique proche de votre activité",
                description: "Exemple : un plombier gagne plus avec un lien depuis un blog maison qu'un site de cuisine"
              },
              {
                icon: BarChart3,
                title: "Autorité du domaine et trust flow",
                description: "Plus l'autorité est élevée, plus l'impact SEO est fort"
              },
              {
                icon: Search,
                title: "Ancre de texte optimisée",
                description: "Éviter la sur-optimisation, varier entre exact, marque et générique"
              },
              {
                icon: TrendingUp,
                title: "Trafic organique réel du site",
                description: "Un site avec du vrai trafic a plus de valeur"
              },
              {
                icon: Shield,
                title: "Création manuelle et non automatisée",
                description: "Les liens naturels sont plus efficaces et moins risqués"
              }
            ].map((criteria, index) => (
              <motion.div
                key={criteria.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <criteria.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{criteria.title}</h3>
                <p className="text-gray-600">{criteria.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-blue-600 text-white rounded-xl p-8 max-w-4xl mx-auto">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Garantie Back.ma</h3>
              <p className="text-lg">
                👉 Chez Back.ma, tous les liens sont validés manuellement par notre équipe d'experts pour garantir que chaque lien apporte un vrai impact SEO.
              </p>
            </div>
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Back.ma ?
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

      {/* Risks and Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Risks Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Quels sont les risques d'acheter des liens ? ⚠️
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Acheter des liens, c'est puissant. Mais mal fait, ça peut vite tourner à la mauvaise idée.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: AlertTriangle,
                    title: "Pénalité Google",
                    description: "Si les liens proviennent de sites douteux",
                    color: "text-red-600"
                  },
                  {
                    icon: AlertTriangle,
                    title: "Liens de mauvaise qualité",
                    description: "Réseaux automatisés, fermes de liens",
                    color: "text-red-600"
                  },
                  {
                    icon: AlertTriangle,
                    title: "Impact négatif sur la réputation",
                    description: "Perte de confiance de votre site internet",
                    color: "text-red-600"
                  }
                ].map((risk, index) => (
                  <div key={risk.title} className="flex items-start">
                    <risk.icon className={`h-6 w-6 ${risk.color} mr-3 mt-0.5 flex-shrink-0`} />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{risk.title}</h3>
                      <p className="text-gray-600">{risk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                <p className="text-red-800 font-semibold">
                  C'est pourquoi Back.ma privilégie toujours la qualité plutôt que la quantité. On contrôle chaque site source, chaque article sponsorisé et chaque ancre de lien pour éviter toute sanction.
                </p>
              </div>
            </motion.div>
            
            {/* Pricing Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Où trouver des liens à bas prix ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Bonne nouvelle : acheter des liens ne signifie pas forcément vider votre budget. Chez Back.ma, nous proposons :
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: DollarSign,
                    title: "Offres accessibles",
                    description: "Pour freelances, TPE et startups",
                    color: "text-green-600"
                  },
                  {
                    icon: Rocket,
                    title: "Packs optimisés",
                    description: "Pour PME et e-commerce",
                    color: "text-blue-600"
                  },
                  {
                    icon: Award,
                    title: "Solutions personnalisées",
                    description: "Pour grandes entreprises et agences SEO",
                    color: "text-purple-600"
                  }
                ].map((offer, index) => (
                  <div key={offer.title} className="flex items-start">
                    <offer.icon className={`h-6 w-6 ${offer.color} mr-3 mt-0.5 flex-shrink-0`} />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                      <p className="text-gray-600">{offer.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                <p className="text-green-800 font-semibold">
                  👉 L'idée n'est pas de chercher le prix le plus bas, mais de trouver le meilleur rapport qualité/prix. On évite les liens de mauvaise qualité, mais on rend le netlinking professionnel accessible au marché marocain.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEO Strategy Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment améliorer le référencement avec des liens ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un lien bien placé peut booster votre SEO en quelques semaines. Mais il faut une stratégie de netlinking claire.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Globe,
                title: "Diversité des sites référents",
                description: "Travailler sur la variété des sources"
              },
              {
                icon: Target,
                title: "Équilibre naturel/sponsorisé",
                description: "Mélanger liens sponsorisés et naturels"
              },
              {
                icon: Award,
                title: "Autorité élevée",
                description: "Viser des liens à forte autorité"
              },
              {
                icon: TrendingUp,
                title: "Pages stratégiques",
                description: "Renforcer accueil, produits, articles optimisés"
              }
            ].map((strategy, index) => (
              <motion.div
                key={strategy.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
              >
                <div className="flex justify-center mb-4">
                  <strategy.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{strategy.title}</h3>
                <p className="text-gray-600">{strategy.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-blue-600 text-white rounded-xl p-8 max-w-4xl mx-auto">
              <Rocket className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Avec Back.ma</h3>
              <p className="text-lg">
                👉 Vous boostez votre référencement grâce à une campagne personnalisée, des rapports de suivi et une optimisation continue.
              </p>
            </div>
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ❓ FAQ – Tout savoir sur l'achat de liens
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Réponses aux questions les plus fréquentes sur l'achat de liens et notre plateforme
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: "Qu'est-ce qu'un lien retour et pourquoi est-il important en SEO ?",
                answer: "Un lien retour est un lien externe placé sur un autre site web. Plus le domaine référent a d'autorité élevée, plus l'impact est fort sur le classement de votre site dans les résultats de recherche."
              },
              {
                question: "Pourquoi acheter des liens peut-il améliorer ma visibilité ?",
                answer: "Parce qu'ils renforcent la popularité et la présence de votre entreprise sur Google et sur les IA SEO. Résultat : plus de trafic organique et plus de recommandations."
              },
              {
                question: "Quels sont les critères clés pour choisir un lien de qualité ?",
                answer: "Pertinence thématique, autorité du site référent, ancre de texte optimisée, création naturelle du link flow."
              },
              {
                question: "Quels sont les risques liés à l'achat de liens ?",
                answer: "Si vous ne contrôlez pas la qualité, vous risquez une pénalité Google et une perte de confiance. Chez Back.ma, nos liens sont validés manuellement."
              },
              {
                question: "Où acheter des liens de haute qualité en ligne ?",
                answer: "Sur des plateformes de netlinking comme Back.ma, Ereferer ou Semjuice. Notre plateforme marocaine propose des solutions claires, rapides et adaptées au marché local."
              },
              {
                question: "Combien coûte un lien ?",
                answer: "Le prix d'un lien dépend du site, de son trafic et de son autorité. Nos tarifs sont transparents et adaptés à chaque budget."
              },
              {
                question: "Comment savoir si un lien est puissant ?",
                answer: "Il doit provenir d'un site indexé, avec un bon trafic organique et une autorité élevée. Exemple : un article sponsorisé publié sur un média reconnu."
              },
              {
                question: "Vers quelles pages envoyer mes liens ?",
                answer: "Page d'accueil (confiance globale), pages produits/services (trafic direct), articles de blog (soutien au contenu optimisé)."
              },
              {
                question: "Quelle ancre de texte privilégier ?",
                answer: "Un mix équilibré : mot clé principal, nom de marque, ancres génériques."
              },
              {
                question: "Quels services propose Back.ma ?",
                answer: "Campagnes de netlinking personnalisées, rapports clairs et détaillés, réseau de partenaires marocains et internationaux, garantie de liens publiés et indexés."
              },
              {
                question: "Comment acheter sans risquer une pénalité Google ?",
                answer: "Avec une sélection manuelle des sites, des articles sponsorisés en français et un plan d'ancrage naturel."
              },
              {
                question: "Peut-on trouver des liens pas chers mais efficaces ?",
                answer: "Oui, mais il faut rester prudent. On privilégie un prix juste pour une qualité durable."
              },
              {
                question: "Comment Back.ma garantit la qualité ?",
                answer: "Chaque site est vérifié manuellement : pertinence thématique, autorité du domaine, trafic web."
              },
              {
                question: "Pourquoi acheter un lien sponsorisé plutôt que miser uniquement sur du naturel ?",
                answer: "Parce que le sponsorisé est rapide et mesurable, alors que le naturel prend du temps. La meilleure stratégie : combiner les deux."
              }
            ].map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Prêt à Améliorer votre SEO avec Back.ma ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Rejoignez des centaines d'entreprises, agences SEO et e-commerçants qui font confiance à Back.ma pour leurs campagnes de netlinking
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