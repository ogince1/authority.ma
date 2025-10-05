import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 CORRECTION - Site golftradition.fr');
console.log('='.repeat(80));

async function fixGolftraditionIssue() {
  try {
    console.log('\n📊 PROBLÈME IDENTIFIÉ:');
    console.log('-'.repeat(80));
    console.log('✅ Site: golftradition.fr existe');
    console.log('✅ Propriétaire: MAXIME MENDIBOURE (maxime.mendiboure@gmail.com)');
    console.log('❌ PROBLÈME 1: L\'annonce de lien est INACTIVE (status: inactive)');
    console.log('❌ PROBLÈME 2: user_id de l\'annonce ≠ user_id du site');
    
    console.log('\n🔧 SOLUTIONS À APPLIQUER:');
    console.log('-'.repeat(80));

    // 1. Activer l'annonce
    console.log('\n1️⃣ Activation de l\'annonce de lien...');
    
    const { data: listing, error: listingError } = await supabase
      .from('link_listings')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', '53ce193d-2ae9-47db-81ca-240410652dce')
      .select()
      .single();

    if (listingError) {
      console.error('❌ Erreur activation annonce:', listingError);
    } else {
      console.log('✅ Annonce activée avec succès');
      console.log(`   Titre: ${listing.title}`);
      console.log(`   Nouveau status: ${listing.status}`);
    }

    // 2. Corriger le user_id de l'annonce pour qu'il corresponde au propriétaire du site
    console.log('\n2️⃣ Correction du user_id de l\'annonce...');
    
    const correctUserId = '23c36f2a-5ff6-4bb1-b95e-83be734821ed'; // MAXIME MENDIBOURE
    
    const { data: updatedListing, error: updateError } = await supabase
      .from('link_listings')
      .update({ 
        user_id: correctUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', '53ce193d-2ae9-47db-81ca-240410652dce')
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour user_id:', updateError);
    } else {
      console.log('✅ user_id corrigé avec succès');
      console.log(`   Ancien: 187fba7a-38bf-4280-a069-656240b1c630`);
      console.log(`   Nouveau: ${updatedListing.user_id}`);
    }

    // 3. Vérification finale
    console.log('\n3️⃣ Vérification finale...');
    
    const { data: finalCheck, error: checkError } = await supabase
      .from('link_listings')
      .select(`
        id,
        title,
        status,
        user_id,
        website:websites(title, user_id)
      `)
      .eq('id', '53ce193d-2ae9-47db-81ca-240410652dce')
      .single();

    if (checkError) {
      console.error('❌ Erreur vérification:', checkError);
    } else {
      console.log('✅ État final de l\'annonce:');
      console.log(`   Titre: ${finalCheck.title}`);
      console.log(`   Status: ${finalCheck.status}`);
      console.log(`   User ID annonce: ${finalCheck.user_id}`);
      console.log(`   User ID site: ${finalCheck.website?.user_id}`);
      
      if (finalCheck.user_id === finalCheck.website?.user_id) {
        console.log('   ✅ user_id correspond au propriétaire du site');
      } else {
        console.log('   ⚠️ user_id ne correspond PAS au propriétaire du site');
      }
      
      if (finalCheck.status === 'active') {
        console.log('   ✅ Annonce active et visible dans le catalogue');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ CORRECTION TERMINÉE');
    console.log('='.repeat(80));
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Testez à nouveau l\'achat dans le panier');
    console.log('2. L\'erreur 409 devrait disparaître');
    console.log('3. Si le problème persiste, vérifiez les demandes en double');

  } catch (error) {
    console.error('\n❌ Erreur générale:', error);
  }
}

fixGolftraditionIssue();

