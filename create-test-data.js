import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  try {
    console.log('=== Création des données de test ===\n');
    
    // Récupérer l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'publisher@test.com')
      .single();
    
    if (publisherError || !publisher) {
      console.error('❌ Éditeur non trouvé:', publisherError);
      return;
    }
    
    console.log('✅ Éditeur trouvé:', publisher.email);
    
    // Créer un site web pour l'éditeur
    const websiteData = {
      user_id: publisher.id,
      title: 'Mon Blog Tech',
      description: 'Un blog spécialisé dans les technologies web et le développement',
      url: 'https://monblogtech.com',
      category: 'tech',
      niche: 'tech',
      owner_status: 'professionnel',
      metrics: {
        monthly_visitors: 50000,
        domain_authority: 45,
        page_rank: 3
      },
      contact_info: {
        email: publisher.email,
        phone: publisher.phone
      },
      slug: 'mon-blog-tech',
      status: 'active',
      available_link_spots: 10,
      content_quality: 'good'
    };
    
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert([websiteData])
      .select()
      .single();
    
    if (websiteError) {
      console.error('❌ Erreur lors de la création du site web:', websiteError);
      return;
    }
    
    console.log('✅ Site web créé:', website.title);
    
    // Créer un lien pour le site web
    const linkData = {
      website_id: website.id,
      user_id: publisher.id,
      title: 'Lien dans l\'article sur React',
      description: 'Lien dofollow dans un article de 2000 mots sur React et ses bonnes pratiques',
      target_url: 'https://monblogtech.com/article-react',
      anchor_text: 'React Framework',
      link_type: 'dofollow',
      position: 'content',
      price: 500.00,
      currency: 'MAD',
      minimum_contract_duration: 6,
      max_links_per_page: 1,
      allowed_niches: ['tech', 'business'],
      forbidden_keywords: ['casino', 'gambling'],
      content_requirements: 'Article de qualité sur le développement web',
      status: 'active',
      meta_title: 'Lien dofollow dans article React - 500 MAD',
      meta_description: 'Lien dofollow de qualité dans un article détaillé sur React',
      slug: 'lien-react-article',
      tags: ['react', 'javascript', 'web-development']
    };
    
    const { data: link, error: linkError } = await supabase
      .from('link_listings')
      .insert([linkData])
      .select()
      .single();
    
    if (linkError) {
      console.error('❌ Erreur lors de la création du lien:', linkError);
      return;
    }
    
    console.log('✅ Lien créé:', link.title, '- Prix:', link.price, 'MAD');
    
    // Vérifier les données créées
    console.log('\n=== Vérification des données créées ===\n');
    
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', publisher.id);
    
    if (websitesError) {
      console.error('❌ Erreur lors de la vérification des sites:', websitesError);
    } else {
      console.log('Sites web de l\'éditeur:', websites.length);
      websites.forEach(site => {
        console.log(`- ${site.title} (${site.url})`);
      });
    }
    
    const { data: links, error: linksError } = await supabase
      .from('link_listings')
      .select('*')
      .eq('user_id', publisher.id);
    
    if (linksError) {
      console.error('❌ Erreur lors de la vérification des liens:', linksError);
    } else {
      console.log('Liens de l\'éditeur:', links.length);
      links.forEach(link => {
        console.log(`- ${link.title} (${link.price} MAD)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createTestData();
