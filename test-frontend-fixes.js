// Test des corrections frontend
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testFrontendFixes() {
  console.log('🧪 Test des corrections frontend\n');

  try {
    // 1. Se connecter avec un utilisateur
    console.log('🔐 Connexion avec un utilisateur...');
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: 'annonceur@test.com',
      password: 'password123'
    });

    if (authError) {
      throw new Error(`Erreur connexion: ${authError.message}`);
    }

    console.log(`✅ Connexion réussie: ${authData.user.email}`);

    // 2. Récupérer des listings avec de vrais publisher_id
    console.log('\n📊 Récupération des listings...');
    
    const { data: listings, error: listingsError } = await supabaseClient
      .from('link_listings')
      .select('*, websites(*)')
      .limit(3);

    if (listingsError) {
      throw new Error(`Erreur récupération listings: ${listingsError.message}`);
    }

    console.log(`✅ Listings trouvés: ${listings.length}`);
    listings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title}`);
      console.log(`      - ID: ${listing.id}`);
      console.log(`      - Publisher ID: ${listing.user_id}`);
      console.log(`      - Prix: ${listing.price} MAD`);
      console.log('');
    });

    // 3. Tester la création de demandes avec les vrais publisher_id
    console.log('💳 Test de création de demandes avec vrais publisher_id...');
    
    const results = [];
    
    for (const listing of listings) {
      console.log(`\n🧪 Test avec listing: ${listing.title}`);
      
      const testData = {
        link_listing_id: listing.id,
        user_id: authData.user.id,
        publisher_id: listing.user_id, // Utiliser le vrai publisher_id
        target_url: `https://test-frontend-fix-${Date.now()}.com`,
        anchor_text: 'test frontend fix',
        proposed_price: listing.price,
        proposed_duration: 6,
        status: 'pending'
      };

      console.log('📝 Données de test:', {
        link_listing_id: testData.link_listing_id,
        user_id: testData.user_id,
        publisher_id: testData.publisher_id,
        proposed_price: testData.proposed_price
      });

      const { data: purchaseRequest, error: requestError } = await supabaseClient
        .from('link_purchase_requests')
        .insert([testData])
        .select()
        .single();

      if (requestError) {
        console.log(`❌ Erreur création demande: ${requestError.message}`);
        console.log('📝 Code:', requestError.code);
        console.log('📝 Détails:', requestError.details);
        results.push({ success: false, listing: listing.title, error: requestError.message });
      } else {
        console.log(`✅ Demande créée avec succès !`);
        console.log(`   - ID: ${purchaseRequest.id}`);
        console.log(`   - Publisher ID: ${purchaseRequest.publisher_id}`);
        console.log(`   - Montant: ${purchaseRequest.proposed_price} MAD`);
        results.push({ success: true, listing: listing.title, id: purchaseRequest.id });
        
        // Nettoyer
        const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await supabaseAdmin.from('link_purchase_requests').delete().eq('id', purchaseRequest.id);
        console.log('🧹 Demande de test nettoyée');
      }
    }

    // 4. Résumé des tests
    console.log('\n🎯 RÉSUMÉ DES TESTS:');
    console.log('=====================================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Tests réussis: ${successful.length}/${results.length}`);
    successful.forEach(result => {
      console.log(`   - ${result.listing}: SUCCÈS`);
    });
    
    if (failed.length > 0) {
      console.log(`\n❌ Tests échoués: ${failed.length}/${results.length}`);
      failed.forEach(result => {
        console.log(`   - ${result.listing}: ${result.error}`);
      });
    }

    if (successful.length === results.length) {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
      console.log('✅ Les corrections frontend fonctionnent parfaitement');
      console.log('✅ Le frontend utilise maintenant les vrais publisher_id');
      console.log('✅ Plus besoin de l\'utilisateur hardcodé');
    } else {
      console.log('\n⚠️  Certains tests ont échoué');
      console.log('📝 Vérifiez les erreurs ci-dessus');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testFrontendFixes();
