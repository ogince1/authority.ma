import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { trackPageView } from './utils/analytics.ts';

// Initialiser le dataLayer avec les informations de base du site
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
    site_name: 'Back.ma',
    site_version: '1.0.0',
    site_language: 'fr',
    site_region: 'MA',
    site_type: 'link_marketplace',
    environment: process.env.NODE_ENV
  });
  
  // Track initial page view
  trackPageView(window.location.pathname, document.title);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
