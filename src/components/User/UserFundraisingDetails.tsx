import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  Eye,
  MessageSquare,
  Share2,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FundraisingOpportunity, InvestmentInterest } from '../../types';
import { getFundraisingOpportunityById, getInvestmentInterests, getCurrentUser } from '../../lib/supabase';
import toast from 'react-hot-toast';

const UserFundraisingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = React.useState<FundraisingOpportunity | null>(null);
  const [investmentInterests, setInvestmentInterests] = React.useState<InvestmentInterest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate('/dashboard');
          return;
        }
        setCurrentUser(user);

        if (id) {
          const opportunityData = await getFundraisingOpportunityById(id);
          if (!opportunityData) {
            toast.error('Opportunité non trouvée');
            navigate('/dashboard/fundraising');
            return;
          }

          // Vérifier que l'utilisateur est propriétaire
          if (opportunityData.user_id !== user.id) {
            toast.error('Vous n\'avez pas accès à cette opportunité');
            navigate('/dashboard/fundraising');
            return;
          }

          setOpportunity(opportunityData);

          // Récupérer les intérêts d'investissement
          const interests = await getInvestmentInterests();
          const filteredInterests = interests.filter(interest => 
            interest.fundraising_id === id
          );
          setInvestmentInterests(filteredInterests);
        }
      } catch (error) {
        console.error('Error fetching opportunity details:', error);
        toast.error('Erreur lors du chargement des détails');
        navigate('/dashboard/fundraising');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'funded': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'funded': return 'Financé';
      case 'closed': return 'Fermé';
      case 'paused': return 'En pause';
      default: return status;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/investir/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Lien copié dans le presse-papiers');
  };

  const totalInterestAmount = investmentInterests.reduce((sum, interest) => sum + interest.investment_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Opportunité non trouvée</p>
        <Link
          to="/dashboard/fundraising"
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/fundraising')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Détails de l'opportunité
            </h1>
            <p className="text-gray-600">
              Gérez votre opportunité de levée de fonds
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={copyShareLink}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Partager</span>
          </button>
          <Link
            to={`/investir/${opportunity.id}`}
            target="_blank"
            className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Voir en ligne</span>
          </Link>
          <Link
            to={`/dashboard/fundraising/${opportunity.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Modifier</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Montant cible</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(opportunity.target_amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Intérêts reçus</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(totalInterestAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Investisseurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {investmentInterests.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <PieChart className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Progression</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((totalInterestAmount / opportunity.target_amount) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Opportunity Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Informations générales
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stade d'investissement
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(opportunity.investment_stage)}`}>
                  {getStageLabel(opportunity.investment_stage)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(opportunity.status)}`}>
                  {getStatusLabel(opportunity.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investissement minimum
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatAmount(opportunity.minimum_investment)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parts offertes
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {opportunity.equity_offered ? `${opportunity.equity_offered}%` : 'À négocier'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Description pour les investisseurs
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {opportunity.description_for_investors}
              </p>
            </div>
          </div>

          {/* Investment Interests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Intérêts d'investissement ({investmentInterests.length})
            </h2>
            
            {investmentInterests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Aucun intérêt d'investissement reçu pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {investmentInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {interest.investor_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {interest.investor_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {interest.investor_email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          {formatAmount(interest.investment_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(interest.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {interest.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          {interest.message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h3>
            <div className="space-y-3">
              <Link
                to={`/dashboard/fundraising/${opportunity.id}/edit`}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier l'opportunité
              </Link>
              <button
                onClick={copyShareLink}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copier le lien
              </button>
              <Link
                to={`/investir/${opportunity.id}`}
                target="_blank"
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir en ligne
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Progression de la levée
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Montant levé</span>
                  <span>{Math.round((totalInterestAmount / opportunity.target_amount) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((totalInterestAmount / opportunity.target_amount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium">{formatAmount(totalInterestAmount)}</span> levés sur{' '}
                  <span className="font-medium">{formatAmount(opportunity.target_amount)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Chronologie
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Opportunité créée
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(opportunity.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              {opportunity.updated_at !== opportunity.created_at && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Dernière mise à jour
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(opportunity.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
              {investmentInterests.length > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Premier intérêt reçu
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(investmentInterests[investmentInterests.length - 1].created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserFundraisingDetails;