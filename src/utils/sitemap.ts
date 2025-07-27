import { getBlogPosts, getSuccessStories } from '../lib/supabase';
import { getAllDigitalCategories, getAllRealCategories } from './categories';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export const generateSitemap = async (baseUrl: string): Promise<string> => {
  const urls: SitemapUrl[] = [];

  try {
    // Récupérer tous les articles de blog
    const blogPosts = await getBlogPosts({ status: 'published' });
    blogPosts.forEach(post => {
      urls.push({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updated_at.split('T')[0],
        changefreq: 'monthly',
        priority: '0.7'
      });
    });

    // Récupérer toutes les success stories
    const successStories = await getSuccessStories({ status: 'published' });
    successStories.forEach(story => {
      urls.push({
        loc: `${baseUrl}/success-stories/${story.slug}`,
        lastmod: story.updated_at.split('T')[0],
        changefreq: 'monthly',
        priority: '0.7'
      });
    });

    // Ici, tu peux ajouter la génération des URLs pour les liens et sites web si besoin

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
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://authority.ma';
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