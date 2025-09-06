import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Globe,
  Activity,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Campaign, CampaignStats } from '../../types';
import { 
  getCampaigns, 
  getCampaignStats,
  getCurrentUser 
} from '../../lib/supabase';
import toast from 'react-hot-toast';

const CampaignDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [stats, setStats] = React.useState<CampaignStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  React.useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const campaignsData = await getCampaigns({ user_id: user.id });
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const statsData = await getCampaignStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.urls.some(url => url.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Actif
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Clôturée
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Edit className="w-3 h-3 mr-1" />
            Brouillon
          </span>
        );
      default:
        return null;
    }
  };

  const getMetricsDisplay = (campaign: Campaign) => {
    if (!campaign.extracted_metrics) return 'Non analysé';
    
    const { dr, tf, cf } = campaign.extracted_metrics;
    return `${dr || 0} | ${tf || 0} | ${cf || 0}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Campagnes</h1>
            <p className="text-gray-600 mt-1">Gérez vos campagnes de liens et suivez vos performances</p>
          </div>
          <Link
            to="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Campagne
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Campagnes</p>
                <p className="text-2xl font-bold">{stats?.total_campaigns || 0}</p>
              </div>
              <Target className="w-8 h-8 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Campagnes Actives</p>
                <p className="text-2xl font-bold">{stats?.active_campaigns || 0}</p>
              </div>
              <Activity className="w-8 h-8 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Commandes</p>
                <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Budget Utilisé</p>
                <p className="text-2xl font-bold">{(stats?.total_spent || 0).toLocaleString()} MAD</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tableau des campagnes */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campagnes</h2>
            <div className="flex items-center space-x-4">
              {/* Filtres */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="closed">Clôturée</option>
                  <option value="draft">Brouillon</option>
                </select>
              </div>

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une campagne..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campagne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trafic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Target className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">Aucune campagne trouvée</p>
                      <p className="text-sm">Créez votre première campagne pour commencer</p>
                      <Link
                        to="/dashboard/campaigns/new"
                        className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer une campagne
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign, index) => (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {campaign.urls[0] || 'Aucune URL'}
                      </div>
                      {campaign.urls.length > 1 && (
                        <div className="text-xs text-gray-500">
                          +{campaign.urls.length - 1} autres
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {campaign.language}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.extracted_metrics?.traffic?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.extracted_metrics?.mc?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.extracted_metrics?.dr || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.extracted_metrics?.tf || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.extracted_metrics?.cf || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.budget.toLocaleString()} MAD
                      </div>
                      <div className="text-xs text-gray-500">
                        {campaign.total_spent.toLocaleString()} utilisés
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/dashboard/campaigns/${campaign.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/dashboard/campaigns/${campaign.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            // Logique pour supprimer la campagne
                            toast.error('Fonctionnalité à implémenter');
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CampaignDashboard; 