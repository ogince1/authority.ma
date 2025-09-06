import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  Eye,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface Dispute {
  id: string;
  title: string;
  dispute_type: string;
  status: string;
  opened_at: string;
  resolution_type?: string;
  resolution_amount?: number;
  purchase_request?: {
    id: string;
    proposed_price: number;
    anchor_text: string;
  };
  initiator?: {
    id: string;
    name: string;
    email: string;
  };
  respondent?: {
    id: string;
    name: string;
    email: string;
  };
}

const DisputesList: React.FC = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = React.useState<Dispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<any>(null);
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    trackPageView('/dashboard/disputes', 'Mes Disputes | Back.ma');
    loadDisputes();
    loadStats();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      
      // Récupérer les disputes de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          purchase_request:link_purchase_requests(
            id,
            proposed_price,
            anchor_text
          ),
          initiator:users!disputes_initiator_id_fkey(
            id,
            name,
            email
          ),
          respondent:users!disputes_respondent_id_fkey(
            id,
            name,
            email
          )
        `)
        .or(`initiator_id.eq.${user.id},respondent_id.eq.${user.id}`)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error('Erreur lors du chargement des disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_dispute_stats', { user_uuid: user.id });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error('Error loading dispute stats:', error);
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels = {
      link_not_placed: 'Lien non placé',
      link_removed: 'Lien supprimé',
      wrong_url: 'Mauvais URL',
      wrong_anchor_text: 'Mauvais texte d\'ancrage',
      poor_quality: 'Qualité médiocre',
      late_delivery: 'Livraison tardive',
      non_compliance: 'Non-conformité',
      other: 'Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      open: { color: 'bg-yellow-100 text-yellow-800', text: 'Ouverte', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', text: 'En cours', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Résolue', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', text: 'Fermée', icon: XCircle },
      escalated: { color: 'bg-red-100 text-red-800', text: 'Escaladée', icon: AlertTriangle }
    };

    const configItem = config[status as keyof typeof config] || config.open;
    const Icon = configItem.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {configItem.text}
      </span>
    );
  };

  const getResolutionBadge = (resolutionType?: string, amount?: number) => {
    if (!resolutionType) return null;

    const config = {
      refund_full: { color: 'bg-green-100 text-green-800', text: 'Remboursement complet' },
      refund_partial: { color: 'bg-blue-100 text-blue-800', text: 'Remboursement partiel' },
      replacement: { color: 'bg-purple-100 text-purple-800', text: 'Remplacement' },
      compensation: { color: 'bg-orange-100 text-orange-800', text: 'Compensation' },
      dismissed: { color: 'bg-gray-100 text-gray-800', text: 'Rejetée' }
    };

    const configItem = config[resolutionType as keyof typeof config] || config.dismissed;

    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
          {configItem.text}
        </span>
        {amount && (
          <span className="text-sm font-medium text-gray-900">
            {amount} MAD
          </span>
        )}
      </div>
    );
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesFilter = filter === 'all' || dispute.status === filter;
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.dispute_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Disputes</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos disputes et réclamations
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/disputes/new')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Dispute
          </button>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Total Disputes</div>
                  <div className="text-lg font-bold text-blue-900">{stats.total_disputes}</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-yellow-900">Ouvertes</div>
                  <div className="text-lg font-bold text-yellow-900">{stats.open_disputes}</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-green-900">Résolues</div>
                  <div className="text-lg font-bold text-green-900">{stats.resolved_disputes}</div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-purple-900">Remboursements</div>
                  <div className="text-lg font-bold text-purple-900">{stats.total_refunds} MAD</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une dispute..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les disputes</option>
              <option value="open">Ouvertes</option>
              <option value="under_review">En cours</option>
              <option value="resolved">Résolues</option>
              <option value="closed">Fermées</option>
              <option value="escalated">Escaladées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des disputes */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredDisputes.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {disputes.length === 0 ? 'Aucune dispute' : 'Aucune dispute trouvée'}
            </h3>
            <p className="text-gray-500 mb-4">
              {disputes.length === 0 
                ? 'Vous n\'avez pas encore de disputes.'
                : 'Aucune dispute ne correspond à vos critères de recherche.'
              }
            </p>
            {disputes.length === 0 && (
              <button
                onClick={() => navigate('/dashboard/disputes/new')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une dispute
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispute
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDisputes.map((dispute) => (
                  <motion.tr
                    key={dispute.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dispute.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dispute.purchase_request?.anchor_text}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getDisputeTypeLabel(dispute.dispute_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(dispute.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dispute.purchase_request?.proposed_price} MAD
                      </div>
                      {dispute.resolution_type && (
                        <div className="mt-1">
                          {getResolutionBadge(dispute.resolution_type, dispute.resolution_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dispute.opened_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/dashboard/disputes/${dispute.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/disputes/${dispute.id}/messages`)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputesList; 