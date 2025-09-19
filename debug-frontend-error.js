// Script de diagnostic pour l'erreur 409 du frontend
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugFrontendError() {
  console.log('🔍 Diagnostic de l\'erreur 409 du frontend\n');

  try {
    // 1. Vérifier les données existantes
    console.log('📊 1. Vérification des données existantes...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Erreur récupération utilisateurs:', usersError.message);
    } else {
      console.log(`✅ Utilisateurs trouvés: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Solde: ${user.balance} MAD`);
      });
    }

    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .limit(3);
    
    if (campaignsError) {
      console.log('❌ Erreur récupération campagnes:', campaignsError.message);
    } else {
      console.log(`✅ Campagnes trouvées: ${campaigns.length}`);
      campaigns.forEach(campaign => {
        console.log(`   - ${campaign.name} (${campaign.status})`);
      });
    }

    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('link_listings')
      .select('*')
      .limit(3);
    
    if (listingsError) {
      console.log('❌ Erreur récupération listings:', listingsError.message);
    } else {
      console.log(`✅ Listings trouvés: ${listings.length}`);
      listings.forEach(listing => {
        console.log(`   - ${listing.title} (${listing.price} MAD)`);
      });
    }

    // 2. Tester la création d'une demande avec les données existantes
    console.log('\n🧪 2. Test de création avec données existantes...');
    
    if (users && users.length >= 2 && listings && listings.length > 0) {
      const advertiser = users.find(u => u.role === 'advertiser') || users[0];
      const publisher = users.find(u => u.role === 'publisher') || users[1];
      const listing = listings[0];
      const campaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

      console.log(`🧪 Test avec:`);
      console.log(`   - Annonceur: ${advertiser.email} (${advertiser.balance} MAD)`);
      console.log(`   - Éditeur: ${publisher.email} (${publisher.balance} MAD)`);
      console.log(`   - Listing: ${listing.title} (${listing.price} MAD)`);
      console.log(`   - Campagne: ${campaign ? campaign.name : 'Aucune'}`);

      // Test 1: Sans campaign_id
      console.log('\n📋 Test 1: Création sans campaign_id...');
      const testData1 = {
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-frontend.com',
        anchor_text: 'test frontend',
        proposed_price: 200,
        proposed_duration: 6,
        status: 'pending'
      };

      const { data: request1, error: error1 } = await supabaseAdmin
        .from('link_purchase_requests')
        .insert([testData1])
        .select()
        .single();

      if (error1) {
        console.log('❌ Erreur Test 1:', error1.message);
        console.log('📝 Code:', error1.code);
        console.log('📝 Détails:', error1.details);
        console.log('💡 Suggestion:', error1.hint);
      } else {
        console.log('✅ Test 1: SUCCÈS');
        console.log(`   - ID: ${request1.id}`);
        await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request1.id);
      }

      // Test 2: Avec campaign_id
      if (campaign) {
        console.log('\n📋 Test 2: Création avec campaign_id...');
        const testData2 = {
          ...testData1,
          campaign_id: campaign.id,
          target_url: 'https://test-frontend-campaign.com'
        };

        const { data: request2, error: error2 } = await supabaseAdmin
          .from('link_purchase_requests')
          .insert([testData2])
          .select()
          .single();

        if (error2) {
          console.log('❌ Erreur Test 2:', error2.message);
          console.log('📝 Code:', error2.code);
          console.log('📝 Détails:', error2.details);
          console.log('💡 Suggestion:', error2.hint);
        } else {
          console.log('✅ Test 2: SUCCÈS');
          console.log(`   - ID: ${request2.id}`);
          console.log(`   - Campaign ID: ${request2.campaign_id}`);
          await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request2.id);
        }
      }

      // Test 3: Vérifier les contraintes RLS
      console.log('\n📋 Test 3: Vérification des contraintes...');
      
      // Vérifier si l'annonceur peut créer une demande pour ce listing
      const { data: listingCheck, error: listingCheckError } = await supabaseAdmin
        .from('link_listings')
        .select('*, websites(*)')
        .eq('id', listing.id)
        .single();

      if (listingCheckError) {
        console.log('❌ Erreur vérification listing:', listingCheckError.message);
      } else {
        console.log('✅ Listing vérifié:');
        console.log(`   - Propriétaire: ${listingCheck.user_id}`);
        console.log(`   - Site: ${listingCheck.websites?.title}`);
        console.log(`   - Statut: ${listingCheck.status}`);
      }

      // Test 4: Vérifier les politiques RLS
      console.log('\n📋 Test 4: Test avec client normal (pas admin)...');
      
      const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
      
      // Simuler une connexion utilisateur
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: advertiser.email,
        password: 'password123' // Mot de passe par défaut
      });

      if (authError) {
        console.log('⚠️  Impossible de se connecter avec le client normal:', authError.message);
        console.log('   Cela peut expliquer l\'erreur 409 si c\'est un problème d\'authentification');
      } else {
        console.log('✅ Connexion réussie avec le client normal');
        
        // Tester la création avec le client normal
        const { data: request3, error: error3 } = await supabaseClient
          .from('link_purchase_requests')
          .insert([{
            link_listing_id: listing.id,
            user_id: advertiser.id,
            publisher_id: publisher.id,
            target_url: 'https://test-client-normal.com',
            anchor_text: 'test client normal',
            proposed_price: 150,
            proposed_duration: 3,
            status: 'pending'
          }])
          .select()
          .single();

        if (error3) {
          console.log('❌ Erreur avec client normal:', error3.message);
          console.log('📝 Code:', error3.code);
          console.log('📝 Détails:', error3.details);
        } else {
          console.log('✅ Client normal: SUCCÈS');
          await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request3.id);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

debugFrontendError();
