// Test de débogage pour identifier le champ problématique
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

async function testCampaignDebug() {
  console.log('🚀 Test de débogage pour identifier le champ problématique\n');

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

    // 2. Créer une campagne
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

    // 3. Créer un site web et listing
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

    // 4. Test avec des valeurs très courtes
    console.log('🧪 Test avec des valeurs très courtes...');
    
    const { data: requestWithCampaign, error: requestWithError } = await supabaseAdmin
      .from('link_purchase_requests')
      .insert([{
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test.com',
        anchor_text: 'test',
        proposed_price: 350,
        proposed_duration: 12,
        status: 'pending', // 7 caractères
        campaign_id: campaign.id
      }])
      .select()
      .single();

    if (requestWithError) {
      console.log('❌ Erreur création demande avec campagne:', requestWithError.message);
      console.log('📝 Détails:', requestWithError.details);
      console.log('💡 Suggestion:', requestWithError.hint);
    } else {
      console.log('✅ Demande créée avec campagne !');
      console.log(`   - ID: ${requestWithCampaign.id}`);
      console.log(`   - Campaign ID: ${requestWithCampaign.campaign_id}`);
      console.log(`   - Lien correct: ${requestWithCampaign.campaign_id === campaign.id ? '✅' : '❌'}`);
    }

    // 5. Nettoyer
    if (requestWithCampaign) {
      await supabaseAdmin.from('link_purchase_requests').delete().eq('id', requestWithCampaign.id);
    }
    await supabaseAdmin.from('link_listings').delete().eq('id', listing.id);
    await supabaseAdmin.from('websites').delete().eq('id', website.id);
    await supabaseAdmin.from('campaigns').delete().eq('id', campaign.id);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testCampaignDebug();
