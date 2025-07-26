import React from 'react';
import { generateSitemap } from '../utils/sitemap';

const SitemapPage: React.FC = () => {
  const [sitemap, setSitemap] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const sitemapContent = await generateSitemap();
        setSitemap(sitemapContent);
      } catch (error) {
        console.error('Erreur lors de la génération du sitemap:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  React.useEffect(() => {
    // Définir le type de contenu comme XML
    document.contentType = 'application/xml';
  }, []);

  if (loading) {
    return <div>Génération du sitemap...</div>;
  }

  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
      {sitemap}
    </pre>
  );
};

export default SitemapPage;