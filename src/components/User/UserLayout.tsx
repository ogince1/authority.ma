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
  Settings,
  Wallet,
  Zap,
  Package,
  Mail
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
  const [user, setUser] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [balance, setBalance] = React.useState<number>(0);
  const [cartCount, setCartCount] = React.useState<number>(0);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [unreadMessages, setUnreadMessages] = React.useState<number>(0);
  const [lastLoadTime, setLastLoadTime] = React.useState<number>(0);

  // Fermer le dropdown quand on clique à l'extérieur
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Fonction pour recharger le solde
  const refreshBalance = async () => {
    if (user) {
      try {
        const userBalance = await getUserBalance(user.id);
        setBalance(userBalance);
        console.log('💰 Solde mis à jour:', userBalance);
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  // Fonction pour charger les messages non lus
  const loadUnreadMessages = async () => {
    if (user) {
      const now = Date.now();
      // Éviter les appels trop fréquents (moins de 5 secondes)
      if (now - lastLoadTime < 5000) {
        return;
      }
      
      try {
        setLastLoadTime(now);
        const { supabase } = await import('../../lib/supabase');
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('advertiser_id, publisher_id, unread_count_advertiser, unread_count_publisher')
          .or(`advertiser_id.eq.${user.id},publisher_id.eq.${user.id}`);

        if (error) {
          console.error('Error loading unread messages:', error);
          return;
        }

        let totalUnread = 0;
        conversations?.forEach(conv => {
          if (conv.advertiser_id === user.id) {
            totalUnread += conv.unread_count_advertiser || 0;
          } else if (conv.publisher_id === user.id) {
            totalUnread += conv.unread_count_publisher || 0;
          }
        });

        console.log('📧 Messages non lus chargés:', totalUnread, 'conversations:', conversations?.length);
        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    }
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
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

          // Charger les messages non lus
          loadUnreadMessages();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();

    // Rafraîchir les notifications toutes les 30 secondes
    const notificationInterval = setInterval(() => {
      if (user) {
        loadUnreadMessages();
      }
    }, 30000);

    return () => {
      clearInterval(notificationInterval);
    };
  }, [user]);

  // Écouter les événements de mise à jour du solde
  React.useEffect(() => {
    const handleBalanceUpdate = () => {
      refreshBalance();
    };

    const handlePurchaseCompleted = () => {
      // Recharger toutes les données après un achat
      refreshBalance();
      loadUnreadMessages();
      console.log('🔄 Données rechargées après achat');
    };

    // Écouter les événements personnalisés pour la mise à jour du solde
    window.addEventListener('balance-updated', handleBalanceUpdate);
    window.addEventListener('purchase-completed', handlePurchaseCompleted);
    
    // Recharger le solde toutes les 30 secondes
    const interval = setInterval(refreshBalance, 30000);

    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      window.removeEventListener('purchase-completed', handlePurchaseCompleted);
      clearInterval(interval);
    };
  }, [user]);

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
  const getNavigationByRole = (role: UserRole | undefined) => {
    switch (role) {
      case 'publisher':
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Mes Sites Web', href: '/dashboard/websites', icon: FolderOpen },
          { name: 'Mes Liens Existants', href: '/dashboard/link-listings', icon: FileText },
          { name: 'Demandes Reçues', href: '/dashboard/purchase-requests', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : undefined },
          { name: 'Mon Solde', href: '/dashboard/balance', icon: Wallet },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];
           case 'advertiser':
             return [
               { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
              { name: 'Trouver des Médias', href: '/dashboard/quick-buy', icon: Zap },
              { name: 'Mes Demandes', href: '/dashboard/purchase-requests', icon: FileText, badge: unreadMessages > 0 ? unreadMessages : undefined },
              { name: 'Services', href: '/dashboard/services', icon: Settings },
               { name: 'Mon Solde', href: '/dashboard/balance', icon: Wallet },
               { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
             ];
      default:
        return [
          { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
        ];
    }
  };

  const navigation = getNavigationByRole(userProfile?.role);

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

  // Afficher un indicateur de chargement pendant que les données utilisateur sont chargées
  if (isLoading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo et Menu Mobile */}
            <div className="flex items-center space-x-4">
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
              {/* Logo Back.ma - Même que la homepage */}
              <Link to="/" className="flex items-center group">
                <div className="relative">
                  <img 
                    src="/logo-simple.svg" 
                    alt="Back.ma Logo" 
                    className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            </div>
            
            {/* Actions Utilisateur */}
            <div className="flex items-center space-x-4">
              {/* Solde */}
              <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="text-sm">
                  <div className="text-green-800 font-medium">
                    {balance.toLocaleString()} MAD
                  </div>
                  <div className="text-xs text-green-600">Solde</div>
                </div>
              </div>
              
              {/* Panier - Seulement pour les annonceurs */}
              {userProfile?.role === 'advertiser' && (
              <Link
                to="/panier"
                className="relative text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
                  )}
              </Link>
              )}
              
              {/* Avatar avec Menu */}
              <div className="relative profile-dropdown-container">
                <div 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all duration-300 ${
                    userProfile?.role === 'publisher' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    userProfile?.role === 'advertiser' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 
                    'bg-gradient-to-br from-gray-500 to-gray-600'
                  } hover:shadow-lg`}>
                  <span className="text-white font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                
                {/* Menu déroulant */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      userProfile?.role === 'publisher' ? 'bg-blue-500' :
                      userProfile?.role === 'advertiser' ? 'bg-emerald-500' : 'bg-gray-500'
                    }`}>
                      <span className="text-white font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || 'Utilisateur'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userProfile?.role === 'publisher' ? '📝 Éditeur' :
                         userProfile?.role === 'advertiser' ? '💰 Annonceur' : '👤 Utilisateur'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Solde:</span>
                      <span className="font-bold text-emerald-600">{balance.toLocaleString()} MAD</span>
                    </div>
                    {userProfile?.role === 'advertiser' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Panier:</span>
                        <span className="font-bold text-blue-600">{cartCount} article{cartCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Voir le profil
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="block w-full text-center text-sm text-red-600 hover:text-red-700 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 inline mr-1" />
                      Déconnexion
                    </button>
                  </div>
                </div>
                )}
              </div>
              </div>
            </div>
          </div>
        </header>

      {/* Navigation Horizontale sous le Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            
            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item, index) => {
                const isActiveItem = isActive(item.href, item.name);
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      className={`group flex items-center rounded-lg transition-all duration-300 px-4 py-2 ${
                        isActiveItem
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 mr-2 ${
                        isActiveItem 
                          ? 'text-white' 
                          : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      <span className="font-medium text-sm">{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Mobile */}
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden w-full"
              >
                <div className="py-2 space-y-1">
                  {navigation.map((item) => {
                    const isActiveItem = isActive(item.href, item.name);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                          isActiveItem
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
    </div>
  );
};

export default UserLayout;