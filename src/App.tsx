import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SellStartupPage from './pages/SellStartupPage';
import AdminPage from './pages/AdminPage';
import FundraisingPage from './pages/FundraisingPage';
import FundraisingDetailPage from './pages/FundraisingDetailPage';
import FundraisingSubmissionPage from './pages/FundraisingSubmissionPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import SuccessStoryDetailPage from './pages/SuccessStoryDetailPage';
import SitemapPage from './pages/SitemapPage';
import UserDashboardPage from './pages/UserDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DigitalProjectsPage from './pages/DigitalProjectsPage';
import RealProjectsPage from './pages/RealProjectsPage';
import ProjectCategoryPage from './pages/ProjectCategoryPage';
import SitemapGenerator from './components/SEO/SitemapGenerator';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SitemapGenerator />
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Routes pour les projets digitaux */}
            <Route path="/projets-digitaux" element={<DigitalProjectsPage />} />
            <Route path="/projets-digitaux/:category" element={<ProjectCategoryPage />} />
            
            {/* Routes pour les projets réels */}
            <Route path="/projets-reels" element={<RealProjectsPage />} />
            <Route path="/projets-reels/:category" element={<ProjectCategoryPage />} />
            
            {/* Routes héritées (rétrocompatibilité) */}
            <Route path="/mvp" element={<CategoryPage />} />
            <Route path="/startups" element={<CategoryPage />} />
            <Route path="/websites" element={<CategoryPage />} />
            
            {/* Autres routes */}
            <Route path="/investir" element={<FundraisingPage />} />
            <Route path="/investir/:id" element={<FundraisingDetailPage />} />
            <Route path="/lever-des-fonds" element={<FundraisingSubmissionPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route path="/success-stories/:slug" element={<SuccessStoryDetailPage />} />
            <Route path="/project/:slug" element={<ProjectDetailPage />} />
            <Route path="/vendre" element={<SellStartupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sitemap.xml" element={<SitemapPage />} />
            <Route path="/dashboard/*" element={<UserDashboardPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;