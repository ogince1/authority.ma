import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  ArrowRight,
  Briefcase,
  PieChart,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FundraisingOpportunity } from '../types';
import { getFundraisingOpportunities } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const FundraisingPage: React.FC = () => {
  const [opportunities, setOpportunities] = React.useState<FundraisingOpportunity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const data = await getFundraisingOpportunities();
        setOpportunities(data);
      } catch (error) {
        console.error('Error fetching fundraising opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'pre_seed': return 'Pré-Seed';
      case 'seed': return 'Seed';
      case 'series_a': return 'Série A';
      case 'series_b': return 'Série B';
      case 'bridge': return 'Bridge';
      default: return stage;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'pre_seed': return 'bg-purple-100 text-purple-800';
      case 'seed': return 'bg-green-100 text-green-800';
      case 'series_a': return 'bg-blue-100 text-blue-800';
      case 'series_b': return 'bg-indigo-100 text-indigo-800';
      case 'bridge': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    { label: 'Opportunités Actives', value: opportunities.length, icon: TrendingUp },
    { label: 'Montant Total Recherché', value: `${(opportunities.reduce((sum, opp) => sum + opp.target_amount, 0) / 1000000).toFixed(1)}M MAD`, icon: DollarSign },
    { label: 'Investisseurs Connectés', value: '150+', icon: Users },
    { label: 'Taux de Financement', value: '75%', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Opportunités d'Investissement | GoHaya - Levée de Fonds"
        description="Découvrez des opportunités d'investissement dans des startups et MVP innovants. Investissez dans l'innovation et l'entrepreneuriat."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Investissez dans l'Innovation
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {' '}Digitale
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Découvrez des opportunités d'investissement exceptionnelles dans des startups 
              et MVP innovants. Participez à la transformation digitale mondiale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="#opportunities"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Explorer les Opportunités
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/lever-des-fonds"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Lever des Fonds
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
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

      {/* Opportunities Section */}
      <section id="opportunities" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Opportunités d'Investissement
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez des projets innovants à fort potentiel de croissance
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune opportunité disponible
              </h3>
              <p className="text-gray-600 mb-6">
                Revenez bientôt pour découvrir de nouvelles opportunités d'investissement.
              </p>
              <Link
                to="/lever-des-fonds"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proposer une Levée de Fonds
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {opportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">
                        Opportunité #{opportunity.id.slice(0, 8)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(opportunity.investment_stage)}`}>
                        {getStageLabel(opportunity.investment_stage)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {opportunity.description_for_investors}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Montant recherché</span>
                        <span className="font-semibold text-blue-600">
                          {formatAmount(opportunity.target_amount)}
                        </span>
                      </div>
                      
                      {opportunity.equity_offered && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Capital offert</span>
                          <span className="font-semibold text-green-600">
                            {opportunity.equity_offered}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Investissement min.</span>
                        <span className="font-semibold text-gray-900">
                          {formatAmount(opportunity.minimum_investment)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/investir/${opportunity.id}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                      >
                        <PieChart className="h-4 w-4 inline mr-2" />
                        Investir
                      </Link>
                      {opportunity.pitch_deck_url && (
                        <a
                          href={opportunity.pitch_deck_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Vous Cherchez des Investisseurs ?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Présentez votre projet à notre réseau d'investisseurs qualifiés et 
              accélérez votre croissance.
            </p>
            <Link
              to="/lever-des-fonds"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              Lever des Fonds
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FundraisingPage;