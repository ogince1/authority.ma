import { getProjects, getBlogPosts, getSuccessStories, getAllFundraisingOpportunities } from '../lib/supabase';
import { getAllDigitalCategories, getAllRealCategories } from './categories';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://gohaya.ma';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urls: SitemapUrl[] = [];

  // Pages statiques principales
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' as const },
    { url: '/projets-digitaux', priority: '0.9', changefreq: 'daily' as const },
    { url: '/projets-reels', priority: '0.9', changefreq: 'daily' as const },
    { url: '/mvp', priority: '0.8', changefreq: 'daily' as const },
    { url: '/startups', priority: '0.8', changefreq: 'daily' as const },
    { url: '/websites', priority: '0.8', changefreq: 'daily' as const },
    { url: '/investir', priority: '0.8', changefreq: 'weekly' as const },
    { url: '/lever-des-fonds', priority: '0.7', changefreq: 'monthly' as const },
    { url: '/vendre', priority: '0.7', changefreq: 'monthly' as const },
    { url: '/blog', priority: '0.8', changefreq: 'daily' as const },
    { url: '/success-stories', priority: '0.8', changefreq: 'weekly' as const },
    { url: '/login', priority: '0.6', changefreq: 'monthly' as const },
    { url: '/register', priority: '0.6', changefreq: 'monthly' as const },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.url}`,
      lastmod: currentDate,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Pages de catégories digitales
  const digitalCategories = getAllDigitalCategories();
  digitalCategories.forEach(category => {
    urls.push({
      loc: `${baseUrl}/projets-digitaux/${category}`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.8'
    });
  });

  // Pages de catégories réelles
  const realCategories = getAllRealCategories();
  realCategories.forEach(category => {
    urls.push({
      loc: `${baseUrl}/projets-reels/${category}`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.8'
    });
  });

  try {
    // Récupérer tous les projets
    const projects = await getProjects();
    projects.forEach(project => {
      urls.push({
        loc: `${baseUrl}/project/${project.slug}`,
        lastmod: project.updated_at.split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

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

    // Récupérer toutes les opportunités de financement
    const fundraisingOpportunities = await getAllFundraisingOpportunities();
    fundraisingOpportunities.forEach(opportunity => {
      urls.push({
        loc: `${baseUrl}/investir/${opportunity.id}`,
        lastmod: opportunity.updated_at.split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

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
    const sitemapContent = await generateSitemap();
    
    // En production, vous pourriez vouloir sauvegarder le sitemap
    // dans un service de stockage ou via une API
    console.log('Sitemap généré avec succès');
    console.log(`Nombre total d'URLs: ${(sitemapContent.match(/<url>/g) || []).length}`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du sitemap:', error);
    throw error;
  }
};