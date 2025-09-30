import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Globe,
  ShoppingCart,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Eye,
  Settings,
  MessageSquare,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface PlatformStats {
  total_users: number;
  total_websites: number;
  total_link_listings: number;
  total_purchase_requests: number;
  total_transactions: number;
  total_revenue: number;
  total_blog_posts: number;
  total_success_stories: number;
  pending_approvals: number;
  recent_activities: any[];
  revenue_chart: any[];
  user_growth: any[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    trackPageView('/admin', 'Dashboard Admin | Back.ma');
    loadPlatformStats();
  }, []);

  const loadPlatformStats = async () => {
    try {
      setLoading(true);

      // Récupérer les statistiques de la plateforme avec gestion d'erreur
      const results = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('websites').select('*', { count: 'exact', head: true }),
        supabase.from('link_listings').select('*', { count: 'exact', head: true }),
        supabase.from('link_purchase_requests').select('*', { count: 'exact', head: true }),
        supabase.from('credit_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('credit_transactions').select('amount').eq('type', 'credit'),
        supabase.from('link_purchase_requests').select('*').eq('status', 'pending'),
        supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      // Extraire les données avec gestion d'erreur
      const [
        usersResult,
        websitesResult,
        listingsResult,
        requestsResult,
        transactionsResult,
        revenueResult,
        pendingResult,
        activitiesResult
      ] = results;

      const usersCount = usersResult.status === 'fulfilled' ? usersResult.value.count : 0;
      const websitesCount = websitesResult.status === 'fulfilled' ? websitesResult.value.count : 0;
      const listingsCount = listingsResult.status === 'fulfilled' ? listingsResult.value.count : 0;
      const requestsCount = requestsResult.status === 'fulfilled' ? requestsResult.value.count : 0;
      const transactionsCount = transactionsResult.status === 'fulfilled' ? transactionsResult.value.count : 0;
      const revenueData = revenueResult.status === 'fulfilled' ? revenueResult.value.data : [];
      const pendingData = pendingResult.status === 'fulfilled' ? pendingResult.value.data : [];
      const recentActivities = activitiesResult.status === 'fulfilled' ? activitiesResult.value.data : [];

      // Calculer le revenu total
      const totalRevenue = revenueData?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;

      // Générer des données de graphique (simulation)
      const revenueChart = generateChartData('revenue');
      const userGrowth = generateChartData('users');

      setStats({
        total_users: usersCount,
        total_websites: websitesCount,
        total_link_listings: listingsCount,
        total_purchase_requests: requestsCount,
        total_transactions: transactionsCount,
        total_revenue: totalRevenue,
        total_blog_posts: 0, // Table non disponible
        total_success_stories: 0, // Table non disponible
        pending_approvals: pendingData?.length || 0,
        recent_activities: recentActivities,
        revenue_chart: revenueChart,
        user_growth: userGrowth
      });

    } catch (error) {
      console.error('Error loading platform stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (type: string) => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      if (type === 'revenue') {
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 10000) + 1000
        });
      } else {
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 50) + 10
        });
      }
    }
    
    return data;
  };

  const quickActions = [
    {
      name: 'Gérer les Utilisateurs',
      description: 'Voir et gérer tous les utilisateurs',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      name: 'Modérer les Sites',
      description: 'Approuver ou rejeter les sites web',
      icon: Globe,
      href: '/admin/websites',
      color: 'bg-green-500'
    },
    {
      name: 'Transactions',
      description: 'Suivre les transactions financières',
      icon: DollarSign,
      href: '/admin/transactions',
      color: 'bg-purple-500'
    },
    {
      name: 'Paramètres',
      description: 'Configurer la plateforme',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble de la plateforme Back.ma
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Dernière mise à jour</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString('fr-FR')}
              </div>
            </div>
            <button
              onClick={loadPlatformStats}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Utilisateurs</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_users}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Revenus</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_revenue.toLocaleString()} MAD</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Demandes</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_purchase_requests}</div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Graphique des revenus */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Revenus</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {stats?.revenue_chart.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ 
                      height: `${(item.value / Math.max(...stats.revenue_chart.map(d => d.value))) * 200}px` 
                    }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activités récentes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités Récentes</h3>
            <div className="space-y-4">
              {stats?.recent_activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      Transaction de {activity.amount} MAD
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => navigate(action.href)}
                  className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white mr-3`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{action.name}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Statistiques secondaires */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sites Web</span>
                <span className="text-sm font-medium text-gray-900">{stats?.total_websites}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Annonces</span>
                <span className="text-sm font-medium text-gray-900">{stats?.total_link_listings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="text-sm font-medium text-gray-900">{stats?.total_transactions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Articles Blog</span>
                <span className="text-sm font-medium text-gray-900">{stats?.total_blog_posts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Stories</span>
                <span className="text-sm font-medium text-gray-900">{stats?.total_success_stories}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">En attente</span>
                <span className="text-sm font-medium text-red-600">{stats?.pending_approvals}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;