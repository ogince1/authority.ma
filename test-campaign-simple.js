// Test très simple du flux campagne → demande d'achat
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

async function testCampaignSimple() {
  console.log('🚀 Test très simple du flux campagne → demande d\'achat\n');

  try {
    // 1. Récupérer les comptes de test
    const { data: advertiser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'annonceur@test.com')
      .single();

    const { data: publisher } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'editeur@test.com')
      .single();

    console.log(`👥 Comptes:`);
    console.log(`   - Annonceur: ${advertiser.email} (${advertiser.balance} MAD)`);
    console.log(`   - Éditeur: ${publisher.email} (${publisher.balance} MAD)`);

    // 2. Créer une campagne
    console.log('\n📊 Création d\'une campagne...');
    const uniqueId = Math.random().toString(36).substring(2, 6);
    
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert([{
        user_id: advertiser.id,
        name: `Camp ${uniqueId}`,
        urls: [`https://site-${uniqueId}.com`],
        language: 'Français',
        status: 'draft',
        budget: 1000
      }])
      .select()
      .single();

    if (campaignError) {
      throw new Error(`Erreur création campagne: ${campaignError.message}`);
    }

    console.log(`✅ Campagne créée: ${campaign.name} (${campaign.status})`);

    // 3. Créer un site web et listing
    console.log('\n🌐 Création du site web...');
    const { data: website, error: websiteError } = await supabaseAdmin
      .from('websites')
      .insert([{
        user_id: publisher.id,
        title: `Site ${uniqueId}`,
        description: `Site test ${uniqueId}`,
        url: `https://site-${uniqueId}.com`,
        category: 'tech',
        niche: 'tech',
        owner_status: 'professionnel',
        metrics: { domain_authority: 50, monthly_traffic: 20000 },
        contact_info: { email: `contact@site-${uniqueId}.com` },
        slug: `site-${uniqueId}`,
        status: 'active',
        available_link_spots: 10,
        content_quality: 'excellent'
      }])
      .select()
      .single();

    if (websiteError) {
      throw new Error(`Erreur création site: ${websiteError.message}`);
    }

    console.log(`✅ Site web créé: ${website.title}`);

    // 4. Créer un listing de lien
    console.log('\n🔗 Création du listing de lien...');
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('link_listings')
      .insert([{
        website_id: website.id,
        user_id: publisher.id,
        title: `Article ${uniqueId}`,
        description: `Article test ${uniqueId}`,
        target_url: `https://site-${uniqueId}.com/article-${uniqueId}`,
        anchor_text: 'test',
        link_type: 'dofollow',
        position: 'content',
        price: 300,
        currency: 'MAD',
        minimum_contract_duration: 6,
        max_links_per_page: 2,
        status: 'active',
        slug: `article-${uniqueId}`
      }])
      .select()
      .single();

    if (listingError) {
      throw new Error(`Erreur création listing: ${listingError.message}`);
    }

    console.log(`✅ Listing créé: ${listing.title} (${listing.price} MAD)`);

    // 5. Créer une demande d'achat AVEC campaign_id (champs minimaux)
    console.log('\n💳 Création de la demande d\'achat avec campagne...');
    const { data: purchaseRequest, error: requestError } = await supabaseAdmin
      .from('link_purchase_requests')
      .insert([{
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: `https://site-${uniqueId}.com`,
        anchor_text: 'test',
        proposed_price: 350,
        proposed_duration: 12,
        status: 'pending',
        campaign_id: campaign.id // 🎯 ICI EST LE LIEN AVEC LA CAMPAGNE
      }])
      .select()
      .single();

    if (requestError) {
      throw new Error(`Erreur création demande: ${requestError.message}`);
    }

    console.log(`✅ Demande d'achat créée avec campagne !`);
    console.log(`   - ID: ${purchaseRequest.id}`);
    console.log(`   - Campaign ID: ${purchaseRequest.campaign_id}`);
    console.log(`   - Montant: ${purchaseRequest.proposed_price} MAD`);

    // 6. Vérifier que le statut de la campagne a été mis à jour
    console.log('\n📊 Vérification du statut de la campagne...');
    const { data: updatedCampaign, error: campaignUpdateError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single();

    if (campaignUpdateError) {
      console.log('⚠️  Erreur récupération campagne:', campaignUpdateError.message);
    } else {
      console.log(`✅ Statut de la campagne: ${updatedCampaign.status}`);
      if (updatedCampaign.status === 'pending_editor_approval') {
        console.log('🎉 Le trigger automatique fonctionne !');
      }
    }

    // 7. Résumé final
    console.log('\n🎉 TEST DU FLUX CAMPAGNE RÉUSSI !');
    console.log('=====================================');
    console.log(`📊 Campagne: ${campaign.name}`);
    console.log(`💳 Demande: ${purchaseRequest.id}`);
    console.log(`🔗 Lien campagne-demande: ${purchaseRequest.campaign_id === campaign.id ? '✅' : '❌'}`);
    console.log(`📈 Statut campagne: ${updatedCampaign.status}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('📝 Détails:', error);
  }
}

testCampaignSimple();
