import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/supabase';
import UserLayout from '../components/User/UserLayout';
import UserDashboard from '../components/User/UserDashboard';
import UserProfile from '../components/User/UserProfile';
import UserWebsitesPage from './UserWebsitesPage';
import UserLinkListingsPage from './UserLinkListingsPage';
import QuickBuyPage from '../components/User/QuickBuyPage';
import AdvertiserServices from '../components/User/AdvertiserServices';
import ReviewExchangeDashboard from '../components/User/ReviewExchange/ReviewExchangeDashboard';
import BalanceManager from '../components/User/BalanceManager';
import PurchaseRequests from '../components/User/PurchaseRequests';
import PurchaseHistory from '../components/User/PurchaseHistory';
import EmailPreferences from '../components/User/EmailPreferences';

const useUserAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return isAuthenticated;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useUserAuth();

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <UserLayout>{children}</UserLayout>;
};

const UserDashboardPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      
      {/* Route pour l'achat rapide (annonceurs) */}
      <Route path="/quick-buy" element={
        <ProtectedRoute>
          <QuickBuyPage />
        </ProtectedRoute>
      } />
      
      {/* Route pour les services (annonceurs) */}
      <Route path="/services" element={
        <ProtectedRoute>
          <AdvertiserServices />
        </ProtectedRoute>
      } />
      
      
      {/* Route pour la gestion du solde (inclut demandes de paiement en onglet) */}
      <Route path="/balance" element={
        <ProtectedRoute>
          <BalanceManager />
        </ProtectedRoute>
      } />
      
      {/* Route pour l'échange d'avis */}
      <Route path="/review-exchange" element={
        <ProtectedRoute>
          <ReviewExchangeDashboard />
        </ProtectedRoute>
      } />
      
      {/* Route pour les demandes d'achat */}
      <Route path="/purchase-requests" element={
        <ProtectedRoute>
          <PurchaseRequests />
        </ProtectedRoute>
      } />
      
      
      {/* Routes pour les sites web (éditeurs) */}
      <Route path="/websites" element={
        <ProtectedRoute>
          <UserWebsitesPage />
        </ProtectedRoute>
      } />
      <Route path="/websites/new" element={
        <ProtectedRoute>
          <UserWebsitesPage />
        </ProtectedRoute>
      } />
      <Route path="/websites/:id" element={
        <ProtectedRoute>
          <UserWebsitesPage />
        </ProtectedRoute>
      } />
      
      {/* Routes pour les annonces de liens (éditeurs) */}
      <Route path="/link-listings" element={
        <ProtectedRoute>
          <UserLinkListingsPage />
        </ProtectedRoute>
      } />
      <Route path="/link-listings/new" element={
        <ProtectedRoute>
          <UserLinkListingsPage />
        </ProtectedRoute>
      } />
      <Route path="/link-listings/:id" element={
        <ProtectedRoute>
          <UserLinkListingsPage />
        </ProtectedRoute>
      } />
      
      
      {/* Routes pour les annonceurs (advertisers) */}
      <Route path="/purchases" element={
        <ProtectedRoute>
          <PurchaseHistory />
        </ProtectedRoute>
      } />
      
      {/* Routes communes */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
            <p className="text-gray-600">Centre de notifications (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Route pour les préférences email */}
      <Route path="/email-preferences" element={
        <ProtectedRoute>
          <EmailPreferences />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default UserDashboardPage;