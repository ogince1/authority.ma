import React, { useEffect } from 'react';
import { saveSitemap } from '../../utils/sitemap';

const SitemapGenerator: React.FC = () => {
  useEffect(() => {
    // Vérifier que nous sommes dans un environnement client
    if (typeof window === 'undefined') {
      return;
    }

    const generateDailySitemap = () => {
      try {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // Générer le sitemap tous les jours à 6h00 du matin
        if (hours === 6 && minutes === 0) {
          saveSitemap().catch(console.error);
        }
      } catch (error) {
        console.error('Error in generateDailySitemap:', error);
      }
    };

    // Vérifier toutes les minutes si c'est l'heure de générer le sitemap
    const interval = setInterval(generateDailySitemap, 60000);

    // Générer le sitemap immédiatement au chargement de l'application
    // (seulement en production pour éviter les erreurs en développement)
    if (process.env.NODE_ENV === 'production') {
      try {
        saveSitemap().catch(console.error);
      } catch (error) {
        console.error('Error in initial sitemap generation:', error);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return null; // Ce composant ne rend rien, il gère juste la génération du sitemap
};

export default SitemapGenerator;