// Test avec les comptes de test existants
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

// Fonction pour récupérer les comptes de test existants
async function getExistingTestAccounts() {
  console.log('👥 Récupération des comptes de test existants...');
  
  // Récupérer l'annonceur de test
  const { data: advertiser, error: advertiserError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', 'annonceur@test.com')
    .single();

  if (advertiserError) {
    throw new Error(`Erreur récupération annonceur test: ${advertiserError.message}`);
  }

  // Récupérer l'éditeur de test
  const { data: publisher, error: publisherError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', 'editeur@test.com')
    .single();

  if (publisherError) {
    throw new Error(`Erreur récupération éditeur test: ${publisherError.message}`);
  }

  console.log(`✅ Annonceur test: ${advertiser.email} (${advertiser.balance} MAD)`);
  console.log(`✅ Éditeur test: ${publisher.email} (${publisher.balance} MAD)`);
  
  return { advertiser, publisher };
}

// Fonction pour créer un site web
async function createWebsite(publisherId, uniqueId) {
  console.log('🌐 Création du site web...');
  
  const { data: website, error } = await supabaseAdmin
    .from('websites')
    .insert([{
      user_id: publisherId,
      title: `Site Tech Test ${uniqueId}`,
      description: `Site technologique de test ${uniqueId} - Contenu de haute qualité`,
      url: `https://site-test-${uniqueId}.com`,
      category: 'tech',
      niche: 'tech',
      owner_status: 'professionnel',
      metrics: {
        domain_authority: 55,
        monthly_traffic: 25000,
        page_rank: 4,
        backlinks: 1500
      },
      contact_info: {
        email: `contact@site-test-${uniqueId}.com`,
        phone: '+212600000000',
        website: `https://site-test-${uniqueId}.com`
      },
      slug: `site-test-${uniqueId}`,
      status: 'active',
      available_link_spots: 15,
      content_quality: 'excellent',
      languages: ['Français', 'Anglais'],
      payment_methods: ['Virement bancaire', 'PayPal']
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création site: ${error.message}`);
  }

  console.log('✅ Site web créé');
  return website;
}

// Fonction pour créer un listing de lien
async function createLinkListing(websiteId, publisherId, uniqueId) {
  console.log('🔗 Création du listing de lien...');
  
  const { data: linkListing, error } = await supabaseAdmin
    .from('link_listings')
    .insert([{
      website_id: websiteId,
      user_id: publisherId,
      title: `Article Tech Premium ${uniqueId}`,
      description: `Article de haute qualité sur les technologies innovantes ${uniqueId}. Contenu original et bien documenté.`,
      target_url: `https://site-test-${uniqueId}.com/article-tech-premium-${uniqueId}`,
      anchor_text: 'technologie innovante',
      link_type: 'dofollow',
      position: 'content',
      price: 450,
      currency: 'MAD',
      minimum_contract_duration: 12,
      max_links_per_page: 3,
      allowed_niches: ['tech', 'business', 'innovation'],
      forbidden_keywords: ['casino', 'porn', 'gambling'],
      content_requirements: 'Contenu de qualité, original, bien documenté',
      status: 'active',
      slug: `article-test-premium-${uniqueId}`,
      tags: ['technologie', 'innovation', 'business', 'startup']
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création listing: ${error.message}`);
  }

  console.log('✅ Listing de lien créé');
  return linkListing;
}

// Fonction pour créer une demande d'achat
async function createPurchaseRequest(advertiserId, publisherId, linkListingId, uniqueId) {
  console.log('💳 Création de la demande d\'achat...');
  
  const { data: purchaseRequest, error } = await supabaseAdmin
    .from('link_purchase_requests')
    .insert([{
      link_listing_id: linkListingId,
      user_id: advertiserId,
      publisher_id: publisherId,
      target_url: `https://site-annonceur-test-${uniqueId}.com`,
      anchor_text: 'technologie innovante',
      message: `Bonjour ! Nous sommes une startup tech et nous aimerions acheter un lien sur votre excellent article. Notre site propose des solutions innovantes dans le domaine de la technologie. Nous nous engageons à fournir un contenu de qualité et respecter vos guidelines. Merci de considérer notre demande !`,
      proposed_price: 500,
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
      editor_response: 'Excellente demande ! Nous acceptons avec plaisir. Votre contenu semble de qualité et correspond parfaitement à notre audience. Le lien sera placé dans notre article principal sur les technologies innovantes.',
      response_date: new Date().toISOString(),
      placed_url: 'https://site-test.com/article-technologies-innovantes',
      placed_at: new Date().toISOString()
    })
    .eq('id', purchaseRequestId);

  if (error) {
    throw new Error(`Erreur acceptation: ${error.message}`);
  }

  console.log('✅ Demande acceptée');
}

// Fonction pour traiter le paiement manuellement
async function processPaymentManually(purchaseRequestId, advertiserId, publisherId, linkListingId, amount) {
  console.log('💰 Traitement manuel du paiement...');
  
  try {
    // Calculer les montants
    const platformFee = amount * 0.10; // 10% de commission
    const publisherAmount = amount - platformFee;
    
    // Récupérer les soldes actuels
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

    console.log(`💰 Solde annonceur avant: ${advertiser.balance} MAD`);
    console.log(`💰 Solde éditeur avant: ${publisher.balance} MAD`);

    // Vérifier le solde de l'annonceur
    if (advertiser.balance < amount) {
      throw new Error(`Solde insuffisant pour l'annonceur (${advertiser.balance} < ${amount})`);
    }

    // Créer la transaction d'achat
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('link_purchase_transactions')
      .insert([{
        purchase_request_id: purchaseRequestId,
        advertiser_id: advertiserId,
        publisher_id: publisherId,
        link_listing_id: linkListingId,
        amount: amount,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Erreur création transaction: ${transactionError.message}`);
    }

    // Débiter l'annonceur
    const { error: debitError } = await supabaseAdmin
      .from('users')
      .update({ balance: advertiser.balance - amount })
      .eq('id', advertiserId);

    if (debitError) {
      throw new Error(`Erreur débit annonceur: ${debitError.message}`);
    }

    // Créditer l'éditeur
    const { error: creditError } = await supabaseAdmin
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', publisherId);

    if (creditError) {
      throw new Error(`Erreur crédit éditeur: ${creditError.message}`);
    }

    console.log('✅ Paiement traité manuellement');
    console.log(`💰 Montant: ${amount} MAD`);
    console.log(`💰 Commission plateforme: ${platformFee} MAD`);
    console.log(`💰 Montant éditeur: ${publisherAmount} MAD`);
    
    return transaction;

  } catch (error) {
    throw new Error(`Erreur traitement paiement: ${error.message}`);
  }
}

// Fonction pour vérifier les soldes
async function checkBalances(advertiserId, publisherId) {
  console.log('💳 Vérification des soldes finaux...');
  
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

  console.log(`💰 Solde annonceur final: ${advertiser.balance} MAD`);
  console.log(`💰 Solde éditeur final: ${publisher.balance} MAD`);
  
  return { advertiser: advertiser.balance, publisher: publisher.balance };
}

// Test principal
async function testWithExistingTestAccounts() {
  console.log('🚀 Début du test avec les comptes de test existants\n');
  
  try {
    // Étape 1: Récupérer les comptes de test existants
    const { advertiser, publisher } = await getExistingTestAccounts();
    const uniqueId = Math.random().toString(36).substring(2, 8);

    console.log(`\n📋 Informations des comptes:`);
    console.log(`   - Annonceur: ${advertiser.email} (${advertiser.balance} MAD)`);
    console.log(`   - Éditeur: ${publisher.email} (${publisher.balance} MAD)`);

    // Étape 2: Créer le site web
    const website = await createWebsite(publisher.id, uniqueId);

    // Étape 3: Créer le listing de lien
    const linkListing = await createLinkListing(website.id, publisher.id, uniqueId);

    // Étape 4: Créer la demande d'achat
    const purchaseRequest = await createPurchaseRequest(
      advertiser.id, 
      publisher.id, 
      linkListing.id, 
      uniqueId
    );

    // Étape 5: Accepter la demande
    await acceptPurchaseRequest(purchaseRequest.id);

    // Étape 6: Traiter le paiement manuellement
    const transaction = await processPaymentManually(
      purchaseRequest.id, 
      advertiser.id, 
      publisher.id, 
      linkListing.id, 
      500
    );

    // Étape 7: Vérifier les soldes
    const balances = await checkBalances(advertiser.id, publisher.id);

    console.log('\n🎉 Test avec comptes de test existants réussi !');
    console.log(`📊 Résultats finaux:`);
    console.log(`   - Annonceur: ${balances.advertiser} MAD`);
    console.log(`   - Éditeur: ${balances.publisher} MAD`);
    console.log(`   - Demande ID: ${purchaseRequest.id}`);
    console.log(`   - Transaction ID: ${transaction.id}`);
    console.log(`   - Site web: ${website.title}`);
    console.log(`   - Article: ${linkListing.title}`);
    console.log(`   - Montant: 500 MAD`);
    console.log(`   - Commission: 50 MAD (10%)`);
    console.log(`   - Montant éditeur: 450 MAD`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('📝 Détails:', error);
  }
}

// Exécuter le test
testWithExistingTestAccounts();
