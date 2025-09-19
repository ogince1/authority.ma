// Test champ par champ pour identifier le problème
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

async function testFieldByField() {
  console.log('�� Test champ par champ pour identifier le problème\n');

  try {
    // 1. Récupérer des données existantes
    const { data: campaigns } = await supabaseAdmin.from('campaigns').select('*').limit(1);
    const { data: users } = await supabaseAdmin.from('users').select('*').limit(2);
    const { data: listings } = await supabaseAdmin.from('link_listings').select('*').limit(1);

    const campaign = campaigns[0];
    const advertiser = users[0];
    const publisher = users[1];
    const listing = listings[0];

    console.log('📋 Test 1: Demande SANS campaign_id...');
    
    // Test 1: Sans campaign_id (qui fonctionnait avant)
    const { data: request1, error: error1 } = await supabaseAdmin
      .from('link_purchase_requests')
      .insert([{
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test.com',
        anchor_text: 'test',
        proposed_price: 100,
        proposed_duration: 1,
        status: 'pending'
        // Pas de campaign_id
      }])
      .select()
      .single();

    if (error1) {
      console.log('❌ Erreur sans campaign_id:', error1.message);
    } else {
      console.log('✅ Sans campaign_id: SUCCÈS');
      await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request1.id);
    }

    console.log('\n�� Test 2: Demande avec campaign_id NULL...');
    
    // Test 2: Avec campaign_id explicitement NULL
    const { data: request2, error: error2 } = await supabaseAdmin
      .from('link_purchase_requests')
      .insert([{
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test.com',
        anchor_text: 'test',
        proposed_price: 100,
        proposed_duration: 1,
        status: 'pending',
        campaign_id: null
      }])
      .select()
      .single();

    if (error2) {
      console.log('❌ Erreur avec campaign_id NULL:', error2.message);
    } else {
      console.log('✅ Avec campaign_id NULL: SUCCÈS');
      await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request2.id);
    }

    console.log('\n📋 Test 3: Demande avec campaign_id valide...');
    
    // Test 3: Avec campaign_id valide
    const { data: request3, error: error3 } = await supabaseAdmin
      .from('link_purchase_requests')
      .insert([{
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test.com',
        anchor_text: 'test',
        proposed_price: 100,
        proposed_duration: 1,
        status: 'pending',
        campaign_id: campaign.id
      }])
      .select()
      .single();

    if (error3) {
      console.log('❌ Erreur avec campaign_id valide:', error3.message);
      console.log('📝 Code:', error3.code);
      console.log('📝 Détails:', error3.details);
    } else {
      console.log('✅ Avec campaign_id valide: SUCCÈS');
      console.log(`   - Campaign ID dans la demande: ${request3.campaign_id}`);
      console.log(`   - Match avec campagne: ${request3.campaign_id === campaign.id ? '✅' : '❌'}`);
      await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request3.id);
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log(`   - Sans campaign_id: ${error1 ? '❌' : '✅'}`);
    console.log(`   - Avec campaign_id NULL: ${error2 ? '❌' : '✅'}`);
    console.log(`   - Avec campaign_id valide: ${error3 ? '❌' : '✅'}`);

    if (error3) {
      console.log('\n💡 Le problème se produit uniquement quand campaign_id est défini.');
      console.log('   Cela suggère que le trigger update_campaign_status() cause le problème.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testFieldByField();
