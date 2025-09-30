import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LinksPage from './pages/LinksPage';
import LinkDetailPage from './pages/LinkDetailPage';
import WebsiteDetailPage from './pages/WebsiteDetailPage';
import SellLinksPage from './pages/SellLinksPage';
import AdminPage from './pages/AdminPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import SuccessStoryDetailPage from './pages/SuccessStoryDetailPage';
import SitemapPage from './pages/SitemapPage';
import UserDashboardPage from './pages/UserDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SitemapGenerator from './components/SEO/SitemapGenerator';
import CartPage from './components/Cart/CartPage';
import PaymentPage from './components/Payment/PaymentPage';
import ErrorBoundary from './components/ErrorBoundary';
import BrevoChatWidget from './components/Chat/BrevoChatWidget';
import GoogleTagManager from './components/Analytics/GoogleTagManager';
import { startCronJobs } from './utils/cronJobs';

function App() {
  // Démarrer les tâches cron au démarrage de l'application
  React.useEffect(() => {
    const intervalId = startCronJobs();
    
    // Nettoyer l'intervalle lors du démontage
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="min-h-screen bg-gray-50">
            <SitemapGenerator />
            <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Routes pour les liens */}
            <Route path="/liens" element={<LinksPage />} />
            <Route path="/liens/dofollow" element={<LinksPage />} />
            <Route path="/liens/nofollow" element={<LinksPage />} />
            <Route path="/liens/sponsored" element={<LinksPage />} />
            <Route path="/liens/ugc" element={<LinksPage />} />
            
            {/* Routes pour les sites web */}
            <Route path="/site/:slug" element={<WebsiteDetailPage />} />
            
            {/* Routes pour vendre des liens */}
            <Route path="/vendre-liens" element={<SellLinksPage />} />
            
            {/* Routes pour les liens individuels */}
            <Route path="/lien/:slug" element={<LinkDetailPage />} />
            
            {/* Routes pour le blog */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            
            {/* Routes pour les histoires de succès */}
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route path="/success-stories/:slug" element={<SuccessStoryDetailPage />} />
            
            {/* Routes d'authentification */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            
            {/* Routes pour le panier et paiement */}
            <Route path="/panier" element={<CartPage />} />
            <Route path="/paiement" element={<PaymentPage />} />
            
            {/* Routes pour le dashboard utilisateur */}
            <Route path="/dashboard/*" element={<UserDashboardPage />} />
            <Route path="/profile" element={<UserDashboardPage />} />
            
            
            {/* Routes d'administration */}
            <Route path="/admin/*" element={<AdminPage />} />
            
            {/* Routes utilitaires */}
            <Route path="/sitemap.xml" element={<SitemapPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* Routes de rétrocompatibilité (redirection vers la page d'accueil) */}
            <Route path="/mvp" element={<HomePage />} />
            <Route path="/startups" element={<HomePage />} />
            <Route path="/websites" element={<HomePage />} />
            <Route path="/projets-digitaux" element={<HomePage />} />
            <Route path="/projets-reels" element={<HomePage />} />
            <Route path="/investir" element={<HomePage />} />
            <Route path="/lever-des-fonds" element={<HomePage />} />
            <Route path="/vendre" element={<HomePage />} />
            <Route path="/project/:slug" element={<HomePage />} />
          </Routes>
            <Toaster position="top-right" />
            <GoogleTagManager />
            <BrevoChatWidget />
          </div>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;