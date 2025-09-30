import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

const sites = [
  { title: 'Hespress.com', url: 'https://www.hespress.com', category: 'home_garden', new_article_price: 25000 },
  { title: 'Jumia.ma', url: 'https://www.jumia.ma', category: 'home_garden', new_article_price: 40000 },
  { title: 'Avito.ma', url: 'https://www.avito.ma', category: 'home_garden', new_article_price: 35000 },
  { title: 'Mubawab.ma', url: 'https://www.mubawab.ma', category: 'home_garden', new_article_price: 28000 },
  { title: 'Moteur.ma', url: 'https://www.moteur.ma', category: 'home_garden', new_article_price: 26000 },
  { title: 'Le360.ma', url: 'https://www.le360.ma', category: 'home_garden', new_article_price: 22000 },
  { title: 'Bladi.net', url: 'https://www.bladi.net', category: 'home_garden', new_article_price: 20000 },
  { title: 'TelQuel.ma', url: 'https://www.telquel.ma', category: 'home_garden', new_article_price: 19000 },
  { title: 'Akhbarona.com', url: 'https://www.akhbarona.com', category: 'home_garden', new_article_price: 18000 },
  { title: 'Goud.ma', url: 'https://www.goud.ma', category: 'home_garden', new_article_price: 15000 }
];

async function addSites() {
  console.log('🇲🇦 Ajout rapide des sites marocains...');
  
  const publisherId = 'db521baa-5713-496f-84f2-4a635b9e54a4';
  let success = 0;
  
  for (const site of sites) {
    try {
      const { error } = await supabase.from('websites').insert([{
        id: uuidv4(),
        title: site.title,
        url: site.url,
        category: site.category,
        new_article_price: site.new_article_price,
        description: `Site marocain - ${site.title}`,
        slug: site.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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
      }]);
      
      if (error) {
        console.log(`❌ ${site.title}: ${error.message}`);
      } else {
        console.log(`✅ ${site.title} (${site.new_article_price} MAD)`);
        success++;
      }
    } catch (err) {
      console.log(`❌ ${site.title}: ${err.message}`);
    }
  }
  
  console.log(`\n🎉 ${success}/${sites.length} sites ajoutés !`);
}

addSites().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
