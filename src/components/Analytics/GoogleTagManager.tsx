import React, { useEffect } from 'react';

// ✅ Variable globale pour éviter les chargements multiples
declare global {
  interface Window {
    dataLayer: any[];
    gtmLoaded?: boolean;
  }
}

/**
 * Google Tag Manager Component
 * Intègre GTM avec l'ID GTM-PR8F82D3 sur toutes les pages
 * ✅ OPTIMISÉ: Ne charge qu'une seule fois, même si le composant monte/démonte
 */
const GoogleTagManager: React.FC = () => {
  useEffect(() => {
    // ✅ Vérifier si GTM est déjà chargé (vérification améliorée)
    if (typeof window === 'undefined') {
      return;
    }

    if (window.gtmLoaded) {
      console.log('✅ GTM déjà initialisé, skip');
      return;
    }

    // ✅ Vérifier si le script existe déjà dans le DOM
    const existingScript = document.getElementById('gtm-script');
    if (existingScript) {
      console.log('✅ Script GTM déjà présent, skip');
      window.gtmLoaded = true;
      return;
    }

    console.log('📊 Initialisation de Google Tag Manager...');

    // Initialiser le dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Script GTM
    const gtmScript = document.createElement('script');
    gtmScript.id = 'gtm-script'; // ✅ ID unique pour éviter duplications
    gtmScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-PR8F82D3');
    `;
    
    // Ajouter le script au head
    document.head.appendChild(gtmScript);
    window.gtmLoaded = true; // ✅ Marquer comme chargé
    
    console.log('✅ Google Tag Manager chargé avec succès');
    
    // ✅ Ne PAS supprimer le script au démontage
    // GTM doit rester chargé pour toute la session
    return () => {
      console.log('📊 GTM component unmounted (script reste actif)');
    };
  }, []);

  // Ce composant ne rend rien visuellement
  // GTM s'initialise automatiquement
  return null;
};

export default GoogleTagManager;
