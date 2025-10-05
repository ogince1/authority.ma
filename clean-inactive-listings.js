import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧹 NETTOYAGE - Annonces inactives dans link_listings');
console.log('='.repeat(80));

async function cleanInactiveListings() {
  try {
    // 1. Compter les inactives
    console.log('\n📊 1. Analyse des annonces inactives...');
    
    const { data: inactiveListings, error: countError } = await supabase
      .from('link_listings')
      .select('id, title, website_id, user_id, created_at')
      .eq('status', 'inactive');

    if (countError) {
      console.error('❌ Erreur:', countError);
      return;
    }

    console.log(`✅ Total annonces inactives: ${inactiveListings?.length || 0}`);

    if (!inactiveListings || inactiveListings.length === 0) {
      console.log('ℹ️  Aucune annonce inactive à supprimer');
      return;
    }

    // 2. Vérifier les demandes liées
    console.log('\n🔍 2. Vérification des demandes liées...');
    
    const inactiveIds = inactiveListings.map(l => l.id);
    
    const { data: linkedRequests, error: linkedError } = await supabase
      .from('link_purchase_requests')
      .select('id, link_listing_id, status')
      .in('link_listing_id', inactiveIds);

    if (linkedError) {
      console.error('❌ Erreur:', linkedError);
      return;
    }

    console.log(`📋 Demandes liées aux annonces inactives: ${linkedRequests?.length || 0}`);

    // Grouper par listing
    const requestsByListing = new Map();
    linkedRequests?.forEach(req => {
      if (!requestsByListing.has(req.link_listing_id)) {
        requestsByListing.set(req.link_listing_id, []);
      }
      requestsByListing.get(req.link_listing_id).push(req);
    });

    // Séparer les annonces supprimables et non supprimables
    const canDelete = inactiveListings.filter(l => !requestsByListing.has(l.id));
    const cannotDelete = inactiveListings.filter(l => requestsByListing.has(l.id));

    console.log(`\n✅ Annonces SANS demandes (supprimables): ${canDelete.length}`);
    console.log(`⚠️  Annonces AVEC demandes (à garder): ${cannotDelete.length}`);

    if (cannotDelete.length > 0) {
      console.log('\n⚠️  Ces annonces ont des demandes et ne seront PAS supprimées:');
      cannotDelete.forEach((listing, index) => {
        const requests = requestsByListing.get(listing.id);
        console.log(`   ${index + 1}. ${listing.title}`);
        console.log(`      ID: ${listing.id.slice(0, 8)}`);
        console.log(`      Demandes: ${requests.length}`);
      });
    }

    // 3. Afficher ce qui sera supprimé
    if (canDelete.length > 0) {
      console.log(`\n📋 Ces ${canDelete.length} annonces seront supprimées:`);
      canDelete.slice(0, 10).forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.title} (${listing.id.slice(0, 8)})`);
      });
      
      if (canDelete.length > 10) {
        console.log(`   ... et ${canDelete.length - 10} autres`);
      }
    } else {
      console.log('\n✅ Aucune annonce à supprimer (toutes ont des demandes liées)');
      return;
    }

    // 4. Suppression
    console.log(`\n🗑️  3. Suppression de ${canDelete.length} annonces inactives...`);
    
    const idsToDelete = canDelete.map(l => l.id);
    
    const { error: deleteError } = await supabase
      .from('link_listings')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError);
      return;
    }

    console.log(`✅ ${canDelete.length} annonces supprimées avec succès`);

    // 5. Vérification finale
    console.log('\n📊 4. État final...');
    
    const { data: finalCount, error: finalError } = await supabase
      .from('link_listings')
      .select('status')
      .eq('status', 'inactive');

    console.log(`   Annonces inactives restantes: ${finalCount?.length || 0}`);

    const { data: activeCount } = await supabase
      .from('link_listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    console.log(`   Annonces actives: ${activeCount || 0}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ NETTOYAGE TERMINÉ');
    console.log('='.repeat(80));
    console.log(`\n📊 Résumé:`);
    console.log(`   ${canDelete.length} annonces inactives supprimées`);
    console.log(`   ${cannotDelete.length} annonces conservées (ont des demandes)`);
    console.log(`   ${finalCount?.length || 0} annonces inactives restantes`);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

cleanInactiveListings();
