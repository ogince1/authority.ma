import React from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Download,
  Shield,
  Award
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
  resolved_at?: string;
  resolution_type?: string;
  resolution_amount?: number;
  description: string;
  initiator_id: string;
  respondent_id: string;
  assigned_admin_id?: string;
  purchase_request?: {
    id: string;
    proposed_price: number;
    anchor_text: string;
    target_url: string;
    placed_url?: string;
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
  assigned_admin?: {
    id: string;
    name: string;
  };
  messages_count?: number;
}

const DisputesManagement: React.FC = () => {
  const [disputes, setDisputes] = React.useState<Dispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [selectedDispute, setSelectedDispute] = React.useState<Dispute | null>(null);
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    trackPageView('/admin/disputes', 'Gestion Disputes | Back.ma');
    loadDisputes();
    loadStats();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);

      const { data: disputesData, error } = await supabase
        .from('disputes')
        .select(`
          *,
          purchase_request:link_purchase_requests(
            id,
            proposed_price,
            anchor_text,
            target_url,
            placed_url
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
          ),
          assigned_admin:users!disputes_assigned_admin_id_fkey(
            id,
            name
          ),
          dispute_messages(count)
        `)
        .order('opened_at', { ascending: false });

      if (error) throw error;

      const transformedDisputes = disputesData?.map(dispute => ({
        ...dispute,
        messages_count: dispute.dispute_messages?.[0]?.count || 0
      })) || [];

      setDisputes(transformedDisputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error('Erreur lors du chargement des disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_dispute_stats', { user_uuid: null });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error('Error loading dispute stats:', error);
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.dispute_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    const matchesType = typeFilter === 'all' || dispute.dispute_type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || getPriority(dispute) === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getPriority = (dispute: Dispute) => {
    // Logique de priorité basée sur le type et l'âge
    const daysSinceOpened = Math.floor((Date.now() - new Date(dispute.opened_at).getTime()) / (1000 * 60 * 60 * 24));
    
    if (dispute.dispute_type === 'link_not_placed' && daysSinceOpened > 7) return 'high';
    if (dispute.dispute_type === 'link_removed') return 'high';
    if (daysSinceOpened > 14) return 'high';
    if (daysSinceOpened > 7) return 'medium';
    return 'low';
  };

  const handleStatusChange = async (disputeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', disputeId);

      if (error) throw error;

      toast.success(`Statut de la dispute mis à jour`);
      loadDisputes();
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleAssignAdmin = async (disputeId: string, adminId: string) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ assigned_admin_id: adminId })
        .eq('id', disputeId);

      if (error) throw error;

      toast.success('Admin assigné avec succès');
      loadDisputes();
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const resolveDispute = async (disputeId: string, resolutionType: string, resolutionAmount?: number, notes?: string) => {
    try {
      const { error } = await supabase
        .rpc('resolve_dispute', {
          p_dispute_id: disputeId,
          p_resolution_type: resolutionType,
          p_resolution_amount: resolutionAmount || 0,
          p_resolution_notes: notes || ''
        });

      if (error) throw error;

      toast.success('Dispute résolue avec succès');
      loadDisputes();
      setShowDisputeModal(false);
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  const exportDisputes = () => {
    const csvContent = [
      ['ID', 'Titre', 'Type', 'Statut', 'Initié par', 'Répondant', 'Montant', 'Date ouverture', 'Date résolution'],
      ...filteredDisputes.map(dispute => [
        dispute.id,
        dispute.title,
        dispute.dispute_type,
        dispute.status,
        dispute.initiator?.name || 'N/A',
        dispute.respondent?.name || 'N/A',
        dispute.purchase_request?.proposed_price?.toString() || '0',
        new Date(dispute.opened_at).toLocaleDateString('fr-FR'),
        dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleDateString('fr-FR') : 'Non résolue'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disputes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export des disputes terminé');
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

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { color: 'bg-red-100 text-red-800', text: 'Haute' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Moyenne' },
      low: { color: 'bg-green-100 text-green-800', text: 'Basse' }
    };

    const configItem = config[priority as keyof typeof config] || config.low;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        {configItem.text}
      </span>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Disputes</h1>
            <p className="text-gray-600 mt-1">
              Gérez et résolvez les disputes de la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportDisputes}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
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
        <div className="flex flex-col sm:flex-row gap-4">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="open">Ouvertes</option>
              <option value="under_review">En cours</option>
              <option value="resolved">Résolues</option>
              <option value="closed">Fermées</option>
              <option value="escalated">Escaladées</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="link_not_placed">Lien non placé</option>
              <option value="link_removed">Lien supprimé</option>
              <option value="wrong_url">Mauvais URL</option>
              <option value="wrong_anchor_text">Mauvais texte d'ancrage</option>
              <option value="poor_quality">Qualité médiocre</option>
              <option value="late_delivery">Livraison tardive</option>
              <option value="non_compliance">Non-conformité</option>
              <option value="other">Autre</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des disputes */}
      <div className="bg-white rounded-lg shadow-sm">
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
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parties
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
                    {getPriorityBadge(getPriority(dispute))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {dispute.purchase_request?.proposed_price} MAD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{dispute.initiator?.name}</div>
                      <div className="text-gray-500">vs {dispute.respondent?.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(dispute.opened_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowDisputeModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/dashboard/disputes/${dispute.id}/messages`, '_blank')}
                        className="text-green-600 hover:text-green-900"
                        title="Messages"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <select
                        value={dispute.status}
                        onChange={(e) => handleStatusChange(dispute.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="open">Ouverte</option>
                        <option value="under_review">En cours</option>
                        <option value="resolved">Résolue</option>
                        <option value="closed">Fermée</option>
                        <option value="escalated">Escaladée</option>
                      </select>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDisputes.length === 0 && (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {disputes.length === 0 ? 'Aucune dispute' : 'Aucune dispute trouvée'}
            </h3>
            <p className="text-gray-500">
              {disputes.length === 0 
                ? 'Aucune dispute n\'a été créée sur la plateforme.'
                : 'Aucune dispute ne correspond à vos critères de recherche.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails dispute */}
      {showDisputeModal && selectedDispute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Détails de la dispute
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titre</label>
                  <p className="text-sm text-gray-900">{selectedDispute.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{getDisputeTypeLabel(selectedDispute.dispute_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{selectedDispute.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant</label>
                  <p className="text-sm text-gray-900">{selectedDispute.purchase_request?.proposed_price} MAD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initié par</label>
                  <p className="text-sm text-gray-900">{selectedDispute.initiator?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Répondant</label>
                  <p className="text-sm text-gray-900">{selectedDispute.respondent?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'ouverture</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDispute.opened_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    window.open(`/dashboard/disputes/${selectedDispute.id}`, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesManagement; 