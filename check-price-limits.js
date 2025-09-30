import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPriceLimits() {
  console.log('🔍 Vérification des limites de prix...\n');

  try {
    // Vérifier les contraintes sur websites
    const { data: websitesConstraints, error: websitesError } = await supabase
      .rpc('get_table_constraints', { table_name: 'websites' });

    if (!websitesError) {
      console.log('📋 Contraintes sur websites:', websitesConstraints);
    }

    // Vérifier les contraintes sur link_listings
    const { data: linksConstraints, error: linksError } = await supabase
      .rpc('get_table_constraints', { table_name: 'link_listings' });

    if (!linksError) {
      console.log('📋 Contraintes sur link_listings:', linksConstraints);
    }

    // Vérifier les prix actuels
    const { data: currentPrices, error: pricesError } = await supabase
      .from('link_listings')
      .select('price')
      .order('price', { ascending: false })
      .limit(10);

    if (!pricesError) {
      console.log('💰 Prix actuels (top 10):', currentPrices);
    }

    // Vérifier les prix des sites
    const { data: sitePrices, error: sitePricesError } = await supabase
      .from('websites')
      .select('new_article_price')
      .order('new_article_price', { ascending: false })
      .limit(10);

    if (!sitePricesError) {
      console.log('🏠 Prix des sites (top 10):', sitePrices);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkPriceLimits().then(() => {
  console.log('\n🏁 Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
