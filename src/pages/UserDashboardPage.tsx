import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/supabase';
import UserLayout from '../components/User/UserLayout';
import UserDashboard from '../components/User/UserDashboard';
import UserProfile from '../components/User/UserProfile';
import UserWebsitesPage from './UserWebsitesPage';
import UserLinkListingsPage from './UserLinkListingsPage';

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
      
      {/* Routes pour les éditeurs (publishers) */}
      <Route path="/websites" element={
        <ProtectedRoute>
          <UserWebsitesPage />
        </ProtectedRoute>
      } />
      <Route path="/websites/new" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ajouter un Site Web</h1>
            <p className="text-gray-600">Formulaire d'ajout de site web (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/link-listings" element={
        <ProtectedRoute>
          <UserLinkListingsPage />
        </ProtectedRoute>
      } />
      <Route path="/link-listings/new" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Créer une Annonce</h1>
            <p className="text-gray-600">Formulaire de création d'annonce (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Routes pour les annonceurs (advertisers) */}
      <Route path="/purchases" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes Achats</h1>
            <p className="text-gray-600">Historique de vos achats de liens (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/purchase-requests" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes Demandes d'Achat</h1>
            <p className="text-gray-600">Suivi de vos demandes d'achat (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Routes communes */}
      <Route path="/messages" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
            <p className="text-gray-600">Système de messagerie (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
            <p className="text-gray-600">Centre de notifications (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default UserDashboardPage;