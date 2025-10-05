import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VÉRIFICATION - link_purchase_transactions');
console.log('='.repeat(80));

async function checkTransactionsConstraint() {
  try {
    // 1. Vérifier si des transactions utilisent website_id
    console.log('\n📊 1. Analyse des transactions...');
    
    const { data: allTransactions, error } = await supabase
      .from('link_purchase_transactions')
      .select('id, link_listing_id, purchase_request_id');

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log(`✅ Total transactions: ${allTransactions?.length || 0}`);

    if (!allTransactions || allTransactions.length === 0) {
      console.log('ℹ️  Aucune transaction trouvée');
      return;
    }

    // 2. Pour chaque transaction, vérifier si link_listing_id existe dans link_listings
    let listingCount = 0;
    let websiteCount = 0;
    let orphanCount = 0;

    for (const tx of allTransactions) {
      // Vérifier dans link_listings
      const { data: asListing } = await supabase
        .from('link_listings')
        .select('id')
        .eq('id', tx.link_listing_id)
        .single();

      // Vérifier dans websites
      const { data: asWebsite } = await supabase
        .from('websites')
        .select('id')
        .eq('id', tx.link_listing_id)
        .single();

      if (asListing) {
        listingCount++;
      } else if (asWebsite) {
        websiteCount++;
      } else {
        orphanCount++;
      }

      // Arrêter après les 100 premières pour ne pas trop long
      if (listingCount + websiteCount + orphanCount >= 100) {
        console.log('   (Analyse limitée aux 100 premières transactions)');
        break;
      }
    }

    console.log('\n📊 Résultats:');
    console.log(`   Transactions avec link_listing_id: ${listingCount}`);
    console.log(`   Transactions avec website_id: ${websiteCount}`);
    console.log(`   Transactions orphelines: ${orphanCount}`);

    // 3. Conclusion
    console.log('\n🎯 CONCLUSION:');
    console.log('-'.repeat(80));
    
    if (websiteCount > 0) {
      console.log(`⚠️  ${websiteCount} transactions utilisent website_id !`);
      console.log('   La contrainte de link_purchase_transactions DOIT aussi être supprimée');
      console.log('\n✅ ACTION REQUISE:');
      console.log('   1. Supprimer contrainte de link_purchase_requests');
      console.log('   2. Supprimer contrainte de link_purchase_transactions');
    } else {
      console.log(`✅ ${listingCount} transactions utilisent seulement link_listing_id`);
      console.log('   La contrainte de link_purchase_transactions peut rester');
      console.log('\n✅ ACTION REQUISE:');
      console.log('   1. Supprimer contrainte de link_purchase_requests seulement');
    }

    if (orphanCount > 0) {
      console.log(`\n⚠️  ${orphanCount} transactions ont des IDs orphelins !`);
      console.log('   Ces IDs n\'existent ni dans link_listings ni dans websites');
      console.log('   Nettoyage recommandé');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

checkTransactionsConstraint();

