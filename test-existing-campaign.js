// Test avec une campagne existante pour identifier le problème
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

async function testExistingCampaign() {
  console.log('🚀 Test avec une campagne existante\n');

  try {
    // 1. Récupérer une campagne existante
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .limit(1);

    if (campaignsError || !campaigns || campaigns.length === 0) {
      throw new Error('Aucune campagne trouvée');
    }

    const campaign = campaigns[0];
    console.log(`📊 Campagne trouvée: ${campaign.name} (${campaign.id})`);

    // 2. Récupérer des comptes existants
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(2);

    if (usersError || !users || users.length < 2) {
      throw new Error('Utilisateurs insuffisants');
    }

    const advertiser = users[0];
    const publisher = users[1];

    console.log(`👥 Utilisateurs:`);
    console.log(`   - Annonceur: ${advertiser.email}`);
    console.log(`   - Éditeur: ${publisher.email}`);

    // 3. Récupérer un listing existant
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('link_listings')
      .select('*')
      .limit(1);

    if (listingsError || !listings || listings.length === 0) {
      throw new Error('Aucun listing trouvé');
    }

    const listing = listings[0];
    console.log(`🔗 Listing trouvé: ${listing.title} (${listing.id})`);

    // 4. Essayer de créer une demande avec la campagne existante
    console.log('\n🧪 Test de création avec campagne existante...');

    const testRequestData = {
      link_listing_id: listing.id,
      user_id: advertiser.id,
      publisher_id: publisher.id,
      target_url: 'https://test.com',
      anchor_text: 'test',
      proposed_price: 100,
      proposed_duration: 1,
      status: 'pending',
      campaign_id: campaign.id
    };

    console.log('📝 Données de test:', testRequestData);

    const { data: testRequest, error: testRequestError } = await supabaseAdmin
      .from('link_purchase_requests')
      .insert([testRequestData])
      .select()
      .single();

    if (testRequestError) {
      console.log('❌ Erreur création demande test:', testRequestError.message);
      console.log('📝 Code:', testRequestError.code);
      console.log('📝 Détails:', testRequestError.details);
      console.log('💡 Suggestion:', testRequestError.hint);
    } else {
      console.log('✅ Demande créée avec succès !');
      console.log(`   - ID: ${testRequest.id}`);
      console.log(`   - Campaign ID: ${testRequest.campaign_id}`);
      
      // Nettoyer
      await supabaseAdmin
        .from('link_purchase_requests')
        .delete()
        .eq('id', testRequest.id);
      console.log('🧹 Demande de test nettoyée');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testExistingCampaign();
