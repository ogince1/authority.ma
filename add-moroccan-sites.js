import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Données des sites web marocains
const moroccanSites = [
  // Actualités & Médias marocains
  {
    title: 'Hespress.com',
    url: 'https://www.hespress.com',
    category: 'actualites',
    new_article_price: 25000,
    description: 'Leader de l\'actualité marocaine en ligne'
  },
  {
    title: 'Akhbarona.com',
    url: 'https://www.akhbarona.com',
    category: 'actualites',
    new_article_price: 18000,
    description: 'Site d\'actualités marocaines',
  },
  {
    title: 'Goud.ma',
    url: 'https://www.goud.ma',
    category: 'actualites',
    new_article_price: 25000,
    description: 'Actualités et informations marocaines',
  },
  {
    title: 'Le360.ma',
    url: 'https://www.le360.ma',
    category: 'actualites',
    new_article_price: 18000,
    description: 'Média d\'information marocain',
  },
  {
    title: 'Bladi.net',
    url: 'https://www.bladi.net',
    category: 'actualites',
    description: 'Communauté marocaine et actualités',
  },
  {
    title: 'HibaPress.com',
    url: 'https://www.hibapress.com',
    category: 'actualites',
    description: 'Agence de presse marocaine',
  },
  {
    title: 'Alayam24.com',
    url: 'https://www.alayam24.com',
    category: 'actualites',
    description: 'Actualités 24h/24',
  },
  {
    title: 'Medias24.com',
    url: 'https://www.medias24.com',
    category: 'actualites',
    description: 'Média économique marocain',
  },
  {
    title: 'LeSiteInfo.com',
    url: 'https://www.lesiteinfo.com',
    category: 'actualites',
    description: 'Site d\'information marocain',
  },
  {
    title: 'Aujourd\'hui.ma',
    url: 'https://www.aujourdhui.ma',
    category: 'actualites',
    price: 11000,
    description: 'Actualités du jour',
  },
  {
    title: 'TelQuel.ma',
    url: 'https://www.telquel.ma',
    category: 'actualites',
    price: 19000,
    description: 'Magazine d\'actualités marocain',
  },
  {
    title: 'LeDesk.ma',
    url: 'https://www.ledesk.ma',
    category: 'actualites',
    price: 13000,
    description: 'Actualités et analyses',
  },

  // E-commerce & Annonces
  {
    title: 'Jumia.ma',
    url: 'https://www.jumia.ma',
    category: 'ecommerce',
    price: 40000,
    description: 'E-commerce généraliste leader au Maroc',
  },
  {
    title: 'Avito.ma',
    url: 'https://www.avito.ma',
    category: 'ecommerce',
    price: 35000,
    description: 'Petites annonces, autos, immobilier',
  },
  {
    title: 'MarocAnnonces.com',
    url: 'https://www.marocannonces.com',
    category: 'ecommerce',
    new_article_price: 15000,
    description: 'Site de petites annonces marocain',
  },
  {
    title: 'Souq.ma',
    url: 'https://www.souq.ma',
    category: 'ecommerce',
    new_article_price: 22000,
    description: 'Marketplace marocaine',
  },
  {
    title: 'Bikhir.ma',
    url: 'https://www.bikhir.ma',
    category: 'ecommerce',
    description: 'Petites annonces marocaines',
  },

  // Immobilier
  {
    title: 'Mubawab.ma',
    url: 'https://www.mubawab.ma',
    category: 'immobilier',
    price: 28000,
    description: 'Leader de l\'immobilier au Maroc',
  },
  {
    title: 'Sarouty.ma',
    url: 'https://www.sarouty.ma',
    category: 'immobilier',
    new_article_price: 20000,
    description: 'Plateforme immobilière marocaine',
  },
  {
    title: 'LogicImmo.ma',
    url: 'https://www.logicimmo.ma',
    category: 'immobilier',
    description: 'Annonces immobilières',
  },

  // Automobile
  {
    title: 'Moteur.ma',
    url: 'https://www.moteur.ma',
    category: 'automobile',
    price: 26000,
    description: 'Achat/vente de véhicules au Maroc',
  },
  {
    title: 'Autocaz.ma',
    url: 'https://www.autocaz.ma',
    category: 'automobile',
    new_article_price: 12000,
    description: 'Véhicules d\'occasion',
  }
];

