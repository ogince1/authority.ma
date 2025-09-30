// Appliquer les champs prix et nouveau à la table websites
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPriceFields() {
  console.log('🔧 Ajout des champs prix et nouveau à la table websites...\n');
  
  try {
    // Vérifier d'abord si les colonnes existent
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'websites' });
    
    if (columnsError) {
      console.log('⚠️  Impossible de vérifier les colonnes, on continue...');
    } else {
      console.log('📋 Colonnes existantes:', columns?.map(c => c.column_name));
    }
    
    // Ajouter les colonnes si elles n'existent pas
    console.log('\n1️⃣ Ajout de la colonne new_article_price...');
    const { error: priceError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE websites ADD COLUMN IF NOT EXISTS new_article_price INTEGER DEFAULT 80;' 
      });
    
    if (priceError) {
      console.log('❌ Erreur ajout new_article_price:', priceError.message);
    } else {
      console.log('✅ Colonne new_article_price ajoutée');
    }
    
    console.log('\n2️⃣ Ajout de la colonne is_new_article...');
    const { error: newError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE websites ADD COLUMN IF NOT EXISTS is_new_article BOOLEAN DEFAULT true;' 
      });
    
    if (newError) {
      console.log('❌ Erreur ajout is_new_article:', newError.message);
    } else {
      console.log('✅ Colonne is_new_article ajoutée');
    }
    
    // Mettre à jour les sites existants
    console.log('\n3️⃣ Mise à jour des sites existants...');
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, new_article_price, is_new_article')
      .limit(10);
    
    if (websitesError) {
      console.log('❌ Erreur récupération websites:', websitesError.message);
    } else {
      console.log(`✅ ${websites?.length || 0} sites web trouvés`);
      
      // Mettre à jour les sites qui n'ont pas de prix défini
      for (const website of websites || []) {
        if (website.new_article_price === null || website.is_new_article === null) {
          const { error: updateError } = await supabase
            .from('websites')
            .update({
              new_article_price: 80,
              is_new_article: true
            })
            .eq('id', website.id);
          
          if (updateError) {
            console.log(`❌ Erreur mise à jour site ${website.id}:`, updateError.message);
          } else {
            console.log(`✅ Site ${website.id} mis à jour`);
          }
        }
      }
    }
    
    console.log('\n✅ Migration terminée!');
    console.log('📝 Les champs suivants ont été ajoutés:');
    console.log('   - new_article_price: Prix pour les nouveaux articles (défaut: 80 MAD)');
    console.log('   - is_new_article: Accepte les nouveaux articles (défaut: true)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

addPriceFields().catch(console.error);
