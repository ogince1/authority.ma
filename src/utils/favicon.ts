import React from 'react';

// Fonction pour récupérer l'URL du favicon d'un site web
export const getFaviconUrl = (url: string, size: number = 32): string => {
  if (!url) return '';
  
  try {
    // Nettoyer l'URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const domain = new URL(cleanUrl).hostname;
    
    // Utiliser Google Favicon Service (plus fiable)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch (error) {
    console.warn('Erreur lors de la génération de l\'URL du favicon:', error);
    return '';
  }
};

// Fonction pour récupérer plusieurs services de favicon en fallback
export const getFaviconWithFallback = (url: string, size: number = 32): string[] => {
  if (!url) return [];
  
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const domain = new URL(cleanUrl).hostname;
    
    // ✅ OPTIMISATION: Services de favicon plus fiables et moins d'erreurs 404
    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
      `https://favicons.githubusercontent.com/${domain}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`
      // Supprimé le dernier fallback qui génère souvent des 404
    ];
  } catch (error) {
    console.warn('Erreur lors de la génération des URLs de favicon:', error);
    return [];
  }
};

// Hook personnalisé pour gérer le chargement des favicons avec fallback
export const useFavicon = (url: string, size: number = 32) => {
  const [faviconUrl, setFaviconUrl] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!url) {
      setFaviconUrl('');
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const fallbackUrls = getFaviconWithFallback(url, size);
    let currentIndex = 0;

    const tryNextFavicon = () => {
      if (currentIndex >= fallbackUrls.length) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        setFaviconUrl(fallbackUrls[currentIndex]);
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        currentIndex++;
        tryNextFavicon();
      };
      img.src = fallbackUrls[currentIndex];
    };

    setIsLoading(true);
    setHasError(false);
    tryNextFavicon();
  }, [url, size]);

  return { faviconUrl, isLoading, hasError };
};