// Articles existants pour chaque site
const articlesBySite = {
  'hespress.com': [
    { title: 'Actualités politiques marocaines', description: 'Suivi de l\'actualité politique au Maroc', target_url: 'https://www.hespress.com/politique', price: 8000 },
    { title: 'Économie marocaine', description: 'Actualités économiques et financières', target_url: 'https://www.hespress.com/economie', price: 7000 },
    { title: 'Sport marocain', description: 'Actualités sportives nationales', target_url: 'https://www.hespress.com/sport', price: 6000 }
  ],
  'jumia.ma': [
    { title: 'Électronique et High-Tech', description: 'Produits électroniques et technologie', target_url: 'https://www.jumia.ma/electronique', price: 12000 },
    { title: 'Mode et Beauté', description: 'Vêtements et produits de beauté', target_url: 'https://www.jumia.ma/mode', price: 10000 },
    { title: 'Maison et Jardin', description: 'Articles pour la maison et le jardin', target_url: 'https://www.jumia.ma/maison', price: 9000 }
  ],
  'avito.ma': [
    { title: 'Voitures d\'occasion', description: 'Achat et vente de véhicules', target_url: 'https://www.avito.ma/voitures', price: 15000 },
    { title: 'Immobilier', description: 'Ventes et locations immobilières', target_url: 'https://www.avito.ma/immobilier', price: 18000 },
    { title: 'Emploi', description: 'Offres d\'emploi au Maroc', target_url: 'https://www.avito.ma/emploi', price: 8000 }
  ],
  'mubawab.ma': [
    { title: 'Appartements à vendre', description: 'Vente d\'appartements au Maroc', target_url: 'https://www.mubawab.ma/vente-appartements', price: 20000 },
    { title: 'Villas et maisons', description: 'Vente de villas et maisons', target_url: 'https://www.mubawab.ma/vente-villas', price: 25000 },
    { title: 'Locations', description: 'Appartements et maisons à louer', target_url: 'https://www.mubawab.ma/locations', price: 15000 }
  ],
  'moteur.ma': [
    { title: 'Voitures neuves', description: 'Véhicules neufs au Maroc', target_url: 'https://www.moteur.ma/voitures-neuves', price: 18000 },
    { title: 'Voitures d\'occasion', description: 'Véhicules d\'occasion', target_url: 'https://www.moteur.ma/voitures-occasion', price: 12000 },
    { title: 'Pièces auto', description: 'Pièces détachées automobiles', target_url: 'https://www.moteur.ma/pièces-auto', price: 8000 }
  ]
};

async function addMoroccanSites() {
  console.log('🇲🇦 Ajout des sites web marocains...\n');

  try {
    // 1. Récupérer un utilisateur éditeur existant ou créer un ID fictif
    console.log('1. Recherche d\'un utilisateur éditeur...');
    const { data: existingPublisher } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'publisher')
      .limit(1)
      .single();

    const publisherId = existingPublisher?.id || uuidv4();
    console.log(`✅ Utilisation de l'éditeur: ${publisherId}`);

    // 2. Ajouter les sites web
    console.log('\n2. Ajout des sites web...');
    const insertedSites = [];

    for (const site of moroccanSites) {
      const { data: insertedSite, error: siteError } = await supabase
        .from('websites')
        .insert([{
          id: uuidv4(),
          ...site,
          user_id: publisherId,
          status: 'active',
          is_new_article: true,
          available_link_spots: 5,
          average_response_time: 24,
          content_quality: 'good',
          languages: ['Français'],
          owner_status: 'professionnel',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (siteError && !siteError.message.includes('duplicate key')) {
        console.error(`❌ Erreur site ${site.title}:`, siteError);
      } else {
        insertedSites.push(insertedSite);
        console.log(`✅ Site ajouté: ${site.title} (${site.new_article_price} MAD)`);
      }
    }

    // 3. Ajouter les articles existants
    console.log('\n3. Ajout des articles existants...');
    let totalArticles = 0;

    for (const site of insertedSites) {
      const domain = new URL(site.url).hostname;
      const articles = articlesBySite[domain] || [];

      for (const article of articles) {
        const { error: articleError } = await supabase
          .from('link_listings')
          .insert([{
            id: uuidv4(),
            ...article,
            website_id: site.id,
            user_id: publisherId,
            status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (articleError && !articleError.message.includes('duplicate key')) {
          console.error(`❌ Erreur article ${article.title}:`, articleError);
        } else {
          totalArticles++;
          console.log(`✅ Article ajouté: ${article.title} (${article.price} MAD)`);
        }
      }
    }

    console.log(`\n🎉 Résumé:`);
    console.log(`   - ${insertedSites.length} sites web ajoutés`);
    console.log(`   - ${totalArticles} articles existants ajoutés`);
    console.log(`   - Prix variant de 6,000 à 40,000 MAD`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'ajout
addMoroccanSites().then(() => {
  console.log('\n🏁 Ajout terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
