import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VÉRIFICATION - Annonces en status pending');
console.log('='.repeat(80));

async function checkPendingListings() {
  try {
    // Récupérer toutes les annonces
    const { data: allListings, error } = await supabase
      .from('link_listings')
      .select('id, title, status, user_id, website_id, price, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log(`\n📊 Total annonces: ${allListings?.length || 0}`);

    // Grouper par status
    const byStatus = allListings?.reduce((acc, listing) => {
      acc[listing.status] = (acc[listing.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Répartition par status:');
    Object.entries(byStatus || {}).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Focus sur les pending
    const pendingListings = allListings?.filter(l => l.status === 'pending');

    if (pendingListings && pendingListings.length > 0) {
      console.log(`\n⚠️  ${pendingListings.length} annonces en status PENDING:`);
      console.log('-'.repeat(80));

      for (const listing of pendingListings) {
        console.log(`\n   📄 ${listing.title}`);
        console.log(`      ID: ${listing.id}`);
        console.log(`      Prix: ${listing.price} MAD`);
        console.log(`      Créée: ${new Date(listing.created_at).toLocaleString()}`);
        console.log(`      user_id: ${listing.user_id}`);
        console.log(`      website_id: ${listing.website_id || 'N/A'}`);

        // Vérifier si elles ont des demandes
        const { data: requests } = await supabase
          .from('link_purchase_requests')
          .select('id, status, user_id')
          .eq('link_listing_id', listing.id);

        console.log(`      Demandes liées: ${requests?.length || 0}`);
        if (requests && requests.length > 0) {
          requests.forEach((req, i) => {
            console.log(`         ${i + 1}. #${req.id.slice(0, 8)} - ${req.status}`);
          });
        }

        // Vérifier si c'est une entrée "pont" (même ID que website)
        if (listing.website_id) {
          const { data: website } = await supabase
            .from('websites')
            .select('id, title')
            .eq('id', listing.id)
            .single();

          if (website) {
            console.log(`      ⚠️  TYPE: Entrée "pont" (même ID que website)`);
            console.log(`      Website: ${website.title}`);
          }
        }
      }

      console.log('\n💡 POURQUOI EN PENDING ?');
      console.log('-'.repeat(80));
      console.log('   Status "pending" signifie généralement:');
      console.log('   1. Annonce en attente de validation admin');
      console.log('   2. Annonce temporaire créée pour une demande');
      console.log('   3. Annonce de test non finalisée');
      console.log('\n✅ OPTIONS:');
      console.log('   A. Les activer (status = \'active\')');
      console.log('   B. Les supprimer si ce sont des données de test');
      console.log('   C. Les laisser si elles sont en attente de validation réelle');
    } else {
      console.log('\n✅ Aucune annonce en status pending');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

checkPendingListings();
