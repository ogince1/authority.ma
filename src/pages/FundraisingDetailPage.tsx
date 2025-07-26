import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  DollarSign,
  PieChart,
  TrendingUp,
  FileText,
  Calendar,
  Target,
  Users,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FundraisingOpportunity, CreateInvestmentInterestData } from '../types';
import { getFundraisingOpportunityById, createInvestmentInterest } from '../lib/supabase';
import Header from '../components/Layout/Header';
import { trackInvestmentInterest } from '../utils/analytics';
import Footer from '../components/Layout/Footer';
import InvestmentInterestForm from '../components/Fundraising/InvestmentInterestForm';
import SEOHead from '../components/SEO/SEOHead';
import toast from 'react-hot-toast';

const FundraisingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = React.useState<FundraisingOpportunity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [interestLoading, setInterestLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchOpportunity = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getFundraisingOpportunityById(id);
        setOpportunity(data);
      } catch (error) {
        console.error('Error fetching fundraising opportunity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [id]);

  const handleInterestSubmit = async (data: CreateInvestmentInterestData) => {
    setInterestLoading(true);
    try {
      await createInvestmentInterest(data);
      toast.success('Votre intérêt a été envoyé avec succès !');
      trackInvestmentInterest(data.fundraising_id, data.investment_amount);
    } catch (error) {
      console.error('Error creating investment interest:', error);
      toast.error('Erreur lors de l\'envoi de votre intérêt');
    } finally {
      setInterestLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg mb-6">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Opportunité non trouvée
            </h1>
            <p className="text-gray-600 mb-8">
              L'opportunité d'investissement que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/investir"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour aux opportunités
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`Opportunité d'Investissement ${getStageLabel(opportunity.investment_stage)} | GoHaya`}
        description={opportunity.description_for_investors}
        url={`https://gohaya.com/investir/${opportunity.id}`}
        type="article"
      />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/investir"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux opportunités
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Opportunity Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Opportunité d'Investissement
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(opportunity.investment_stage)}`}>
                  {getStageLabel(opportunity.investment_stage)}
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Publié le {new Date(opportunity.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Opportunité vérifiée</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {formatAmount(opportunity.target_amount)}
                  </div>
                  <div className="text-sm text-gray-600">Montant recherché</div>
                </div>
                
                {opportunity.equity_offered && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {opportunity.equity_offered}%
                    </div>
                    <div className="text-sm text-gray-600">Capital offert</div>
                  </div>
                )}
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {formatAmount(opportunity.minimum_investment)}
                  </div>
                  <div className="text-sm text-gray-600">Investissement min.</div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Description pour les Investisseurs
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {opportunity.description_for_investors}
                </p>
              </div>
            </motion.div>

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Documents Disponibles
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {opportunity.pitch_deck_url && (
                  <a
                    href={opportunity.pitch_deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Pitch Deck</div>
                      <div className="text-sm text-gray-600">Présentation investisseur</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                  </a>
                )}
                
                {opportunity.financial_projections_url && (
                  <a
                    href={opportunity.financial_projections_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Projections Financières</div>
                      <div className="text-sm text-gray-600">Prévisions et business plan</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                  </a>
                )}
              </div>
              
              {!opportunity.pitch_deck_url && !opportunity.financial_projections_url && (
                <p className="text-gray-500 text-center py-8">
                  Aucun document public disponible. Contactez l'équipe pour plus d'informations.
                </p>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Investment Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Résumé de l'Investissement
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stade</span>
                    <span className="font-semibold">{getStageLabel(opportunity.investment_stage)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Montant recherché</span>
                    <span className="font-semibold">{formatAmount(opportunity.target_amount)}</span>
                  </div>
                  {opportunity.equity_offered && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Capital offert</span>
                      <span className="font-semibold text-green-600">{opportunity.equity_offered}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Investissement min.</span>
                    <span className="font-semibold">{formatAmount(opportunity.minimum_investment)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Investment Interest Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <InvestmentInterestForm
                  fundraisingId={opportunity.id}
                  minimumInvestment={opportunity.minimum_investment}
                  onSubmit={handleInterestSubmit}
                  loading={interestLoading}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FundraisingDetailPage;