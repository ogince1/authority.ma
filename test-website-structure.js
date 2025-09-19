// Test de la nouvelle structure avec websites comme headers
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebsiteStructure() {
  console.log('🔧 Test de la nouvelle structure avec websites comme headers...\n');
  
  try {
    // Récupérer les sites web (websites) comme headers d'accordéon
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (websitesError) {
      console.log('❌ Erreur websites:', websitesError.message);
    } else {
      console.log(`✅ Sites web (headers): ${websites?.length || 0}`);
      if (websites && websites.length > 0) {
        console.log('📋 Exemples de sites web:');
        websites.slice(0, 3).forEach((website, index) => {
          console.log(`   ${index + 1}. ${website.name} - ${website.url}`);
        });
      }
    }

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
          console.log(`   ${index + 1}. ${listing.title} - Site: ${listing.website?.name || 'N/A'}`);
        });
      }
    }

    // Créer la structure d'accordéon
    const accordionData = (websites || []).map(website => {
      const siteArticles = (linkListings || []).filter(listing => listing.website_id === website.id);
      
      return {
        website: {
          id: website.id,
          name: website.name,
          url: website.url,
          category: website.category || 'various',
          tf: website.domain_authority || 0,
          cf: 0
        },
        existingArticles: siteArticles,
        newArticle: {
          id: `new-${website.id}`,
          website_id: website.id,
          title: website.name,
          price: 80
        }
      };
    });
    
    console.log(`\n📊 Structure d'accordéon créée:`);
    console.log(`   - Nombre de sites: ${accordionData.length}`);
    
    accordionData.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.website.name} - ${item.existingArticles.length} articles existants`);
    });
    
    console.log('\n✅ Test terminé!');
    console.log('📝 Structure correcte:');
    console.log('   - websites → Headers d\'accordéon');
    console.log('   - link_listings → Articles dans le contenu');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testWebsiteStructure().catch(console.error);
