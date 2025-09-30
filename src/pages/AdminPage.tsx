import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser, isAdmin } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminLogin from '../components/Admin/AdminLogin';
import AdminDashboard from '../components/Admin/AdminDashboard';
import UsersManagement from '../components/Admin/UsersManagement';
import TransactionsManagement from '../components/Admin/TransactionsManagement';
import WebsitesManagement from '../components/Admin/WebsitesManagement';
import ServicesManagement from '../components/Admin/ServicesManagement';
import ServiceRequestsManagement from '../components/Admin/ServiceRequestsManagement';
import PurchaseRequestsManagement from '../components/Admin/PurchaseRequestsManagement';
import PlatformSettings from '../components/Admin/PlatformSettings';
import BlogList from '../components/Admin/BlogList';
import BlogForm from '../components/Admin/BlogForm';
import BlogFormWrapper from '../components/Admin/BlogFormWrapper';
import SuccessStoriesList from '../components/Admin/SuccessStoriesList';
import SuccessStoryForm from '../components/Admin/SuccessStoryForm';
import BalanceRequestsManagement from '../components/Admin/BalanceRequestsManagement';

const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const adminStatus = await isAdmin();
          setIsAuthenticated(adminStatus);
        } else {
          setIsAuthenticated(false);
        }
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
  const isAuthenticated = useAdminAuth();

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const AdminPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Gestion des sites web */}
      <Route path="/websites" element={
        <ProtectedRoute>
          <WebsitesManagement />
        </ProtectedRoute>
      } />
      
      {/* Gestion des demandes d'achat */}
      <Route path="/purchase-requests" element={
        <ProtectedRoute>
          <PurchaseRequestsManagement />
        </ProtectedRoute>
      } />
      
      {/* Gestion des services */}
      <Route path="/services" element={
        <ProtectedRoute>
          <ServicesManagement />
        </ProtectedRoute>
      } />
      
      {/* Gestion des demandes de services */}
      <Route path="/service-requests" element={
        <ProtectedRoute>
          <ServiceRequestsManagement />
        </ProtectedRoute>
      } />
      
      {/* Gestion de la confirmation automatique */}
      
      
      {/* Gestion des transactions */}
      <Route path="/transactions" element={
        <ProtectedRoute>
          <TransactionsManagement />
        </ProtectedRoute>
      } />
      
      {/* Gestion des demandes de balance */}
      <Route path="/balance-requests" element={
        <ProtectedRoute>
          <BalanceRequestsManagement />
        </ProtectedRoute>
      } />
      
      {/* Gestion des utilisateurs */}
      <Route path="/users" element={
        <ProtectedRoute>
          <UsersManagement />
        </ProtectedRoute>
      } />
      
      {/* Blog */}
      <Route path="/blog" element={
        <ProtectedRoute>
          <BlogList />
        </ProtectedRoute>
      } />
      <Route path="/blog/new" element={
        <ProtectedRoute>
          <BlogForm />
        </ProtectedRoute>
      } />
      <Route path="/blog/:id/edit" element={
        <ProtectedRoute>
          <BlogFormWrapper isEdit={true} />
        </ProtectedRoute>
      } />
      
      {/* Histoires de succès */}
      <Route path="/success-stories" element={
        <ProtectedRoute>
          <SuccessStoriesList />
        </ProtectedRoute>
      } />
      <Route path="/success-stories/new" element={
        <ProtectedRoute>
          <SuccessStoryForm />
        </ProtectedRoute>
      } />
      <Route path="/success-stories/:id/edit" element={
        <ProtectedRoute>
          <SuccessStoryForm isEdit={true} />
        </ProtectedRoute>
      } />
      
      {/* Statistiques */}
      <Route path="/stats" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Statistiques</h1>
            <p className="text-gray-600">Tableau de bord analytics (à implémenter)</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Paramètres */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <PlatformSettings />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AdminPage;