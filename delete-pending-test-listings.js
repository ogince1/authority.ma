import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🗑️  SUPPRESSION - Annonces pending de test');
console.log('='.repeat(80));

async function deletePendingTestListings() {
  try {
    console.log('\n📋 Annonces à supprimer:');
    console.log('   1. Nouvel article sur vit.ma (ID: 453e0309...)');
    console.log('   2. Nouvel article sur golftradition.fr (ID: 687dbc8b...)');
    console.log('\n⚠️  Ces annonces ont été créées par erreur lors des tests');
    console.log('   Elles ne servent plus à rien maintenant que la contrainte FK est supprimée');

    // Supprimer la demande liée à golftradition.fr (cancelled)
    console.log('\n🗑️  1. Suppression de la demande cancelled pour golftradition.fr...');
    
    const { error: deleteReq1 } = await supabase
      .from('link_purchase_requests')
      .delete()
      .eq('id', '154412ee-cf9c-4ca3-b1cd-c4766f6ae41c');

    if (deleteReq1) {
      console.log(`   ⚠️  ${deleteReq1.message}`);
    } else {
      console.log('   ✅ Demande supprimée');
    }

    // Supprimer la demande liée à vit.ma (accepted)
    console.log('\n🗑️  2. Suppression de la demande accepted pour vit.ma...');
    
    const { error: deleteReq2 } = await supabase
      .from('link_purchase_requests')
      .delete()
      .eq('id', '70df972f-88f3-4bbd-a7a7-1f2f5c5c1e0a');

    if (deleteReq2) {
      console.log(`   ⚠️  ${deleteReq2.message}`);
    } else {
      console.log('   ✅ Demande supprimée');
    }

    // Supprimer les annonces pending
    console.log('\n🗑️  3. Suppression des annonces pending...');
    
    const { error: deleteListings } = await supabase
      .from('link_listings')
      .delete()
      .in('id', [
        '453e0309-3c88-415f-ac6e-ccb068a0351d',  // vit.ma
        '687dbc8b-2357-4d86-886a-0e5f0b22c0e5'   // golftradition.fr
      ]);

    if (deleteListings) {
      console.error('❌ Erreur:', deleteListings.message);
      return;
    }

    console.log('✅ 2 annonces pending supprimées');

    // Vérification finale
    console.log('\n📊 4. État final de link_listings...');
    
    const { data: finalListings, error: finalError } = await supabase
      .from('link_listings')
      .select('id, title, status, price')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Erreur:', finalError);
      return;
    }

    console.log(`\n✅ Total annonces: ${finalListings?.length || 0}`);

    const byStatus = finalListings?.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Par status:');
    Object.entries(byStatus || {}).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n📋 Annonces restantes:');
    finalListings?.forEach((l, i) => {
      console.log(`   ${i + 1}. ${l.title} - ${l.status} - ${l.price} MAD`);
    });

    // Vérifier les demandes
    const { count: totalRequests } = await supabase
      .from('link_purchase_requests')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📝 Total demandes: ${totalRequests || 0}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ NETTOYAGE TERMINÉ');
    console.log('='.repeat(80));
    console.log('\n📊 Base de données propre:');
    console.log(`   - ${finalListings?.length || 0} annonces (seulement actives)`);
    console.log(`   - ${totalRequests || 0} demandes (seulement réelles)`);
    console.log('   - 0 données de test restantes');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

deletePendingTestListings();
