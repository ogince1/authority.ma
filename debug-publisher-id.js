// Script pour diagnostiquer le problème de publisher_id
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

async function debugPublisherId() {
  console.log('🔍 Diagnostic du problème de publisher_id\n');

  try {
    // 1. Vérifier tous les utilisateurs
    console.log('📊 1. Vérification des utilisateurs...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    console.log(`✅ Utilisateurs trouvés: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.id}: ${user.email} (${user.role})`);
    });

    // 2. Vérifier tous les link_listings
    console.log('\n📊 2. Vérification des link_listings...');
    
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('link_listings')
      .select('id, title, user_id, websites(title)');

    if (listingsError) {
      throw new Error(`Erreur récupération listings: ${listingsError.message}`);
    }

    console.log(`✅ Listings trouvés: ${listings.length}`);
    listings.forEach(listing => {
      const user = users.find(u => u.id === listing.user_id);
      console.log(`   - ${listing.id}: ${listing.title}`);
      console.log(`     Publisher ID: ${listing.user_id}`);
      console.log(`     Publisher Email: ${user ? user.email : '❌ UTILISATEUR NON TROUVÉ'}`);
      console.log(`     Site: ${listing.websites?.title || 'N/A'}`);
      console.log('');
    });

    // 3. Identifier les listings avec des publisher_id invalides
    console.log('📊 3. Identification des listings avec publisher_id invalides...');
    
    const invalidListings = listings.filter(listing => {
      const user = users.find(u => u.id === listing.user_id);
      return !user;
    });

    if (invalidListings.length > 0) {
      console.log(`❌ Listings avec publisher_id invalides: ${invalidListings.length}`);
      invalidListings.forEach(listing => {
        console.log(`   - ${listing.id}: ${listing.title}`);
        console.log(`     Publisher ID invalide: ${listing.user_id}`);
      });

      // 4. Corriger les listings avec des publisher_id invalides
      console.log('\n🔧 4. Correction des listings avec publisher_id invalides...');
      
      const validPublisher = users.find(u => u.role === 'publisher');
      if (validPublisher) {
        console.log(`✅ Utilisation de l'éditeur valide: ${validPublisher.email} (${validPublisher.id})`);
        
        for (const listing of invalidListings) {
          const { error: updateError } = await supabaseAdmin
            .from('link_listings')
            .update({ user_id: validPublisher.id })
            .eq('id', listing.id);

          if (updateError) {
            console.log(`❌ Erreur correction ${listing.id}:`, updateError.message);
          } else {
            console.log(`✅ Listing ${listing.id} corrigé`);
          }
        }
      } else {
        console.log('❌ Aucun éditeur valide trouvé');
      }
    } else {
      console.log('✅ Tous les listings ont des publisher_id valides');
    }

    // 5. Tester la création d'une demande avec un listing corrigé
    console.log('\n🧪 5. Test de création de demande avec listing corrigé...');
    
    const testListing = listings[0];
    const testAdvertiser = users.find(u => u.role === 'advertiser');
    const testPublisher = users.find(u => u.id === testListing.user_id);

    if (testAdvertiser && testPublisher) {
      console.log(`🧪 Test avec:`);
      console.log(`   - Annonceur: ${testAdvertiser.email} (${testAdvertiser.id})`);
      console.log(`   - Éditeur: ${testPublisher.email} (${testPublisher.id})`);
      console.log(`   - Listing: ${testListing.title} (${testListing.id})`);

      const testData = {
        link_listing_id: testListing.id,
        user_id: testAdvertiser.id,
        publisher_id: testPublisher.id,
        target_url: 'https://test-publisher-fix.com',
        anchor_text: 'test publisher fix',
        proposed_price: 100,
        proposed_duration: 6,
        status: 'pending'
      };

      const { data: request, error: requestError } = await supabaseAdmin
        .from('link_purchase_requests')
        .insert([testData])
        .select()
        .single();

      if (requestError) {
        console.log('❌ Erreur création demande:', requestError.message);
        console.log('📝 Code:', requestError.code);
        console.log('📝 Détails:', requestError.details);
      } else {
        console.log('✅ Demande créée avec succès !');
        console.log(`   - ID: ${request.id}`);
        console.log(`   - Publisher ID: ${request.publisher_id}`);
        
        // Nettoyer
        await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request.id);
        console.log('�� Demande de test nettoyée');
      }
    }

    console.log('\n🎉 Diagnostic terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

debugPublisherId();
