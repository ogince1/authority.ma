import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderOpen, 
  MessageSquare, 
  FileText,
  DollarSign, 
  TrendingUp,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Project, Proposal, FundraisingOpportunity, InvestmentInterest, UserRole } from '../../types';
import { 
  getProjects, 
  getProposals, 
  getFundraisingOpportunities,
  getInvestmentInterests,
  getCurrentUser,
  getCurrentUserProfile
} from '../../lib/supabase';
import InvestorDashboard from './InvestorDashboard';

const UserDashboard: React.FC = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [fundraising, setFundraising] = React.useState<FundraisingOpportunity[]>([]);
  const [interests, setInterests] = React.useState<InvestmentInterest[]>([]);
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

          // Si c'est un entrepreneur, récupérer ses données
          if (profile?.role === 'entrepreneur') {
            const [projectsData, proposalsData, fundraisingData, interestsData] = await Promise.all([
              getProjects({ user_id: currentUser.id }),
              getProposals({ user_id: currentUser.id }),
              getFundraisingOpportunities({ user_id: currentUser.id }),
              getInvestmentInterests({ user_id: currentUser.id })
            ]);
            
            setProjects(projectsData);
            setProposals(proposalsData);
            setFundraising(fundraisingData);
            setInterests(interestsData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      name: 'Mes Projets',
      value: projects.length,
      icon: FolderOpen,
      color: 'bg-blue-500',
      href: '/dashboard/projects'
    },
    {
      name: 'Propositions Reçues',
      value: proposals.length,
      icon: MessageSquare,
      color: 'bg-green-500',
      href: '/dashboard/proposals'
    },
    {
      name: 'Levées de Fonds',
      value: fundraising.length,
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/dashboard/fundraising'
    },
    {
      name: 'Intérêts Investisseurs',
      value: interests.length,
      icon: Users,
      color: 'bg-indigo-500',
      href: '/dashboard/investment-interests'
    },
    {
      name: 'Valeur Portfolio',
      value: `${(projects.reduce((sum, p) => sum + p.price, 0) / 1000).toFixed(0)}k MAD`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/dashboard/projects'
    }
  ];

  const recentProjects = projects.slice(0, 5);
  const recentProposals = proposals.slice(0, 5);

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

  // Debug: Afficher le dashboard selon le rôle de l'utilisateur
  console.log('🔍 UserDashboard - userProfile:', userProfile);
  console.log('🔍 UserDashboard - role:', userProfile?.role);
  
  if (userProfile?.role === 'investor') {
    console.log('✅ Redirecting to InvestorDashboard');
    return <InvestorDashboard />;
  }
  


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Tableau de Bord</h1>
          <p className="text-gray-600">Gérez vos projets et suivez vos activités</p>
        </div>
        <Link
          to="/dashboard/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Projet</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              to={stat.href}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Mes Projets Récents</h2>
              <Link
                to="/dashboard/projects"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun projet pour le moment</p>
                <Link
                  to="/dashboard/projects/new"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Créer votre premier projet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={project.images[0] || 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg'}
                        alt={project.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {project.price.toLocaleString()} MAD
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'sold'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status === 'active' ? 'Actif' : 
                         project.status === 'sold' ? 'Vendu' : 'En attente'}
                      </span>
                      <Link
                        to={`/project/${project.slug}`}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Proposals */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Propositions Récentes</h2>
              <Link
                to="/dashboard/proposals"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentProposals.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune proposition reçue</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {proposal.buyer_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {proposal.buyer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {proposal.proposed_price.toLocaleString()} MAD
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        proposal.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : proposal.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {proposal.status === 'pending' ? (
                          <><Clock className="h-3 w-3 mr-1" />En attente</>
                        ) : proposal.status === 'accepted' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" />Acceptée</>
                        ) : (
                          'Refusée'
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <div className="flex space-x-2">
        <Link
          to="/dashboard/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Projet</span>
        </Link>
      </div>
    </div>
  );
};

export default UserDashboard;