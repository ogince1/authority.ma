import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧹 NETTOYAGE - Supprimer annonce parasite de golftradition.fr');
console.log('='.repeat(80));

async function cleanGolftradition() {
  try {
    console.log('\n📋 Annonce à supprimer:');
    console.log('   ID: 53ce193d-2ae9-47db-81ca-240410652dce');
    console.log('   Titre: Article de test - Rédaction par plateforme');
    console.log('   Problème: Appartient à ogincema mais site appartient à MAXIME');
    console.log('   Status: inactive');

    // Supprimer l'annonce
    const { error: deleteError } = await supabase
      .from('link_listings')
      .delete()
      .eq('id', '53ce193d-2ae9-47db-81ca-240410652dce');

    if (deleteError) {
      console.error('\n❌ Erreur lors de la suppression:', deleteError);
      return;
    }

    console.log('\n✅ Annonce parasite supprimée avec succès !');

    // Vérification
    console.log('\n🔍 Vérification finale...');
    
    const { data: golfWebsite } = await supabase
      .from('websites')
      .select('id, title')
      .ilike('url', '%golftradition%')
      .single();

    if (golfWebsite) {
      const { data: remainingListings } = await supabase
        .from('link_listings')
        .select('id, title')
        .eq('website_id', golfWebsite.id);

      console.log(`\n📊 État final:`);
      console.log(`   Site: ${golfWebsite.title}`);
      console.log(`   Annonces restantes: ${remainingListings?.length || 0}`);
      
      if (remainingListings && remainingListings.length > 0) {
        console.log('\n   ⚠️ Annonces restantes:');
        remainingListings.forEach((l, i) => {
          console.log(`   ${i + 1}. ${l.title} (${l.id})`);
        });
      } else {
        console.log('   ✅ Aucune annonce (parfait pour les nouveaux articles)');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ NETTOYAGE TERMINÉ');
    console.log('='.repeat(80));
    console.log('\n💡 MAINTENANT:');
    console.log('1. Testez à nouveau l\'ajout au panier de golftradition.fr');
    console.log('2. Commandez un nouvel article');
    console.log('3. ✅ Ça devrait fonctionner maintenant !');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

cleanGolftradition();

