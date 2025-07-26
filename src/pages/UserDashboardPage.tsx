import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/supabase';
import UserLayout from '../components/User/UserLayout';
import UserDashboard from '../components/User/UserDashboard';
import UserProfile from '../components/User/UserProfile';
import ProjectsList from '../components/Admin/ProjectsList';
import ProjectForm from '../components/Admin/ProjectForm';
import ProjectFormWrapper from '../components/Admin/ProjectFormWrapper';
import UserProposalsList from '../components/User/UserProposalsList';

import UserFundraisingList from '../components/User/UserFundraisingList';
import UserFundraisingForm from '../components/User/UserFundraisingForm';
import UserFundraisingDetails from '../components/User/UserFundraisingDetails';
import UserInvestmentInterestsList from '../components/User/UserInvestmentInterestsList';

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
    return <Navigate to="/auth" replace />;
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
          <UserProposalsList />
        </ProtectedRoute>
      } />

      <Route path="/fundraising" element={
        <ProtectedRoute>
          <UserFundraisingList />
        </ProtectedRoute>
      } />
      <Route path="/fundraising/new" element={
        <ProtectedRoute>
          <UserFundraisingForm />
        </ProtectedRoute>
      } />
      <Route path="/fundraising/:id/edit" element={
        <ProtectedRoute>
          <UserFundraisingForm isEdit={true} />
        </ProtectedRoute>
      } />
      <Route path="/fundraising/:id" element={
        <ProtectedRoute>
          <UserFundraisingDetails />
        </ProtectedRoute>
      } />
      <Route path="/investment-interests" element={
        <ProtectedRoute>
          <UserInvestmentInterestsList />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default UserDashboardPage;