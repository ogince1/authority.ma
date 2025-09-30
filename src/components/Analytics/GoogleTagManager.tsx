import React, { useEffect } from 'react';

/**
 * Google Tag Manager Component
 * Intègre GTM avec l'ID GTM-PR8F82D3 sur toutes les pages
 */
const GoogleTagManager: React.FC = () => {
  useEffect(() => {
    // Vérifier si GTM est déjà chargé
    if (typeof window === 'undefined' || window.dataLayer) {
      return;
    }

    // Initialiser le dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Script GTM
    const gtmScript = document.createElement('script');
    gtmScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-PR8F82D3');
    `;
    
    // Ajouter le script au head
    document.head.appendChild(gtmScript);
    
    // Nettoyer le script lors du démontage
    return () => {
      if (document.head.contains(gtmScript)) {
        document.head.removeChild(gtmScript);
      }
    };
  }, []);

  // Ce composant ne rend rien visuellement
  // GTM s'initialise automatiquement
  return null;
};

export default GoogleTagManager;
