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
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '../../types';
import { 
  getCurrentUser,
  getCurrentUserProfile
} from '../../lib/supabase';

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          // Récupérer le profil utilisateur avec le rôle
          console.log('🔍 Fetching user profile for user:', currentUser.id);
          const profile = await getCurrentUserProfile();
          console.log('🔍 Profile retrieved:', profile);
          setUserProfile(profile);
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
      value: 0, // À connecter avec la base de données
      icon: Globe,
      color: 'bg-blue-500',
      href: '/dashboard/websites'
    },
    {
      name: 'Annonces Actives',
      value: 0, // À connecter avec la base de données
      icon: LinkIcon,
      color: 'bg-green-500',
      href: '/dashboard/link-listings'
    },
    {
      name: 'Demandes Reçues',
      value: 0, // À connecter avec la base de données
      icon: MessageSquare,
      color: 'bg-purple-500',
      href: '/dashboard/purchase-requests'
    },
    {
      name: 'Revenus Totaux',
      value: '0 MAD', // À connecter avec la base de données
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/dashboard/transactions'
    }
  ];

  // Stats pour les annonceurs (advertisers)
  const advertiserStats = [
    {
      name: 'Mes Achats',
      value: 0, // À connecter avec la base de données
      icon: ShoppingCart,
      color: 'bg-blue-500',
      href: '/dashboard/purchases'
    },
    {
      name: 'Demandes Envoyées',
      value: 0, // À connecter avec la base de données
      icon: FileText,
      color: 'bg-green-500',
      href: '/dashboard/purchase-requests'
    },
    {
      name: 'Budget Utilisé',
      value: '0 MAD', // À connecter avec la base de données
      icon: DollarSign,
      color: 'bg-purple-500',
      href: '/dashboard/purchases'
    },
    {
      name: 'Liens Actifs',
      value: 0, // À connecter avec la base de données
      icon: CheckCircle,
      color: 'bg-yellow-500',
      href: '/dashboard/purchases'
    }
  ];

  // Stats communes
  const commonStats = [
    {
      name: 'Messages',
      value: 0, // À connecter avec la base de données
      icon: MessageSquare,
      color: 'bg-indigo-500',
      href: '/dashboard/messages'
    },
    {
      name: 'Notifications',
      value: 0, // À connecter avec la base de données
      icon: Bell,
      color: 'bg-red-500',
      href: '/dashboard/notifications'
    }
  ];

  const stats = userProfile?.role === 'publisher' 
    ? [...publisherStats, ...commonStats]
    : userProfile?.role === 'advertiser'
    ? [...advertiserStats, ...commonStats]
    : commonStats;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de bord
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {user?.email}
            </p>
            {userProfile?.role && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userProfile.role === 'publisher' 
                    ? 'bg-blue-100 text-blue-800'
                    : userProfile.role === 'advertiser'
                    ? 'bg-green-100 text-green-800'
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
            <div className="text-sm text-gray-500">Dernière connexion</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Link to={stat.href} className="block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userProfile?.role === 'publisher' && (
            <>
              <Link
                to="/dashboard/websites/new"
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Ajouter un site</span>
              </Link>
              <Link
                to="/dashboard/link-listings/new"
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Créer une annonce</span>
              </Link>
            </>
          )}
          
          {userProfile?.role === 'advertiser' && (
            <Link
              to="/liens"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Voir les liens</span>
            </Link>
          )}
          
          <Link
            to="/dashboard/messages"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Messages</span>
          </Link>
          
          <Link
            to="/dashboard/profile"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Mon profil</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Bienvenue sur Authority.ma !</span>
            <span className="text-gray-400">Aujourd'hui</span>
          </div>
          <div className="text-sm text-gray-500 text-center py-4">
            Aucune activité récente
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;