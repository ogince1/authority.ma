import React from 'react';
import { generateSitemap } from '../utils/sitemap';

export default function SitemapPage() {
  const [sitemapContent, setSitemapContent] = React.useState('');

  React.useEffect(() => {
    const fetchSitemap = async () => {
      const baseUrl = import.meta.env.VITE_APP_URL || 'https://back.ma';
      const content = await generateSitemap(baseUrl);
      setSitemapContent(content);
    };
    fetchSitemap();
  }, []);

  return (
    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{sitemapContent}</pre>
  );
}