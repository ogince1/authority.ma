import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🗑️  SUPPRESSION FORCÉE - Annonces inactives + demandes liées');
console.log('='.repeat(80));
console.log('⚠️  MODE AGRESSIF: Supprime tout (données de test)');
console.log('='.repeat(80));

async function forceDeleteInactiveListings() {
  try {
    // 1. Récupérer toutes les annonces inactives
    console.log('\n📊 1. Récupération des annonces inactives...');
    
    const { data: inactiveListings, error: listError } = await supabase
      .from('link_listings')
      .select('id, title')
      .eq('status', 'inactive');

    if (listError) {
      console.error('❌ Erreur:', listError);
      return;
    }

    console.log(`✅ ${inactiveListings?.length || 0} annonces inactives trouvées`);

    if (!inactiveListings || inactiveListings.length === 0) {
      console.log('ℹ️  Aucune annonce inactive');
      return;
    }

    const inactiveIds = inactiveListings.map(l => l.id);

    // 2. Supprimer d'abord les demandes liées
    console.log('\n🗑️  2. Suppression des demandes liées...');
    
    const { data: requestsToDelete, error: reqCountError } = await supabase
      .from('link_purchase_requests')
      .select('id, status')
      .in('link_listing_id', inactiveIds);

    console.log(`   Demandes à supprimer: ${requestsToDelete?.length || 0}`);

    if (requestsToDelete && requestsToDelete.length > 0) {
      // Supprimer les conversations liées d'abord
      console.log('   Suppression des conversations liées...');
      const requestIds = requestsToDelete.map(r => r.id);
      
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .in('purchase_request_id', requestIds);

      if (convError) {
        console.log(`   ⚠️  Erreur conversations: ${convError.message}`);
      } else {
        console.log('   ✅ Conversations supprimées');
      }

      // Supprimer les transactions crédit liées
      console.log('   Suppression des transactions crédit liées...');
      
      const { error: txError } = await supabase
        .from('credit_transactions')
        .delete()
        .in('related_purchase_request_id', requestIds);

      if (txError) {
        console.log(`   ⚠️  Erreur transactions: ${txError.message}`);
      } else {
        console.log('   ✅ Transactions supprimées');
      }

      // Supprimer les demandes
      console.log('   Suppression des demandes...');
      
      const { error: deleteReqError } = await supabase
        .from('link_purchase_requests')
        .delete()
        .in('id', requestIds);

      if (deleteReqError) {
        console.error(`   ❌ Erreur: ${deleteReqError.message}`);
        return;
      }

      console.log(`   ✅ ${requestsToDelete.length} demandes supprimées`);
    }

    // 3. Supprimer les annonces inactives
    console.log('\n🗑️  3. Suppression des annonces inactives...');
    
    const { error: deleteListError } = await supabase
      .from('link_listings')
      .delete()
      .in('id', inactiveIds);

    if (deleteListError) {
      console.error('❌ Erreur:', deleteListError);
      return;
    }

    console.log(`✅ ${inactiveListings.length} annonces inactives supprimées`);

    // 4. Vérification finale
    console.log('\n📊 4. Vérification finale...');
    
    const { count: remainingInactive } = await supabase
      .from('link_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive');

    const { count: totalActive } = await supabase
      .from('link_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: totalRequests } = await supabase
      .from('link_purchase_requests')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 État final:`);
    console.log(`   Annonces inactives: ${remainingInactive || 0}`);
    console.log(`   Annonces actives: ${totalActive || 0}`);
    console.log(`   Total demandes: ${totalRequests || 0}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ NETTOYAGE FORCÉ TERMINÉ');
    console.log('='.repeat(80));
    console.log(`\n📊 Supprimé:`);
    console.log(`   - ${inactiveListings.length} annonces inactives`);
    console.log(`   - ${requestsToDelete?.length || 0} demandes liées`);
    console.log(`   - Conversations et transactions associées`);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

forceDeleteInactiveListings();
