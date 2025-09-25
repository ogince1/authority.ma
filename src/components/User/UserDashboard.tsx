import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  MessageSquare, 
  FileText,
  DollarSign, 
  TrendingUp,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  Users,
  Link as LinkIcon,
  ShoppingCart,
  Bell,
  Target,
  AlertTriangle,
  Search,
  Package,
  Zap,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Filter,
  Calendar,
  CreditCard,
  TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '../../types';
import { 
  getCurrentUser,
  getCurrentUserProfile,
  getUserBalance,
  getLinkPurchaseTransactions,
  getUserServiceRequests,
  getWebsites,
  getLinkListings,
  getLinkPurchaseRequests,
  getCreditTransactions,
  getMessages,
  getNotifications
} from '../../lib/supabase';

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [balance, setBalance] = React.useState<number>(0);
  const [unreadMessages, setUnreadMessages] = React.useState<number>(0);
  const [stats, setStats] = React.useState({
    totalPurchases: 0,
    totalSpent: 0,
    activeLinks: 0,
    pendingRequests: 0,
    serviceRequests: 0
  });

  // États pour les données des éditeurs
  const [publisherData, setPublisherData] = React.useState({
    websitesCount: 0,
    linkListingsCount: 0,
    purchaseRequestsCount: 0,
    totalEarnings: 0
  });

  // États pour les données communes
  const [commonData, setCommonData] = React.useState({
    messagesCount: 0,
    notificationsCount: 0,
    disputesCount: 0
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          // Récupérer le profil utilisateur avec le rôle
          const profile = await getCurrentUserProfile();
          setUserProfile(profile);

          // Récupérer le solde
          const userBalance = await getUserBalance(currentUser.id);
          setBalance(userBalance);

          // Charger les messages non lus
          try {
            const { supabase } = await import('../../lib/supabase');
            const { data: conversations, error } = await supabase
              .from('conversations')
              .select('advertiser_id, publisher_id, unread_count_advertiser, unread_count_publisher')
              .or(`advertiser_id.eq.${currentUser.id},publisher_id.eq.${currentUser.id}`);

            if (!error && conversations) {
              let totalUnread = 0;
              conversations.forEach(conv => {
                if (conv.advertiser_id === currentUser.id) {
                  totalUnread += conv.unread_count_advertiser || 0;
                } else if (conv.publisher_id === currentUser.id) {
                  totalUnread += conv.unread_count_publisher || 0;
                }
              });
              console.log('📧 Messages non lus (Dashboard):', totalUnread, 'conversations:', conversations.length);
              setUnreadMessages(totalUnread);
            }
          } catch (error) {
            console.error('Error loading unread messages:', error);
          }

          // Si c'est un éditeur, charger ses données spécifiques
          if (profile?.role === 'publisher') {
            try {
              const [websites, linkListings, purchaseRequests, transactions] = await Promise.all([
                getWebsites({ user_id: currentUser.id }),
                getLinkListings({ user_id: currentUser.id }),
                getLinkPurchaseRequests({ publisher_id: currentUser.id }),
                getCreditTransactions(currentUser.id)
              ]);

              const totalEarnings = transactions
                .filter(t => t.type === 'commission' || t.type === 'deposit')
                .reduce((sum, t) => sum + t.amount, 0);

              setPublisherData({
                websitesCount: websites.length,
                linkListingsCount: linkListings.length,
                purchaseRequestsCount: purchaseRequests.length,
                totalEarnings
              });

              console.log('📊 Données éditeur chargées:', {
                websites: websites.length,
                linkListings: linkListings.length,
                purchaseRequests: purchaseRequests.length,
                totalEarnings
              });
            } catch (error) {
              console.error('Erreur lors du chargement des données éditeur:', error);
            }
          }

          // Charger les données communes (messages, notifications, disputes)
          try {
            const [messages, notifications] = await Promise.all([
              getMessages(currentUser.id),
              getNotifications(currentUser.id)
            ]);

            setCommonData({
              messagesCount: messages.length,
              notificationsCount: notifications.length,
              disputesCount: 0 // Pas de fonction disputes pour l'instant
            });

            console.log('📊 Données communes chargées:', {
              messages: messages.length,
              notifications: notifications.length
            });
          } catch (error) {
            console.error('Erreur lors du chargement des données communes:', error);
          }

          // Récupérer les statistiques
          const [purchases, serviceRequests] = await Promise.all([
            getLinkPurchaseTransactions({ advertiser_id: currentUser.id }),
            getUserServiceRequests(currentUser.id)
          ]);

          const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
          const activeLinks = purchases.filter(p => p.status === 'completed').length;
          const pendingRequests = purchases.filter(p => p.status === 'pending').length;

          setStats({
            totalPurchases: purchases.length,
            totalSpent,
            activeLinks,
            pendingRequests,
            serviceRequests: serviceRequests.length
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Stats pour les éditeurs (publishers)
  const publisherStats = [
    {
      name: 'Mes Sites Web',
      value: publisherData.websitesCount,
      icon: Globe,
      color: 'bg-blue-500',
      href: '/dashboard/websites'
    },
    {
      name: 'Mes Liens Existants',
      value: publisherData.linkListingsCount,
      icon: LinkIcon,
      color: 'bg-green-500',
      href: '/dashboard/link-listings'
    },
    {
      name: 'Demandes Reçues',
      value: publisherData.purchaseRequestsCount,
      icon: MessageSquare,
      color: 'bg-purple-500',
      href: '/dashboard/purchase-requests',
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    {
      name: 'Revenus Totaux',
      value: `${publisherData.totalEarnings} MAD`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/dashboard/transactions'
    }
  ];

  // Stats modernes pour les annonceurs
  const advertiserStats = [
    {
      name: 'Solde Disponible',
      value: `${balance.toLocaleString()} MAD`,
      icon: CreditCard,
      color: 'bg-gradient-to-r from-emerald-500 to-green-500',
      href: '/dashboard/balance',
      trend: '+12%',
      trendUp: true
    },
    {
      name: 'Achats Totaux',
      value: stats.totalPurchases,
      icon: ShoppingCart,
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      href: '/dashboard/purchases',
      trend: '+8%',
      trendUp: true
    },
    {
      name: 'Budget Dépensé',
      value: `${stats.totalSpent.toLocaleString()} MAD`,
      icon: TrendingDown,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      href: '/dashboard/purchases',
      trend: '-5%',
      trendUp: false
    },
    {
      name: 'Liens Actifs',
      value: stats.activeLinks,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      href: '/dashboard/purchases',
      trend: '+15%',
      trendUp: true
    },
    {
      name: 'Demandes en Attente',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      href: '/dashboard/purchase-requests',
      trend: '+3',
      trendUp: true,
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    {
      name: 'Services Demandés',
      value: stats.serviceRequests,
      icon: Package,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      href: '/dashboard/services',
      trend: '+2',
      trendUp: true
    }
  ];

  // Stats communes
  const commonStats = [
    {
      name: 'Messages',
      value: commonData.messagesCount,
      icon: MessageSquare,
      color: 'bg-indigo-500',
      href: '/dashboard/messages'
    },
    {
      name: 'Notifications',
      value: commonData.notificationsCount,
      icon: Bell,
      color: 'bg-red-500',
      href: '/dashboard/notifications'
    },
    {
      name: 'Mes Disputes',
      value: commonData.disputesCount,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      href: '/disputes'
    }
  ];

  const dashboardStats = userProfile?.role === 'publisher' 
    ? [...publisherStats, ...commonStats]
    : userProfile?.role === 'advertiser'
    ? [...advertiserStats, ...commonStats]
    : commonStats;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Bienvenue, <span className="font-semibold text-gray-900">{user?.email}</span>
              </p>
              {userProfile?.role && (
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    userProfile.role === 'publisher' 
                      ? 'bg-blue-100 text-blue-800'
                      : userProfile.role === 'advertiser'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userProfile.role === 'publisher' ? 'Éditeur' : 
                     userProfile.role === 'advertiser' ? 'Annonceur' : 
                     userProfile.role}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Dernière connexion</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards Modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={stat.href} className="block">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform duration-300 relative`}>
                      <stat.icon className="h-6 w-6 text-white" />
                      {stat.badge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                          {stat.badge}
                        </span>
                      )}
                    </div>
                    {stat.trend && (
                      <div className={`flex items-center space-x-1 text-sm font-medium ${
                        stat.trendUp ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stat.trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        <span>{stat.trend}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Actions Rapides Modernes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="h-6 w-6 text-emerald-600 mr-3" />
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {userProfile?.role === 'publisher' && (
              <>
                <Link
                  to="/dashboard/websites/new"
                  className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Ajouter un site</span>
                </Link>
                <Link
                  to="/dashboard/link-listings/new"
                  className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <LinkIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Créer une annonce</span>
                </Link>
              </>
            )}
            
            {userProfile?.role === 'advertiser' && (
              <>
                <Link
                  to="/dashboard/quick-buy"
                  className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Search className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Trouver des médias</span>
                </Link>
                <Link
                  to="/dashboard/services"
                  className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Services</span>
                </Link>
                <Link
                  to="/dashboard/balance"
                  className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Gérer mon solde</span>
                </Link>
                <Link
                  to="/dashboard/purchases"
                  className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Mes achats</span>
                </Link>
              </>
            )}
            
            <Link
              to="/dashboard/messages"
              className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 hover:shadow-md"
            >
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Messages</span>
            </Link>
            
            <Link
              to="/dashboard/disputes"
              className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 hover:shadow-md"
            >
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Mes Disputes</span>
            </Link>
            
            <Link
              to="/dashboard/profile"
              className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Mon profil</span>
            </Link>
          </div>
        </motion.div>

        {/* Activité Récente Moderne */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 text-blue-600 mr-3" />
            Activité récente
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Bienvenue sur Back.ma !</p>
                <p className="text-xs text-gray-600">Votre tableau de bord est prêt à l'emploi</p>
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            {userProfile?.role === 'advertiser' && (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Commencez votre première campagne</h3>
                <p className="text-gray-600 mb-4">Explorez nos médias et services pour booster votre visibilité</p>
                <Link
                  to="/dashboard/quick-buy"
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Trouver des médias
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserDashboard;