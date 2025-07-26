import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser, isAdmin } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminLogin from '../components/Admin/AdminLogin';
import AdminDashboard from '../components/Admin/AdminDashboard';
import ProjectsList from '../components/Admin/ProjectsList';
import ProjectForm from '../components/Admin/ProjectForm';
import ProjectFormWrapper from '../components/Admin/ProjectFormWrapper';
import ProposalsList from '../components/Admin/ProposalsList';
import SubmissionsList from '../components/Admin/SubmissionsList';
import FundraisingList from '../components/Admin/FundraisingList';
import InvestmentInterestsList from '../components/Admin/InvestmentInterestsList';
import BlogList from '../components/Admin/BlogList';
import BlogForm from '../components/Admin/BlogForm';
import BlogFormWrapper from '../components/Admin/BlogFormWrapper';
import SuccessStoriesList from '../components/Admin/SuccessStoriesList';
import SuccessStoryForm from '../components/Admin/SuccessStoryForm';
import FundraisingForm from '../components/Admin/FundraisingForm';
import FundraisingFormSimple from '../components/Admin/FundraisingFormSimple';

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
      <Route path="/projects" element={
        <ProtectedRoute>
          <ProjectsList />
        </ProtectedRoute>
      } />
      <Route path="/projects/new" element={
        <ProtectedRoute>
          <ProjectForm />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id/edit" element={
        <ProtectedRoute>
          <ProjectFormWrapper isEdit={true} />
        </ProtectedRoute>
      } />
      <Route path="/proposals" element={
        <ProtectedRoute>
          <ProposalsList />
        </ProtectedRoute>
      } />
      <Route path="/fundraising" element={
        <ProtectedRoute>
          <FundraisingList />
        </ProtectedRoute>
      } />
      <Route path="/fundraising/new" element={
        <ProtectedRoute>
          <FundraisingForm />
        </ProtectedRoute>
      } />
      <Route path="/fundraising/:id/edit" element={
        <ProtectedRoute>
          <FundraisingForm isEdit={true} />
        </ProtectedRoute>
      } />
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

      <Route path="/submissions" element={
        <ProtectedRoute>
          <SubmissionsList />
        </ProtectedRoute>
      } />
      <Route path="/investment-interests" element={
        <ProtectedRoute>
          <InvestmentInterestsList />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AdminPage;