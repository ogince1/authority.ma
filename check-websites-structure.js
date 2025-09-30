// Vérifier la structure de la table websites
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebsitesStructure() {
  console.log('🔍 Vérification de la structure de la table websites...\n');
  
  try {
    const { data: websites, error } = await supabase
      .from('websites')
      .select('*')
      .eq('status', 'active')
      .limit(5);

    if (error) {
      console.log('❌ Erreur:', error.message);
    } else {
      console.log(`✅ ${websites?.length || 0} sites web trouvés`);
      
      if (websites && websites.length > 0) {
        console.log('\n📋 Structure des sites web:');
        websites.forEach((website, index) => {
          console.log(`\n${index + 1}. Site ID: ${website.id}`);
          console.log(`   - name: "${website.name}"`);
          console.log(`   - title: "${website.title}"`);
          console.log(`   - url: "${website.url}"`);
          console.log(`   - description: "${website.description}"`);
          console.log(`   - category: "${website.category}"`);
          console.log(`   - domain_authority: ${website.domain_authority}`);
          
          // Extraire le nom du domaine de l'URL
          if (website.url) {
            try {
              const domain = new URL(website.url).hostname;
              const domainName = domain.replace('www.', '').split('.')[0];
              console.log(`   - Nom extrait de l'URL: "${domainName}"`);
            } catch (e) {
              console.log(`   - Erreur extraction URL: ${e.message}`);
            }
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkWebsitesStructure().catch(console.error);
