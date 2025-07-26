import React from 'react';
import { 
  Search, 
  Eye,
  Check,
  X,
  Clock,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InvestmentInterest, FundraisingOpportunity } from '../../types';
import { getInvestmentInterests, updateInvestmentInterestStatus, getAllFundraisingOpportunities } from '../../lib/supabase';
import toast from 'react-hot-toast';

const InvestmentInterestsList: React.FC = () => {
  const [interests, setInterests] = React.useState<InvestmentInterest[]>([]);
  const [opportunities, setOpportunities] = React.useState<FundraisingOpportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [selectedInterest, setSelectedInterest] = React.useState<InvestmentInterest | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interestsData, opportunitiesData] = await Promise.all([
        getInvestmentInterests(),
        getAllFundraisingOpportunities()
      ]);
      setInterests(interestsData);
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (interestId: string, status: 'contacted' | 'rejected') => {
    try {
      await updateInvestmentInterestStatus(interestId, status);
      setInterests(interests.map(i => 
        i.id === interestId ? { ...i, status } : i
      ));
      toast.success(`Intérêt ${status === 'contacted' ? 'marqué comme contacté' : 'rejeté'} avec succès`);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating interest status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getOpportunityInfo = (fundraisingId: string) => {
    const opportunity = opportunities.find(o => o.id === fundraisingId);
    return opportunity ? {
      stage: opportunity.investment_stage,
      targetAmount: opportunity.target_amount
    } : null;
  };

  const filteredInterests = interests.filter(interest => {
    const matchesSearch = 
      interest.investor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interest.investor_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || interest.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'contacted': return 'Contacté';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'contacted': return Check;
      case 'rejected': return X;
      default: return Clock;
    }
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intérêts d'Investissement</h1>
          <p className="text-gray-600">Gérez tous les intérêts d'investissement reçus</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            {interests.filter(i => i.status === 'pending').length} en attente
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
            {interests.filter(i => i.status === 'contacted').length} contactés
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="contacted">Contactés</option>
            <option value="rejected">Rejetés</option>
          </select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-600">
            {filteredInterests.length} intérêt(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Interests List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredInterests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun intérêt trouvé
            </h3>
            <p className="text-gray-600">
              Aucun intérêt d'investissement ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInterests.map((interest, index) => {
                  const StatusIcon = getStatusIcon(interest.status);
                  const opportunityInfo = getOpportunityInfo(interest.fundraising_id);
                  
                  return (
                    <motion.tr
                      key={interest.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {interest.investor_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {interest.investor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {interest.investor_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{interest.fundraising_id.slice(0, 8)}
                        </div>
                        {opportunityInfo && (
                          <div className="text-sm text-gray-500">
                            {getStageLabel(opportunityInfo.stage)} - {formatAmount(opportunityInfo.targetAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(interest.investment_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interest.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusLabel(interest.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(interest.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInterest(interest);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {interest.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(interest.id, 'contacted')}
                                className="text-green-600 hover:text-green-900"
                                title="Marquer comme contacté"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(interest.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                title="Rejeter"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interest Detail Modal */}
      {showModal && selectedInterest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de l'Intérêt d'Investissement
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Investor Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Informations de l'Investisseur
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{selectedInterest.investor_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </label>
                      <div className="mt-1 flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${selectedInterest.investor_email}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedInterest.investor_email}
                        </a>
                      </div>
                    </div>
                    {selectedInterest.investor_phone && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Téléphone
                        </label>
                        <div className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <a
                            href={`tel:${selectedInterest.investor_phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {selectedInterest.investor_phone}
                          </a>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de l'intérêt
                      </label>
                      <div className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-900">
                          {new Date(selectedInterest.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Détails de l'Investissement
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant proposé
                      </label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        {formatAmount(selectedInterest.investment_amount)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInterest.status)}`}>
                          {getStatusLabel(selectedInterest.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {selectedInterest.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message de l'Investisseur
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedInterest.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedInterest.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleStatusUpdate(selectedInterest.id, 'rejected')}
                      className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Rejeter
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedInterest.id, 'contacted')}
                      className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      Marquer comme Contacté
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentInterestsList;