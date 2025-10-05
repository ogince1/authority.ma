import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 TEST RÉEL - Simuler achat nouveau article qui FONCTIONNE');
console.log('='.repeat(80));
console.log('Annonceur: abderrahimmolatefpro@gmail.com');
console.log('Éditeur: ogincema@gmail.com');
console.log('='.repeat(80));

async function testRealPurchaseFlow() {
  try {
    // 1. Récupérer les utilisateurs
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'ogincema@gmail.com')
      .single();

    console.log('\n👥 UTILISATEURS:');
    console.log(`   Annonceur: ${advertiser.name} (${advertiser.email})`);
    console.log(`   ID: ${advertiser.id}`);
    console.log(`\n   Éditeur: ${publisher.name} (${publisher.email})`);
    console.log(`   ID: ${publisher.id}`);

    // 2. Prendre un site de ogincema (qui fonctionne)
    const { data: workingSite } = await supabase
      .from('websites')
      .select('id, title, url, user_id, new_article_price, status, is_new_article')
      .eq('user_id', publisher.id)
      .eq('status', 'active')
      .eq('is_new_article', true)
      .limit(1)
      .single();

    console.log('\n🌐 SITE DE TEST (qui fonctionne):');
    console.log(`   Site: ${workingSite.title}`);
    console.log(`   ID: ${workingSite.id}`);
    console.log(`   Prix nouveau article: ${workingSite.new_article_price} MAD`);
    console.log(`   Status: ${workingSite.status}`);
    console.log(`   Accepte nouveaux articles: ${workingSite.is_new_article}`);
    console.log(`   user_id: ${workingSite.user_id}`);

    // 3. Vérifier s'il y a des annonces dans link_listings pour ce site
    const { data: existingListings } = await supabase
      .from('link_listings')
      .select('id, title, status')
      .eq('website_id', workingSite.id);

    console.log(`\n🔗 Annonces dans link_listings pour ce site: ${existingListings?.length || 0}`);
    if (existingListings && existingListings.length > 0) {
      existingListings.forEach((l, i) => {
        console.log(`   ${i + 1}. ${l.title} (${l.status})`);
      });
    }

    // 4. SIMULATION : Créer une demande de NOUVEAU ARTICLE comme le panier
    console.log('\n🧪 TEST: Créer une demande de NOUVEAU ARTICLE');
    console.log('-'.repeat(80));
    console.log('Simulation de ce que fait CartPage.tsx:');
    console.log(`   isVirtual: true`);
    console.log(`   website_id: ${workingSite.id}`);
    console.log(`   listingId utilisé: ${workingSite.id} (website_id directement)`);

    const requestData = {
      link_listing_id: workingSite.id,  // ← website_id directement !
      user_id: advertiser.id,
      publisher_id: publisher.id,
      target_url: 'https://example-test.com/mon-article',
      anchor_text: 'Test nouveau article qui fonctionne',
      proposed_price: workingSite.new_article_price,
      proposed_duration: 1,
      content_option: 'platform',
      status: 'pending'
    };

    console.log('\nDonnées à insérer:');
    console.log(JSON.stringify(requestData, null, 2));

    console.log('\n⏳ Tentative d\'insertion...');
    
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert([requestData])
      .select()
      .single();

    if (requestError) {
      console.log('\n❌ ERREUR:');
      console.log(`   Code: ${requestError.code}`);
      console.log(`   Message: ${requestError.message}`);
      console.log(`   Détails: ${requestError.details || 'N/A'}`);
      
      if (requestError.code === '23503') {
        console.log('\n🎯 DIAGNOSTIC:');
        console.log('   ERREUR 23503 = Foreign key constraint violation');
        console.log('   La clé link_listing_id doit référencer link_listings.id');
        console.log(`   Mais on passe: ${workingSite.id} qui est un website_id`);
        console.log('\n💡 QUESTION:');
        console.log('   Comment les sites de ogincema fonctionnent alors ?');
        console.log('   Il y a peut-être une RPC function ou un trigger qui gère ça ?');
      }
    } else {
      console.log('\n✅ SUCCÈS !');
      console.log(`   Demande créée: ${purchaseRequest.id}`);
      console.log(`   Status: ${purchaseRequest.status}`);
      console.log(`   link_listing_id: ${purchaseRequest.link_listing_id}`);
      
      // Nettoyage
      console.log('\n🧹 Nettoyage de la demande de test...');
      await supabase
        .from('link_purchase_requests')
        .delete()
        .eq('id', purchaseRequest.id);
      console.log('   ✅ Demande de test supprimée');
    }

    // 5. Analyser une demande réussie existante pour comprendre
    console.log('\n\n🔍 ANALYSE D\'UNE DEMANDE RÉUSSIE EXISTANTE:');
    console.log('-'.repeat(80));

    const { data: successfulRequests } = await supabase
      .from('link_purchase_requests')
      .select(`
        id, 
        link_listing_id, 
        user_id, 
        publisher_id, 
        status,
        anchor_text,
        content_option,
        created_at
      `)
      .eq('user_id', advertiser.id)
      .eq('publisher_id', publisher.id)
      .limit(5);

    if (successfulRequests && successfulRequests.length > 0) {
      console.log(`\n✅ Demandes existantes trouvées: ${successfulRequests.length}`);
      
      for (const req of successfulRequests) {
        console.log(`\n   Demande #${req.id.slice(0, 8)}`);
        console.log(`   └─ link_listing_id: ${req.link_listing_id}`);
        console.log(`   └─ Status: ${req.status}`);
        console.log(`   └─ Content option: ${req.content_option || 'N/A'}`);
        
        // Vérifier si c'est un website_id ou link_listing_id
        const { data: asWebsite } = await supabase
          .from('websites')
          .select('id, title')
          .eq('id', req.link_listing_id)
          .single();

        const { data: asListing } = await supabase
          .from('link_listings')
          .select('id, title')
          .eq('id', req.link_listing_id)
          .single();

        if (asWebsite) {
          console.log(`   └─ Type: NOUVEAU ARTICLE (website_id) ✨`);
          console.log(`   └─ Site: ${asWebsite.title}`);
        } else if (asListing) {
          console.log(`   └─ Type: Article existant (link_listing_id)`);
          console.log(`   └─ Annonce: ${asListing.title}`);
        } else {
          console.log(`   └─ Type: INCONNU (ID non trouvé)`);
        }
      }
    } else {
      console.log('   Aucune demande trouvée entre ces deux utilisateurs');
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 CONCLUSION À DÉTERMINER:');
    console.log('='.repeat(80));
    console.log('1. Est-ce que les demandes existantes utilisent website_id ou link_listing_id ?');
    console.log('2. Y a-t-il une contrainte désactivée pour les nouveaux articles ?');
    console.log('3. Le problème vient-il d\'ailleurs ?');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

testRealPurchaseFlow();

