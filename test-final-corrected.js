// Test final corrigé avec la bonne structure de base de données
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

// Fonction pour récupérer les comptes existants
async function getExistingAccounts() {
  console.log('👥 Récupération des comptes existants...');
  
  // Récupérer l'annonceur
  const { data: advertiser, error: advertiserError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'advertiser')
    .limit(1)
    .single();

  if (advertiserError) {
    throw new Error(`Erreur récupération annonceur: ${advertiserError.message}`);
  }

  // Récupérer l'éditeur
  const { data: publisher, error: publisherError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'publisher')
    .limit(1)
    .single();

  if (publisherError) {
    throw new Error(`Erreur récupération éditeur: ${publisherError.message}`);
  }

  console.log(`✅ Annonceur trouvé: ${advertiser.email}`);
  console.log(`✅ Éditeur trouvé: ${publisher.email}`);
  
  return { advertiser, publisher };
}

// Fonction pour créer un site web (structure correcte)
async function createWebsite(publisherId, uniqueId) {
  console.log('🌐 Création du site web...');
  
  const { data: website, error } = await supabaseAdmin
    .from('websites')
    .insert([{
      user_id: publisherId,
      title: `Site Tech ${uniqueId}`,
      description: `Site technologique de test ${uniqueId}`,
      url: `https://site-${uniqueId}.com`,
      category: 'tech',
      niche: 'tech',
      owner_status: 'professionnel',
      metrics: {
        domain_authority: 45,
        monthly_traffic: 15000,
        page_rank: 3
      },
      contact_info: {
        email: `contact@site-${uniqueId}.com`,
        phone: '+212600000000'
      },
      slug: `site-${uniqueId}`,
      status: 'active',
      available_link_spots: 5,
      content_quality: 'good'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création site: ${error.message}`);
  }

  console.log('✅ Site web créé');
  return website;
}

// Fonction pour créer un listing de lien (structure correcte)
async function createLinkListing(websiteId, publisherId, uniqueId) {
  console.log('🔗 Création du listing de lien...');
  
  const { data: linkListing, error } = await supabaseAdmin
    .from('link_listings')
    .insert([{
      website_id: websiteId,
      user_id: publisherId, // Utiliser l'ID de l'éditeur
      title: `Article Tech ${uniqueId}`,
      description: `Article sur les technologies innovantes ${uniqueId}`,
      target_url: `https://site-${uniqueId}.com/article-tech-${uniqueId}`,
      anchor_text: 'technologie innovante',
      link_type: 'dofollow',
      position: 'content',
      price: 250,
      currency: 'MAD',
      minimum_contract_duration: 1,
      max_links_per_page: 1,
      status: 'active',
      slug: `article-${uniqueId}`
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création listing: ${error.message}`);
  }

  console.log('✅ Listing de lien créé');
  return linkListing;
}

// Fonction pour créer une demande d'achat (sans campaign_id)
async function createPurchaseRequest(advertiserId, publisherId, linkListingId, uniqueId) {
  console.log('💳 Création de la demande d\'achat...');
  
  const { data: purchaseRequest, error } = await supabaseAdmin
    .from('link_purchase_requests')
    .insert([{
      link_listing_id: linkListingId,
      user_id: advertiserId,
      publisher_id: publisherId,
      target_url: `https://site-annonceur-${uniqueId}.com`,
      anchor_text: 'technologie innovante',
      message: `Demande d'achat de lien pour notre site tech ${uniqueId}`,
      proposed_price: 300,
      proposed_duration: 12,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création demande: ${error.message}`);
  }

  console.log('✅ Demande d\'achat créée');
  return purchaseRequest;
}

// Fonction pour accepter la demande
async function acceptPurchaseRequest(purchaseRequestId) {
  console.log('✅ Acceptation de la demande...');
  
  const { error } = await supabaseAdmin
    .from('link_purchase_requests')
    .update({
      status: 'accepted',
      editor_response: 'Demande acceptée avec plaisir !',
      response_date: new Date().toISOString(),
      placed_url: 'https://example.com/placed-link',
      placed_at: new Date().toISOString()
    })
    .eq('id', purchaseRequestId);

  if (error) {
    throw new Error(`Erreur acceptation: ${error.message}`);
  }

  console.log('✅ Demande acceptée');
}

// Fonction pour traiter le paiement
async function processPayment(purchaseRequestId, advertiserId, publisherId, amount) {
  console.log('💰 Traitement du paiement...');
  
  const { data, error } = await supabaseAdmin.rpc('process_link_purchase', {
    p_purchase_request_id: purchaseRequestId,
    p_advertiser_id: advertiserId,
    p_publisher_id: publisherId,
    p_amount: amount
  });

  if (error) {
    throw new Error(`Erreur traitement paiement: ${error.message}`);
  }

  if (data && !data.success) {
    throw new Error(`Erreur traitement paiement: ${data.message}`);
  }

  console.log('✅ Paiement traité');
}

// Fonction pour vérifier les soldes
async function checkBalances(advertiserId, publisherId) {
  console.log('💳 Vérification des soldes...');
  
  const { data: advertiser, error: advertiserError } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', advertiserId)
    .single();

  if (advertiserError) {
    throw new Error(`Erreur récupération solde annonceur: ${advertiserError.message}`);
  }

  const { data: publisher, error: publisherError } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', publisherId)
    .single();

  if (publisherError) {
    throw new Error(`Erreur récupération solde éditeur: ${publisherError.message}`);
  }

  console.log(`💰 Solde annonceur: ${advertiser.balance} MAD`);
  console.log(`💰 Solde éditeur: ${publisher.balance} MAD`);
  
  return { advertiser: advertiser.balance, publisher: publisher.balance };
}

// Test principal
async function testCompleteProcess() {
  console.log('🚀 Début du test final corrigé\n');
  
  try {
    // Étape 1: Récupérer les comptes existants
    const { advertiser, publisher } = await getExistingAccounts();
    const uniqueId = Math.random().toString(36).substring(2, 8);

    // Étape 2: Créer le site web
    const website = await createWebsite(publisher.id, uniqueId);

    // Étape 3: Créer le listing de lien
    const linkListing = await createLinkListing(website.id, publisher.id, uniqueId);

    // Étape 4: Créer la demande d'achat (sans campaign_id)
    const purchaseRequest = await createPurchaseRequest(
      advertiser.id, 
      publisher.id, 
      linkListing.id, 
      uniqueId
    );

    // Étape 5: Accepter la demande
    await acceptPurchaseRequest(purchaseRequest.id);

    // Étape 6: Traiter le paiement
    await processPayment(purchaseRequest.id, advertiser.id, publisher.id, 300);

    // Étape 7: Vérifier les soldes
    const balances = await checkBalances(advertiser.id, publisher.id);

    console.log('\n🎉 Test complet réussi !');
    console.log(`📊 Résultats:`);
    console.log(`   - Annonceur: ${balances.advertiser} MAD`);
    console.log(`   - Éditeur: ${balances.publisher} MAD`);
    console.log(`   - Demande ID: ${purchaseRequest.id}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('📝 Détails:', error);
  }
}

// Exécuter le test
testCompleteProcess();
