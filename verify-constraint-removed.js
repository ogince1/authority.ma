import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VÉRIFICATION - Migration appliquée ?');
console.log('='.repeat(80));

async function verifyConstraintRemoved() {
  try {
    console.log('\n📊 1. Test de création de demande pour golftradition.fr...');
    console.log('-'.repeat(80));

    // Récupérer les données nécessaires
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: golfSite } = await supabase
      .from('websites')
      .select('id, title, user_id, new_article_price')
      .ilike('url', '%golftradition%')
      .single();

    console.log(`✅ Annonceur: ${advertiser.name} (${advertiser.email})`);
    console.log(`✅ Site: ${golfSite.title}`);
    console.log(`✅ Prix: ${golfSite.new_article_price} MAD`);

    // Test : Créer une demande avec website_id comme link_listing_id
    console.log('\n🧪 TEST: Créer demande avec website_id...');
    
    const requestData = {
      link_listing_id: golfSite.id,  // website_id
      user_id: advertiser.id,
      publisher_id: golfSite.user_id,
      target_url: 'https://test-verification-constraint.com',
      anchor_text: 'Test après suppression contrainte',
      proposed_price: golfSite.new_article_price,
      proposed_duration: 1,
      content_option: 'platform'
    };

    console.log(`\n   link_listing_id utilisé: ${requestData.link_listing_id}`);
    console.log(`   Type: website_id (pas dans link_listings)`);

    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert([requestData])
      .select()
      .single();

    if (requestError) {
      console.log('\n❌ ÉCHEC DE LA VÉRIFICATION:');
      console.log(`   Code: ${requestError.code}`);
      console.log(`   Message: ${requestError.message}`);
      
      if (requestError.code === '23503') {
        console.log('\n⚠️  LA CONTRAINTE N\'A PAS ÉTÉ SUPPRIMÉE !');
        console.log('   La migration n\'a pas fonctionné.');
        console.log('\n📝 Réessayez dans Supabase Dashboard:');
        console.log('   1. SQL Editor');
        console.log('   2. Coller: ALTER TABLE link_purchase_requests DROP CONSTRAINT IF EXISTS link_purchase_requests_link_listing_id_fkey;');
        console.log('   3. RUN');
      }
      
      return false;
    }

    console.log('\n✅ SUCCÈS ! LA MIGRATION A FONCTIONNÉ !');
    console.log(`   Demande créée: ${purchaseRequest.id}`);
    console.log(`   Status: ${purchaseRequest.status}`);
    console.log(`   link_listing_id: ${purchaseRequest.link_listing_id} (website_id accepté)`);

    // 2. Vérifier que la demande est bien lisible
    console.log('\n📖 2. Vérification lecture de la demande...');
    
    const { data: readRequest, error: readError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        link_listing_id,
        status,
        anchor_text,
        link_listing:link_listings(id, title)
      `)
      .eq('id', purchaseRequest.id)
      .single();

    if (readError) {
      console.log('❌ Erreur lecture:', readError.message);
    } else {
      console.log('✅ Demande lisible');
      console.log(`   link_listing jointure: ${readRequest.link_listing ? 'Trouvé' : 'NULL (normal pour nouveau article)'}`);
    }

    // 3. Nettoyage
    console.log('\n🧹 3. Nettoyage de la demande de test...');
    
    const { error: deleteError } = await supabase
      .from('link_purchase_requests')
      .delete()
      .eq('id', purchaseRequest.id);

    if (deleteError) {
      console.log('⚠️  Erreur nettoyage:', deleteError.message);
    } else {
      console.log('✅ Demande de test supprimée');
    }

    // 4. Conclusion finale
    console.log('\n' + '='.repeat(80));
    console.log('🎉 VÉRIFICATION TERMINÉE AVEC SUCCÈS');
    console.log('='.repeat(80));
    console.log('\n✅ La contrainte a bien été supprimée');
    console.log('✅ golftradition.fr peut maintenant être commandé');
    console.log('✅ Tous les futurs sites fonctionneront');
    console.log('\n💡 PROCHAINE ÉTAPE:');
    console.log('   Testez dans le navigateur: http://localhost:5175/panier');
    console.log('   Ajoutez golftradition.fr et validez la commande');

    return true;

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    return false;
  }
}

verifyConstraintRemoved();
