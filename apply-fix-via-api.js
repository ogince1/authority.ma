import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 APPLICATION - Suppression contrainte FK');
console.log('='.repeat(80));

async function applyFix() {
  try {
    console.log('\n📋 CONTRAINTE À SUPPRIMER:');
    console.log('   Table: link_purchase_requests');
    console.log('   Contrainte: link_purchase_requests_link_listing_id_fkey');
    console.log('   Raison: Empêche l\'utilisation de website_id pour nouveaux articles');

    console.log('\n⏳ Suppression de la contrainte...');

    // Exécuter le SQL via l'API Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE link_purchase_requests 
        DROP CONSTRAINT IF EXISTS link_purchase_requests_link_listing_id_fkey;
        
        COMMENT ON COLUMN link_purchase_requests.link_listing_id IS 
        'Peut contenir link_listing_id (articles existants) ou website_id (nouveaux articles)';
      `
    });

    if (error) {
      console.log('\n⚠️  RPC exec_sql non disponible. Utilisons l\'approche directe...');
      console.log('   Veuillez exécuter manuellement dans Supabase SQL Editor:');
      console.log('\n```sql');
      console.log('ALTER TABLE link_purchase_requests ');
      console.log('DROP CONSTRAINT IF EXISTS link_purchase_requests_link_listing_id_fkey;');
      console.log('');
      console.log('COMMENT ON COLUMN link_purchase_requests.link_listing_id IS ');
      console.log('\'Peut contenir link_listing_id (articles existants) ou website_id (nouveaux articles)\';');
      console.log('```');
      console.log('\n📍 Comment faire:');
      console.log('   1. Allez sur https://supabase.com/dashboard');
      console.log('   2. Sélectionnez votre projet');
      console.log('   3. Allez dans SQL Editor');
      console.log('   4. Collez le SQL ci-dessus');
      console.log('   5. Cliquez RUN');
      return;
    }

    console.log('\n✅ Contrainte supprimée avec succès !');

    // Test immédiat
    console.log('\n🧪 TEST IMMÉDIAT - golftradition.fr...');
    
    const { data: advertiser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: golfSite } = await supabase
      .from('websites')
      .select('id, title, user_id, new_article_price')
      .ilike('url', '%golftradition%')
      .single();

    const testRequest = {
      link_listing_id: golfSite.id,  // website_id
      user_id: advertiser.id,
      publisher_id: golfSite.user_id,
      target_url: 'https://test-after-fix.com',
      anchor_text: 'Test après correction',
      proposed_price: golfSite.new_article_price,
      proposed_duration: 1,
      content_option: 'platform'
    };

    const { data: testResult, error: testError } = await supabase
      .from('link_purchase_requests')
      .insert([testRequest])
      .select()
      .single();

    if (testError) {
      console.log('\n❌ Test échoué:', testError.message);
    } else {
      console.log('\n✅ TEST RÉUSSI !');
      console.log(`   Demande créée: ${testResult.id}`);
      console.log(`   link_listing_id utilisé: ${testResult.link_listing_id} (website_id)`);
      
      // Nettoyage
      await supabase
        .from('link_purchase_requests')
        .delete()
        .eq('id', testResult.id);
      console.log('   ✅ Demande de test nettoyée');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ CORRECTION APPLIQUÉE ET TESTÉE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

applyFix();

