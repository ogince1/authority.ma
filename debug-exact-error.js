import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 TEST - Simuler la création de demande pour golftradition.fr');
console.log('='.repeat(80));

async function testPurchaseRequestCreation() {
  try {
    // 1. Récupérer les infos nécessaires
    const { data: website } = await supabase
      .from('websites')
      .select('id, title, user_id, new_article_price')
      .ilike('url', '%golftradition%')
      .single();

    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    console.log('\n📊 Données de test:');
    console.log(`   Site: ${website.title}`);
    console.log(`   Website ID: ${website.id}`);
    console.log(`   Publisher ID (user_id site): ${website.user_id}`);
    console.log(`   Prix: ${website.new_article_price} MAD`);
    console.log(`\n   Annonceur: ${advertiser.email}`);
    console.log(`   Annonceur ID: ${advertiser.id}`);

    // 2. Essayer de créer une demande comme le fait le panier
    console.log('\n🧪 TEST 1: Création avec website_id comme link_listing_id');
    console.log('-'.repeat(80));

    const requestData1 = {
      link_listing_id: website.id,  // ← C'est un website_id !
      user_id: advertiser.id,
      publisher_id: website.user_id,
      target_url: 'https://example.com/test',
      anchor_text: 'Test link',
      proposed_price: website.new_article_price,
      proposed_duration: 1,
      content_option: 'platform'
    };

    console.log('Données à insérer:', JSON.stringify(requestData1, null, 2));

    const { data: result1, error: error1 } = await supabase
      .from('link_purchase_requests')
      .insert([requestData1])
      .select()
      .single();

    if (error1) {
      console.log('\n❌ ERREUR ATTENDUE:');
      console.log(`   Code: ${error1.code}`);
      console.log(`   Message: ${error1.message}`);
      console.log(`   Détails: ${error1.details}`);
      console.log(`   Hint: ${error1.hint}`);
      
      if (error1.code === '23503') {
        console.log('\n🎯 DIAGNOSTIC:');
        console.log('   Erreur 23503 = FOREIGN KEY CONSTRAINT VIOLATION');
        console.log('   La contrainte link_purchase_requests_link_listing_id_fkey échoue');
        console.log('   Raison: website_id n\'existe pas dans link_listings');
        console.log('\n💡 SOLUTION NÉCESSAIRE:');
        console.log('   Créer d\'abord une annonce dans link_listings pour ce nouveau article');
      }
    } else {
      console.log('\n✅ Succès (inattendu):');
      console.log(`   Demande créée: ${result1.id}`);
    }

    // 3. Solution : Créer d'abord une annonce dans link_listings
    console.log('\n\n🧪 TEST 2: Créer d\'abord une annonce puis la demande');
    console.log('-'.repeat(80));

    // Créer l'annonce
    const listingData = {
      website_id: website.id,
      user_id: website.user_id,
      title: `Nouvel article sur ${website.title}`,
      description: 'Article personnalisé pour votre lien',
      target_url: 'https://example.com/test',
      anchor_text: 'Test',
      link_type: 'dofollow',
      position: 'content',
      price: website.new_article_price,
      currency: 'MAD',
      minimum_contract_duration: 1,
      status: 'active',
      slug: `nouveau-article-${Date.now()}`,
      images: [],
      tags: ['nouveau-article']
    };

    console.log('Création d\'une annonce dans link_listings...');
    
    const { data: createdListing, error: listingError } = await supabase
      .from('link_listings')
      .insert([listingData])
      .select()
      .single();

    if (listingError) {
      console.log('❌ Erreur création annonce:', listingError.message);
      return;
    }

    console.log(`✅ Annonce créée: ${createdListing.id}`);

    // Maintenant créer la demande avec le vrai link_listing_id
    const requestData2 = {
      link_listing_id: createdListing.id,  // ← Maintenant c'est un vrai link_listing_id
      user_id: advertiser.id,
      publisher_id: website.user_id,
      target_url: 'https://example.com/test',
      anchor_text: 'Test link',
      proposed_price: website.new_article_price,
      proposed_duration: 1,
      content_option: 'platform'
    };

    const { data: result2, error: error2 } = await supabase
      .from('link_purchase_requests')
      .insert([requestData2])
      .select()
      .single();

    if (error2) {
      console.log('\n❌ Erreur:', error2.message);
    } else {
      console.log('\n✅ SUCCÈS !');
      console.log(`   Demande créée: ${result2.id}`);
      console.log(`   Status: ${result2.status}`);
    }

    // Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    
    if (result2) {
      await supabase.from('link_purchase_requests').delete().eq('id', result2.id);
      console.log('   ✅ Demande de test supprimée');
    }
    
    if (createdListing) {
      await supabase.from('link_listings').delete().eq('id', createdListing.id);
      console.log('   ✅ Annonce de test supprimée');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 CONCLUSION:');
    console.log('='.repeat(80));
    console.log('Pour les NOUVEAUX ARTICLES, il faut:');
    console.log('1. Créer d\'abord une annonce dans link_listings');
    console.log('2. PUIS créer la demande avec ce link_listing_id');
    console.log('\nModification du code CartPage.tsx nécessaire !');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

testPurchaseRequestCreation();

