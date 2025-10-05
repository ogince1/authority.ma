import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 TEST SPÉCIFIQUE - golftradition.fr');
console.log('='.repeat(80));

async function testGolftraditionSpecifically() {
  try {
    // Récupérer les utilisateurs
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: maxime } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'maxime.mendiboure@gmail.com')
      .single();

    console.log('\n👥 UTILISATEURS:');
    console.log(`   Annonceur: ${advertiser.name} (${advertiser.email})`);
    console.log(`   ID: ${advertiser.id}`);
    console.log(`   Rôle: ${advertiser.role}`);
    
    console.log(`\n   Éditeur: ${maxime.name} (${maxime.email})`);
    console.log(`   ID: ${maxime.id}`);
    console.log(`   Rôle: ${maxime.role}`);

    // Récupérer golftradition.fr
    const { data: golfSite } = await supabase
      .from('websites')
      .select('*')
      .ilike('url', '%golftradition%')
      .single();

    console.log('\n🏌️ SITE GOLFTRADITION.FR:');
    console.log(`   Titre: ${golfSite.title}`);
    console.log(`   ID: ${golfSite.id}`);
    console.log(`   user_id: ${golfSite.user_id}`);
    console.log(`   Status: ${golfSite.status}`);
    console.log(`   Prix nouveau article: ${golfSite.new_article_price} MAD`);
    console.log(`   Accepte nouveaux articles: ${golfSite.is_new_article}`);
    console.log(`   Catégorie: ${golfSite.category}`);

    // VÉRIFICATION CRITIQUE
    console.log('\n🔍 VÉRIFICATIONS CRITIQUES:');
    console.log(`   1. user_id du site correspond à MAXIME ? ${golfSite.user_id === maxime.id ? '✅ OUI' : '❌ NON'}`);
    console.log(`   2. Site actif ? ${golfSite.status === 'active' ? '✅ OUI' : '❌ NON'}`);
    console.log(`   3. Accepte nouveaux articles ? ${golfSite.is_new_article ? '✅ OUI' : '❌ NON'}`);
    console.log(`   4. Catégorie définie ? ${golfSite.category ? '✅ OUI' : '❌ NON'}`);

    // TEST: Créer une demande pour golftradition.fr
    console.log('\n🧪 TEST: Créer demande pour golftradition.fr (NOUVEAU ARTICLE)');
    console.log('-'.repeat(80));

    const requestData = {
      link_listing_id: golfSite.id,  // website_id
      user_id: advertiser.id,
      publisher_id: maxime.id,  // MAXIME, pas ogincema
      target_url: 'https://example-golf.com/mon-article',
      anchor_text: 'Test golf tradition',
      proposed_price: golfSite.new_article_price,
      proposed_duration: 1,
      content_option: 'platform',
      status: 'pending'
    };

    console.log('\nDonnées à insérer:');
    console.log(`   link_listing_id: ${requestData.link_listing_id} (website_id)`);
    console.log(`   user_id: ${requestData.user_id} (${advertiser.name})`);
    console.log(`   publisher_id: ${requestData.publisher_id} (${maxime.name})`);
    console.log(`   target_url: ${requestData.target_url}`);
    console.log(`   anchor_text: ${requestData.anchor_text}`);
    console.log(`   proposed_price: ${requestData.proposed_price} MAD`);

    console.log('\n⏳ Tentative d\'insertion...');
    
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert([requestData])
      .select()
      .single();

    if (requestError) {
      console.log('\n❌ ERREUR POUR GOLFTRADITION.FR:');
      console.log(`   Code: ${requestError.code}`);
      console.log(`   Message: ${requestError.message}`);
      console.log(`   Détails: ${requestError.details || 'N/A'}`);
      console.log(`   Hint: ${requestError.hint || 'N/A'}`);
      
      if (requestError.code === '23503') {
        console.log('\n🔍 Analyse de la contrainte:');
        
        // Vérifier si l'ID existe dans websites
        const { data: websiteCheck } = await supabase
          .from('websites')
          .select('id')
          .eq('id', golfSite.id)
          .single();
        
        console.log(`   ID existe dans websites ? ${websiteCheck ? '✅ OUI' : '❌ NON'}`);
        
        // Vérifier si l'ID existe dans link_listings
        const { data: listingCheck } = await supabase
          .from('link_listings')
          .select('id')
          .eq('id', golfSite.id)
          .single();
        
        console.log(`   ID existe dans link_listings ? ${listingCheck ? '✅ OUI' : '❌ NON'}`);
        
        console.log('\n💡 DIAGNOSTIC:');
        console.log('   La contrainte exige que link_listing_id existe dans link_listings');
        console.log(`   Mais ${golfSite.id} est un website_id, pas un link_listing_id`);
        console.log('\n❓ QUESTION: Pourquoi ça fonctionne pour Leplombier mais pas golftradition.fr ?');
      }
      
      // Vérifier les permissions RLS
      console.log('\n🔒 VÉRIFICATION RLS:');
      console.log(`   Annonceur peut insérer ? Test...`);
      
    } else {
      console.log('\n✅ SUCCÈS POUR GOLFTRADITION.FR !');
      console.log(`   Demande créée: ${purchaseRequest.id}`);
      console.log(`   Status: ${purchaseRequest.status}`);
      console.log(`   link_listing_id: ${purchaseRequest.link_listing_id}`);
      
      console.log('\n✅ DONC ÇA FONCTIONNE ! Le problème vient d\'ailleurs.');
      console.log('   Peut-être un problème frontend ou de session ?');
      
      // Nettoyage
      console.log('\n🧹 Nettoyage...');
      await supabase
        .from('link_purchase_requests')
        .delete()
        .eq('id', purchaseRequest.id);
      console.log('   ✅ Demande de test supprimée');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

testGolftraditionSpecifically();

