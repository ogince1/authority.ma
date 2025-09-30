import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Articles pour chaque site marocain (prix limités à 5000 MAD max)
const articlesBySite = {
  'hespress.com': [
    { title: 'Actualités politiques marocaines', description: 'Suivi de l\'actualité politique au Maroc', target_url: 'https://www.hespress.com/politique', price: 4500 },
    { title: 'Économie marocaine', description: 'Actualités économiques et financières', target_url: 'https://www.hespress.com/economie', price: 4000 },
    { title: 'Sport marocain', description: 'Actualités sportives nationales', target_url: 'https://www.hespress.com/sport', price: 3500 }
  ],
  'jumia.ma': [
    { title: 'Électronique et High-Tech', description: 'Produits électroniques et technologie', target_url: 'https://www.jumia.ma/electronique', price: 5000 },
    { title: 'Mode et Beauté', description: 'Vêtements et produits de beauté', target_url: 'https://www.jumia.ma/mode', price: 4500 },
    { title: 'Maison et Jardin', description: 'Articles pour la maison et le jardin', target_url: 'https://www.jumia.ma/maison', price: 4000 }
  ],
  'avito.ma': [
    { title: 'Voitures d\'occasion', description: 'Achat et vente de véhicules', target_url: 'https://www.avito.ma/voitures', price: 5000 },
    { title: 'Immobilier', description: 'Ventes et locations immobilières', target_url: 'https://www.avito.ma/immobilier', price: 4800 },
    { title: 'Emploi', description: 'Offres d\'emploi au Maroc', target_url: 'https://www.avito.ma/emploi', price: 3500 }
  ],
  'mubawab.ma': [
    { title: 'Appartements à vendre', description: 'Vente d\'appartements au Maroc', target_url: 'https://www.mubawab.ma/vente-appartements', price: 5000 },
    { title: 'Villas et maisons', description: 'Vente de villas et maisons', target_url: 'https://www.mubawab.ma/vente-villas', price: 5000 },
    { title: 'Locations', description: 'Appartements et maisons à louer', target_url: 'https://www.mubawab.ma/locations', price: 4500 }
  ],
  'moteur.ma': [
    { title: 'Voitures neuves', description: 'Véhicules neufs au Maroc', target_url: 'https://www.moteur.ma/voitures-neuves', price: 5000 },
    { title: 'Voitures d\'occasion', description: 'Véhicules d\'occasion', target_url: 'https://www.moteur.ma/voitures-occasion', price: 4500 },
    { title: 'Pièces auto', description: 'Pièces détachées automobiles', target_url: 'https://www.moteur.ma/pièces-auto', price: 3000 }
  ],
  'le360.ma': [
    { title: 'Actualités Maroc', description: 'Actualités du Maroc', target_url: 'https://www.le360.ma/actualites', price: 4000 },
    { title: 'Économie', description: 'Actualités économiques', target_url: 'https://www.le360.ma/economie', price: 3800 },
    { title: 'Sport', description: 'Actualités sportives', target_url: 'https://www.le360.ma/sport', price: 3200 }
  ],
  'bladi.net': [
    { title: 'Communauté marocaine', description: 'Forum de la communauté marocaine', target_url: 'https://www.bladi.net/forum', price: 4200 },
    { title: 'Actualités', description: 'Actualités marocaines', target_url: 'https://www.bladi.net/actualites', price: 3800 },
    { title: 'Débats', description: 'Débats et discussions', target_url: 'https://www.bladi.net/debats', price: 3500 }
  ],
  'telquel.ma': [
    { title: 'Magazine TelQuel', description: 'Articles du magazine TelQuel', target_url: 'https://www.telquel.ma/magazine', price: 4500 },
    { title: 'Actualités', description: 'Actualités marocaines', target_url: 'https://www.telquel.ma/actualites', price: 4000 },
    { title: 'Opinions', description: 'Opinions et analyses', target_url: 'https://www.telquel.ma/opinions', price: 3800 }
  ],
  'akhbarona.com': [
    { title: 'Actualités Maroc', description: 'Actualités marocaines', target_url: 'https://www.akhbarona.com/actualites', price: 3800 },
    { title: 'Politique', description: 'Actualités politiques', target_url: 'https://www.akhbarona.com/politique', price: 3500 },
    { title: 'Économie', description: 'Actualités économiques', target_url: 'https://www.akhbarona.com/economie', price: 3200 }
  ],
  'goud.ma': [
    { title: 'Actualités Goud', description: 'Actualités marocaines', target_url: 'https://www.goud.ma/actualites', price: 3000 },
    { title: 'Sport', description: 'Actualités sportives', target_url: 'https://www.goud.ma/sport', price: 2800 },
    { title: 'Culture', description: 'Actualités culturelles', target_url: 'https://www.goud.ma/culture', price: 2500 }
  ]
};

async function addArticlesToSites() {
  console.log('📝 Ajout d\'articles aux sites marocains...\n');

  try {
    // 1. Récupérer l'utilisateur ogincema@gmail.com
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Utilisateur non trouvé:', userError);
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}`);

    // 2. Récupérer les sites marocains
    const { data: moroccanSites, error: sitesError } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', user.id)
      .or('title.ilike.%Hespress%,title.ilike.%Jumia%,title.ilike.%Avito%,title.ilike.%Mubawab%,title.ilike.%Moteur%,title.ilike.%Le360%,title.ilike.%Bladi%,title.ilike.%TelQuel%,title.ilike.%Akhbarona%,title.ilike.%Goud%');

    if (sitesError) {
      console.error('❌ Erreur recherche sites:', sitesError);
      return;
    }

    console.log(`✅ ${moroccanSites.length} sites marocains trouvés`);

    // 3. Ajouter des articles pour chaque site
    let totalArticles = 0;

    for (const site of moroccanSites) {
      const domain = new URL(site.url).hostname;
      const articles = articlesBySite[domain] || [];

      console.log(`\n📰 Ajout d'articles pour ${site.title} (${articles.length} articles)...`);

      for (const article of articles) {
        const { error: articleError } = await supabase
          .from('link_listings')
          .insert([{
            id: uuidv4(),
            title: article.title,
            description: article.description,
            target_url: article.target_url,
            price: article.price,
            website_id: site.id,
            user_id: user.id,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (articleError) {
          console.error(`❌ Erreur article ${article.title}:`, articleError);
        } else {
          console.log(`✅ ${article.title} (${article.price} MAD)`);
          totalArticles++;
        }
      }
    }

    console.log(`\n🎉 ${totalArticles} articles ajoutés avec succès !`);
    console.log('✅ Les sites marocains devraient maintenant apparaître dans "Trouver des Médias"');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

addArticlesToSites().then(() => {
  console.log('\n🏁 Ajout d\'articles terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});