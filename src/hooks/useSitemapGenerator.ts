import { useEffect } from 'react';
import { saveSitemap } from '../utils/sitemap';

export const useSitemapGenerator = () => {
  useEffect(() => {
    const generateDailySitemap = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Générer le sitemap tous les jours à 6h00 du matin
      if (hours === 6 && minutes === 0) {
        saveSitemap().catch(console.error);
      }
    };

    // Vérifier toutes les minutes si c'est l'heure de générer le sitemap
    const interval = setInterval(generateDailySitemap, 60000);

    // Générer le sitemap immédiatement au chargement de l'application
    saveSitemap().catch(console.error);

    return () => clearInterval(interval);
  }, []);
};