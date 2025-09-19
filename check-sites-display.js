import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSites() {
  console.log('🔍 Vérification des sites marocains...\n');

  try {
    // 1. Vérifier tous les sites
    const { data: allSites, error: allError } = await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erreur sites:', allError);
      return;
    }

    console.log(`✅ ${allSites.length} sites trouvés au total`);
    
    // 2. Vérifier les sites marocains spécifiquement
    const moroccanSites = allSites.filter(site => 
      site.title.includes('Hespress') || 
      site.title.includes('Jumia') || 
      site.title.includes('Avito') ||
      site.title.includes('Mubawab') ||
      site.title.includes('Moteur') ||
      site.title.includes('Le360') ||
      site.title.includes('Bladi') ||
      site.title.includes('TelQuel') ||
      site.title.includes('Akhbarona') ||
      site.title.includes('Goud')
    );

    console.log(`\n🇲🇦 ${moroccanSites.length} sites marocains trouvés:`);
    moroccanSites.forEach(site => {
      console.log(`   - ${site.title} (${site.category}) - ${site.new_article_price} MAD - Status: ${site.status}`);
    });

    // 3. Vérifier la fonction getLinkRecommendations
    console.log('\n🧪 Test de getLinkRecommendations...');
    const { data: recommendations, error: recError } = await supabase
      .rpc('get_link_recommendations', { campaign_id: 'quick-buy' });

    if (recError) {
      console.error('❌ Erreur getLinkRecommendations:', recError);
    } else {
      console.log('✅ getLinkRecommendations fonctionne');
      console.log(`   - Websites: ${recommendations?.websites?.length || 0}`);
      console.log(`   - Link listings: ${recommendations?.link_listings?.length || 0}`);
    }

    // 4. Vérifier les catégories disponibles
    console.log('\n📂 Catégories disponibles:');
    const categories = [...new Set(allSites.map(site => site.category))];
    categories.forEach(cat => {
      const count = allSites.filter(site => site.category === cat).length;
      console.log(`   - ${cat}: ${count} sites`);
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkSites().then(() => {
  console.log('\n🏁 Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
