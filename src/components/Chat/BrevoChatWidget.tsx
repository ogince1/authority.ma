import React, { useEffect } from 'react';

// ✅ Variable globale pour éviter les chargements multiples
declare global {
  interface Window {
    BrevoConversationsID?: string;
    BrevoConversations?: any;
    brevoLoaded?: boolean;
  }
}

/**
 * Widget de chat Brevo Conversations
 * Intégré sur toutes les pages pour le support client
 * ✅ OPTIMISÉ: Ne charge qu'une seule fois, même si le composant monte/démonte
 */
const BrevoChatWidget: React.FC = () => {
  useEffect(() => {
    // ✅ Vérifier si déjà chargé
    if (typeof window === 'undefined') {
      return;
    }

    if (window.brevoLoaded) {
      console.log('✅ Brevo déjà initialisé, skip');
      return;
    }

    // ✅ Vérifier si le script existe déjà
    const existingScript = document.getElementById('brevo-chat-script');
    if (existingScript) {
      console.log('✅ Script Brevo déjà présent, skip');
      window.brevoLoaded = true;
      return;
    }

    console.log('💬 Initialisation de Brevo Chat Widget...');

    // Script Brevo Conversations
    const script = document.createElement('script');
    script.id = 'brevo-chat-script'; // ✅ ID unique
    script.innerHTML = `
      (function(d, w, c) {
        w.BrevoConversationsID = '620fd073fe4f2b15855fdb54';
        w[c] = w[c] || function() {
          (w[c].q = w[c].q || []).push(arguments);
        };
        var s = d.createElement('script');
        s.async = true;
        s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
        if (d.head) d.head.appendChild(s);
      })(document, window, 'BrevoConversations');
    `;
    
    // Ajouter le script au head
    document.head.appendChild(script);
    window.brevoLoaded = true; // ✅ Marquer comme chargé
    
    console.log('✅ Brevo Chat Widget chargé avec succès');
    
    // ✅ Ne PAS supprimer le script au démontage
    // Le widget doit rester actif pour toute la session
    return () => {
      console.log('💬 Brevo component unmounted (widget reste actif)');
    };
  }, []);

  // Ce composant ne rend rien visuellement
  // Le widget Brevo s'affiche automatiquement
  return null;
};

export default BrevoChatWidget;
