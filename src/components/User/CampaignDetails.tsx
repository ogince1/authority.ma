import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Calendar,
  Globe,
  Target,
  Activity,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Campaign } from '../../types';
import { getCampaignById, deleteCampaign, getCampaignOrders, getLinkPurchaseRequests, getCurrentUser, supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import CampaignStatusBadge from './CampaignStatusBadge';

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = React.useState<any[]>([]);
  const [campaignStats, setCampaignStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const campaignData = await getCampaignById(id!);
      
      if (!campaignData) {
        toast.error('Campagne non trouvée');
        navigate('/dashboard/campaigns');
        return;
      }
      
      setCampaign(campaignData);
      
      // Récupérer les commandes de la campagne
      const campaignOrders = await getCampaignOrders(id!);
      setOrders(campaignOrders);
      
      // Récupérer les demandes d'achat de la campagne
      const user = await getCurrentUser();
      if (user) {
        const requests = await getLinkPurchaseRequests({ user_id: user.id });
        setPurchaseRequests(requests);
      }

      // Récupérer les statistiques complètes de la campagne
      const { data: stats, error: statsError } = await supabase
        .rpc('get_campaign_complete_stats', { campaign_uuid: id });
      
      if (!statsError && stats && stats.length > 0) {
        setCampaignStats(stats[0]);
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      toast.error('Erreur lors du chargement des données');
      navigate('/dashboard/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCampaign(id!);
      toast.success('Campagne supprimée avec succès !');
      navigate('/dashboard/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erreur lors de la suppression de la campagne');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Utiliser le nouveau composant CampaignStatusBadge
    return <CampaignStatusBadge status={status as any} />;
  };

  const getOrderStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'Confirmée' },
      in_progress: { color: 'bg-purple-100 text-purple-800', text: 'En cours' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Terminée' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Annulée' }
    };

    const configItem = config[status as keyof typeof config] || config.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        {configItem.text}
      </span>
    );
  };

  const getPurchaseRequestStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: '⏳' },
      accepted: { color: 'bg-green-100 text-green-800', text: 'Acceptée', icon: '✅' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Refusée', icon: '❌' },
      negotiating: { color: 'bg-blue-100 text-blue-800', text: 'En négociation', icon: '🤝' }
    };

    const configItem = config[status as keyof typeof config] || config.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <span className="mr-1">{configItem.icon}</span>
        {configItem.text}
      </span>
    );
  };

  const getValidationStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: '⏳' },
      validated: { color: 'bg-green-100 text-green-800', text: 'Validée', icon: '✅' },
      invalid: { color: 'bg-red-100 text-red-800', text: 'Invalide', icon: '❌' },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Expirée', icon: '⏰' }
    };

    const configItem = config[status as keyof typeof config] || config.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <span className="mr-1">{configItem.icon}</span>
        {configItem.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Campagne non trouvée</h2>
          <p className="text-gray-600 mb-4">La campagne que vous recherchez n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate('/dashboard/campaigns')}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux campagnes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/campaigns')}
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-gray-600 mt-1">
                  Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(campaign.status)}
              <button
                onClick={() => navigate(`/dashboard/campaigns/${id}/edit`)}
                className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Supprimer
              </button>
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Demandes Total</div>
                  <div className="text-lg font-bold text-blue-900">
                    {campaignStats?.total_requests || campaign.total_orders || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-green-900">Budget Utilisé</div>
                  <div className="text-lg font-bold text-green-900">
                    {campaign.spent_amount ? campaign.spent_amount.toLocaleString() : campaign.total_spent?.toLocaleString() || '0'} MAD
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-purple-900">Taux de Complétion</div>
                  <div className="text-lg font-bold text-purple-900">
                    {campaignStats?.completion_rate ? `${campaignStats.completion_rate.toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-yellow-900">Liens Placés</div>
                  <div className="text-lg font-bold text-yellow-900">
                    {campaignStats?.links_placed || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations de la campagne */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Détails de la campagne */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Détails de la Campagne
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{campaign.language}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Total</label>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{campaign.budget.toLocaleString()} MAD</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de Création</label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {new Date(campaign.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* URLs de la campagne */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              URLs de la Campagne
            </h2>
            
            <div className="space-y-3">
              {campaign.urls.map((url, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{url}</div>
                    {campaign.extracted_metrics && (
                      <div className="text-xs text-gray-500 mt-1">
                        DR: {campaign.extracted_metrics.dr || 'N/A'} | 
                        TF: {campaign.extracted_metrics.tf || 'N/A'} | 
                        CF: {campaign.extracted_metrics.cf || 'N/A'}
                      </div>
                    )}
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demandes d'achat */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Demandes d'Achat
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              État des demandes d'achat envoyées aux éditeurs
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {purchaseRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Aucune demande d'achat pour cette campagne</p>
                <button
                  onClick={() => navigate(`/dashboard/campaigns/${id}/edit`)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Ajouter des liens
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lien
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Éditeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Proposé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ancre
                    </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Validation
                                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.link_listing?.title || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.target_url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.publisher?.name || 'Éditeur'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.publisher?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.proposed_price.toLocaleString()} MAD
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.anchor_text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.proposed_duration} mois
                        </div>
                      </td>
                                                              <td className="px-6 py-4 whitespace-nowrap">
                                          {getPurchaseRequestStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div>
                                            {request.url_validation_status && getValidationStatusBadge(request.url_validation_status)}
                                            {request.placed_url && (
                                              <div className="mt-1">
                                                <a
                                                  href={request.placed_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                  <ExternalLink className="w-3 h-3 mr-1" />
                                                  Voir le lien placé
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignDetails; 