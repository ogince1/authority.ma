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
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut, getCurrentUser, getCurrentUserProfile, getUserBalance } from '../../lib/supabase';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [balance, setBalance] = React.useState<number>(0);
  const [cartCount, setCartCount] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
        
        // Charger le solde de l'utilisateur
        try {
          const userBalance = await getUserBalance(currentUser.id);
          setBalance(userBalance);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };
    fetchUser();
  }, []);

  // Fonction pour mettre à jour le compteur du panier
  const updateCartCount = () => {
    try {
      const cart = localStorage.getItem('cart');
      const cartItems = cart ? JSON.parse(cart) : [];
      setCartCount(cartItems.length);
    } catch (error) {
      console.error('Error updating cart count:', error);
      setCartCount(0);
    }
  };

  // Écouter les changements du panier
  React.useEffect(() => {
    updateCartCount();
    
    const handleStorageChange = () => {
      updateCartCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleStorageChange);
    };
  }, []);

  // Navigation selon le rôle
  const getNavigationByRole = (role: UserRole) => {
    switch (role) {
      case 'publisher':
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Mes Sites Web', href: '/dashboard/websites', icon: FolderOpen },
          { name: 'Mes Liens Existants', href: '/dashboard/link-listings', icon: FileText },
          { name: 'Demandes Reçues', href: '/dashboard/purchase-requests', icon: MessageSquare },
          { name: 'Mes Messages', href: '/dashboard/messages', icon: MessageSquare },
          { name: 'Mes Revenus', href: '/dashboard/transactions', icon: DollarSign },
          { name: 'Mon Solde', href: '/dashboard/balance', icon: Wallet },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];
      case 'advertiser':
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Mes Campagnes', href: '/dashboard/campaigns', icon: Target },
          { name: 'Mes Achats', href: '/dashboard/purchases', icon: ShoppingCart },
          { name: 'Mes Demandes', href: '/dashboard/purchase-requests', icon: FileText },
          { name: 'Mon Solde', href: '/dashboard/balance', icon: Wallet },
          { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
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
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className={`flex items-center justify-between h-16 border-b border-gray-200 ${
          sidebarCollapsed ? 'px-3' : 'px-6'
        }`}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 mr-0.5">
                  Back
                </div>
                <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-700">
                  .ma
                </div>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/" className="flex items-center justify-center w-full">
              <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                B
              </div>
            </Link>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-1 rounded-md hover:bg-gray-100"
              title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center text-sm font-medium rounded-md transition-colors ${
                  sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'
                } ${
                  isActive(item.href, item.name)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={`h-5 w-5 ${
                  sidebarCollapsed ? '' : 'mr-3'
                } ${
                  isActive(item.href, item.name) ? 'text-blue-500' : 'text-gray-400'
                }`} />
                {!sidebarCollapsed && item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-200 ${
          sidebarCollapsed ? 'p-2' : 'p-4'
        }`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors ${
              sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'
            }`}
            title={sidebarCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && 'Déconnexion'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Message de bienvenue à gauche */}
            <div className="text-sm text-gray-600">
              <div>Bienvenue, {user?.email || 'Utilisateur'}</div>
              {userProfile?.role && (
                <div className="text-xs text-gray-500">
                  {userProfile?.role === 'publisher' && '📝 Éditeur'}
                  {userProfile?.role === 'advertiser' && '💰 Annonceur'}
                  {userProfile?.role === 'admin' && '👑 Administrateur'}
                </div>
              )}
            </div>
            
            {/* Solde, Panier et Avatar à droite */}
            <div className="flex items-center space-x-4">
              {/* Solde du client */}
              <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="text-sm">
                  <div className="text-green-800 font-medium">
                    {balance.toLocaleString()} MAD
                  </div>
                  <div className="text-xs text-green-600">Solde</div>
                </div>
              </div>
              
              {/* Panier */}
              <Link
                to="/panier"
                className="relative text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {/* Badge du panier */}
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                userProfile?.role === 'publisher' ? 'bg-blue-600' :
                userProfile?.role === 'advertiser' ? 'bg-green-600' : 'bg-gray-600'
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