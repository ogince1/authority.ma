import React, { useEffect } from 'react';

/**
 * Widget de chat Brevo Conversations
 * Intégré sur toutes les pages pour le support client
 */
const BrevoChatWidget: React.FC = () => {
  useEffect(() => {
    // Script Brevo Conversations
    const script = document.createElement('script');
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
    
    // Nettoyer le script lors du démontage
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Ce composant ne rend rien visuellement
  // Le widget Brevo s'affiche automatiquement
  return null;
};

export default BrevoChatWidget;
