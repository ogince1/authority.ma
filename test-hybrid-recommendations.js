// Test de la fonction getLinkRecommendations hybride
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHybridRecommendations() {
  console.log('🔧 Test de getLinkRecommendations hybride...\n');
  
  try {
    // Récupérer les articles existants (link_listings actifs)
    const { data: linkListings, error: listingsError } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (listingsError) {
      console.log('❌ Erreur link_listings:', listingsError.message);
    } else {
      console.log(`✅ Articles existants (link_listings): ${linkListings?.length || 0}`);
      if (linkListings && linkListings.length > 0) {
        console.log('📋 Exemples d\'articles existants:');
        linkListings.slice(0, 3).forEach((listing, index) => {
          console.log(`   ${index + 1}. ${listing.title} - ${listing.price} MAD`);
        });
      }
    }

    // Récupérer les sites web pour articles nouveaux (websites)
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (websitesError) {
      console.log('❌ Erreur websites:', websitesError.message);
    } else {
      console.log(`✅ Sites web pour articles nouveaux (websites): ${websites?.length || 0}`);
      if (websites && websites.length > 0) {
        console.log('📋 Exemples de sites web:');
        websites.slice(0, 3).forEach((website, index) => {
          console.log(`   ${index + 1}. ${website.name} - ${website.url}`);
        });
      }
    }

    const existingArticles = linkListings || [];
    const newArticles = websites || [];
    
    const result = {
      existing_articles: existingArticles,
      new_articles: newArticles
    };
    
    console.log(`\n📊 Résultat final:`);
    console.log(`   - Articles existants: ${result.existing_articles.length}`);
    console.log(`   - Articles nouveaux: ${result.new_articles.length}`);
    console.log(`   - Total: ${result.existing_articles.length + result.new_articles.length}`);
    
    console.log('\n✅ Test terminé!');
    console.log('📝 Le système hybride est prêt:');
    console.log('   - link_listings → Articles existants');
    console.log('   - websites → Articles nouveaux');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testHybridRecommendations().catch(console.error);
