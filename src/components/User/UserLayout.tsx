import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText,
  MessageSquare, 
  TrendingUp,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  DollarSign,
  Search,
  Target,
  Briefcase,
  Heart,
  Eye,
  ShoppingCart,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut, getCurrentUser, getCurrentUserProfile } from '../../lib/supabase';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      }
    };
    fetchUser();
  }, []);

  // Navigation selon le rôle
  const getNavigationByRole = (role: UserRole) => {
    switch (role) {
      case 'publisher':
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Mes Sites Web', href: '/dashboard/websites', icon: FolderOpen },
          { name: 'Mes Annonces', href: '/dashboard/link-listings', icon: FileText },
          { name: 'Demandes Reçues', href: '/dashboard/purchase-requests', icon: MessageSquare },
          { name: 'Mes Revenus', href: '/dashboard/transactions', icon: DollarSign },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];
      case 'advertiser':
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Explorer Liens', href: '/liens', icon: Search },
          { name: 'Mes Achats', href: '/dashboard/purchases', icon: ShoppingCart },
          { name: 'Mes Demandes', href: '/dashboard/purchase-requests', icon: FileText },
          { name: 'Favoris', href: '/dashboard/favorites', icon: Heart },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];
      case 'admin':
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Gestion Sites', href: '/dashboard/websites', icon: FolderOpen },
          { name: 'Gestion Annonces', href: '/dashboard/link-listings', icon: FileText },
          { name: 'Demandes', href: '/dashboard/purchase-requests', icon: MessageSquare },
          { name: 'Transactions', href: '/dashboard/transactions', icon: DollarSign },
          { name: 'Utilisateurs', href: '/dashboard/users', icon: Users },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];

      default:
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];
    }
  };

  const navigation = getNavigationByRole(userProfile?.role || 'advertiser');

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const isActive = (path: string, itemName: string) => {
    if (path === '/dashboard') {
      // "Tableau de Bord" est actif si on est sur /dashboard
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 mr-0.5">
                Authority
              </div>
              <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-700">
                .ma
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href, item.name)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive(item.href, item.name) ? 'text-blue-500' : 'text-gray-400'
                }`} />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <div>Bienvenue, {user?.email || 'Utilisateur'}</div>
                {userProfile?.role && (
                  <div className="text-xs text-gray-500">
                    {userProfile.role === 'entrepreneur' && '👨‍💼 Entrepreneur'}
                    {userProfile.role === 'investor' && '💰 Investisseur'}
                  </div>
                )}
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                userProfile?.role === 'entrepreneur' ? 'bg-blue-600' :
                userProfile?.role === 'investor' ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;