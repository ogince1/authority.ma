import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { getFaviconWithFallback } from '../../utils/favicon';

interface FaviconProps {
  url: string;
  size?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

const Favicon: React.FC<FaviconProps> = ({ 
  url, 
  size = 20, 
  className = '', 
  fallbackIcon 
}) => {
  const [currentFaviconIndex, setCurrentFaviconIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fallbackUrls = getFaviconWithFallback(url, size);

  useEffect(() => {
    if (!url || fallbackUrls.length === 0) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setCurrentFaviconIndex(0);

    const tryFavicon = (index: number) => {
      if (index >= fallbackUrls.length) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        setCurrentFaviconIndex(index);
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        // ✅ OPTIMISATION: Gestion silencieuse des erreurs de favicon
        tryFavicon(index + 1);
      };
      img.src = fallbackUrls[index];
    };

    tryFavicon(0);
  }, [url, size]);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`} 
           style={{ width: size, height: size }}>
      </div>
    );
  }

  if (hasError || !fallbackUrls[currentFaviconIndex]) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 rounded ${className}`}
           style={{ width: size, height: size }}>
        {fallbackIcon || <Globe className="text-emerald-600" size={size * 0.6} />}
      </div>
    );
  }

  return (
    <img
      src={fallbackUrls[currentFaviconIndex]}
      alt={`Favicon de ${url}`}
      className={`rounded ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        setHasError(true);
        setIsLoading(false);
      }}
    />
  );
};

export default Favicon;
