import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/supabase';
import UserLayout from '../components/User/UserLayout';
import UserDashboard from '../components/User/UserDashboard';
import UserProfile from '../components/User/UserProfile';
import UserWebsitesPage from './UserWebsitesPage';
import UserLinkListingsPage from './UserLinkListingsPage';
import CampaignDashboard from '../components/User/CampaignDashboard';
import CampaignForm from '../components/User/CampaignForm';
import CampaignDetails from '../components/User/CampaignDetails';
import CampaignEditForm from '../components/User/CampaignEditForm';
import BalanceManager from '../components/User/BalanceManager';
import PurchaseRequests from '../components/User/PurchaseRequests';
import MessagesList from '../components/User/MessagesList';
import ConversationDetail from '../components/User/ConversationDetail';
import DisputesList from '../components/User/DisputesList';
import CreateDisputeForm from '../components/User/CreateDisputeForm';
import DisputeDetail from '../components/User/DisputeDetail';
import DisputeMessages from '../components/User/DisputeMessages';
import PurchaseHistory from '../components/User/PurchaseHistory';

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
      
      {/* Routes pour les campagnes (annonceurs) */}
      <Route path="/campaigns" element={
        <ProtectedRoute>
          <CampaignDashboard />
        </ProtectedRoute>
      } />
      <Route path="/campaigns/new" element={
        <ProtectedRoute>
          <CampaignForm />
        </ProtectedRoute>
      } />
      <Route path="/campaigns/:id" element={
        <ProtectedRoute>
          <CampaignDetails />
        </ProtectedRoute>
      } />
      <Route path="/campaigns/:id/edit" element={
        <ProtectedRoute>
          <CampaignEditForm />
        </ProtectedRoute>
      } />
      
      {/* Route pour la gestion du solde */}
      <Route path="/balance" element={
        <ProtectedRoute>
          <BalanceManager />
        </ProtectedRoute>
      } />
      
      {/* Route pour les demandes d'achat */}
      <Route path="/purchase-requests" element={
        <ProtectedRoute>
          <PurchaseRequests />
        </ProtectedRoute>
      } />
      
      {/* Routes pour le système de messagerie */}
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesList />
        </ProtectedRoute>
      } />
      <Route path="/messages/:conversationId" element={
        <ProtectedRoute>
          <ConversationDetail />
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
      
      {/* Routes pour les disputes */}
      <Route path="/disputes" element={
        <ProtectedRoute>
          <DisputesList />
        </ProtectedRoute>
      } />
      <Route path="/disputes/new" element={
        <ProtectedRoute>
          <CreateDisputeForm />
        </ProtectedRoute>
      } />
      <Route path="/disputes/:id" element={
        <ProtectedRoute>
          <DisputeDetail />
        </ProtectedRoute>
      } />
      <Route path="/disputes/:id/messages" element={
        <ProtectedRoute>
          <DisputeMessages />
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
    </Routes>
  );
};

export default UserDashboardPage;