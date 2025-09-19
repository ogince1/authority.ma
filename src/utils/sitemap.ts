import { getWebsites, getLinkListings } from '../lib/supabase';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export const generateSitemap = async (baseUrl: string): Promise<string> => {
  const urls: SitemapUrl[] = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    // URLs statiques principales
    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' as const },
      { loc: '/liens', priority: '0.9', changefreq: 'daily' as const },
      { loc: '/vendre-liens', priority: '0.9', changefreq: 'daily' as const },
      { loc: '/liens/dofollow', priority: '0.8', changefreq: 'daily' as const },
      { loc: '/liens/nofollow', priority: '0.8', changefreq: 'daily' as const },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly' as const },
      { loc: '/success-stories', priority: '0.8', changefreq: 'weekly' as const },
      { loc: '/contact', priority: '0.7', changefreq: 'monthly' as const },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' as const }
    ];

    staticUrls.forEach(url => {
      urls.push({
        loc: `${baseUrl}${url.loc}`,
        lastmod: today,
        changefreq: url.changefreq,
        priority: url.priority
      });
    });

    // Récupérer les sites web (si la table existe)
    try {
      const websites = await getWebsites();
      websites.forEach(website => {
        urls.push({
          loc: `${baseUrl}/site/${website.slug}`,
          lastmod: website.updated_at ? website.updated_at.split('T')[0] : today,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
    } catch (error) {
      console.log('Table websites non disponible:', error);
    }

    // Récupérer les liens (si la table existe)
    try {
      const links = await getLinkListings();
      links.forEach(link => {
        urls.push({
          loc: `${baseUrl}/lien/${link.slug}`,
          lastmod: link.updated_at ? link.updated_at.split('T')[0] : today,
          changefreq: 'weekly',
          priority: '0.6'
        });
      });
    } catch (error) {
      console.log('Table link_listings non disponible:', error);
    }

  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error);
  }

  // Générer le XML
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlsXml = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `${xmlHeader}
${urlsetOpen}${urlsXml}
${urlsetClose}`;
};

export const saveSitemap = async (): Promise<void> => {
  try {
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://back.ma';
    const sitemapContent = await generateSitemap(baseUrl);
    // En production, vous pourriez vouloir sauvegarder le sitemap
    // dans un service de stockage ou via une API
    console.log('Sitemap généré avec succès');
    console.log(`Nombre total d''URLs: ${(sitemapContent.match(/<url>/g) || []).length}`);
    return Promise.resolve();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du sitemap:', error);
    throw error;
  }
};