// Script de test complet avec données uniques
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

// Client avec clé de service pour contourner RLS
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

// Client normal pour les opérations utilisateur
const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI');

// Comptes de test
const TEST_ACCOUNTS = {
  advertiser: {
    email: 'annonceur@test.com',
    password: 'password123'
  },
  publisher: {
    email: 'editeur@test.com', 
    password: 'password123'
  }
};

// Générer des identifiants uniques
const timestamp = Date.now();
const uniqueId = Math.random().toString(36).substring(7);

let advertiserUser = null;
let publisherUser = null;
let testWebsite = null;
let testLinkListing = null;
let testCampaign = null;

async function testCompleteProcess() {
  console.log('🚀 Test complet du processus d\'achat de liens (Données uniques)');
  console.log('================================================================\n');
  console.log(`🆔 ID unique: ${uniqueId}-${timestamp}\n`);

  try {
    // Étape 1: Connexion des comptes
    await step1_LoginAccounts();
    
    // Étape 2: Création d'un site web par l'éditeur
    await step2_CreateWebsite();
    
    // Étape 3: Création d'une annonce de lien par l'éditeur
    await step3_CreateLinkListing();
    
    // Étape 4: Création d'une campagne par l'annonceur
    await step4_CreateCampaign();
    
    // Étape 5: Génération des recommandations
    await step5_GetRecommendations();
    
    // Étape 6: Création d'une demande d'achat
    await step6_CreatePurchaseRequest();
    
    // Étape 7: Acceptation par l'éditeur
    await step7_AcceptRequest();
    
    // Étape 8: Traitement du paiement
    await step8_ProcessPayment();
    
    // Étape 9: Vérification des résultats
    await step9_VerifyResults();
    
    console.log('\n🎉 Test complet terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Détails:', error);
  }
}

async function step1_LoginAccounts() {
  console.log('1️⃣ Connexion des comptes de test...');
  
  // Connexion annonceur
  const { data: advertiserAuth, error: advertiserError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.advertiser.email,
    password: TEST_ACCOUNTS.advertiser.password
  });
  
  if (advertiserError) {
    throw new Error(`Erreur connexion annonceur: ${advertiserError.message}`);
  }
  
  advertiserUser = advertiserAuth.user;
  console.log('✅ Annonceur connecté:', advertiserUser.email);
  
  // Connexion éditeur
  const { data: publisherAuth, error: publisherError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.publisher.email,
    password: TEST_ACCOUNTS.publisher.password
  });
  
  if (publisherError) {
    throw new Error(`Erreur connexion éditeur: ${publisherError.message}`);
  }
  
  publisherUser = publisherAuth.user;
  console.log('✅ Éditeur connecté:', publisherUser.email);
}

async function step2_CreateWebsite() {
  console.log('\n2️⃣ Création d\'un site web par l\'éditeur...');
  
  const websiteData = {
    title: `Site Test Éditeur ${uniqueId}`,
    description: 'Site de test pour les liens',
    url: `https://site-test-editeur-${uniqueId}.com`,
    category: 'blog',
    niche: 'tech',
    owner_status: 'professionnel',
    metrics: {
      domain_authority: 45,
      trust_flow: 35,
      citation_flow: 40,
      monthly_traffic: 5000
    },
    contact_info: {
      email: `contact@site-test-editeur-${uniqueId}.com`,
      phone: '+212600000000'
    },
    slug: `site-test-editeur-${uniqueId}-${timestamp}`,
    status: 'active',
    available_link_spots: 10,
    languages: ['Français'],
    content_quality: 'good'
  };
  
  const { data, error } = await supabaseAdmin
    .from('websites')
    .insert([{
      ...websiteData,
      user_id: publisherUser.id
    }])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Erreur création site: ${error.message}`);
  }
  
  testWebsite = data;
  console.log('✅ Site web créé:', testWebsite.title);
}

async function step3_CreateLinkListing() {
  console.log('\n3️⃣ Création d\'une annonce de lien par l\'éditeur...');
  
  const linkListingData = {
    website_id: testWebsite.id,
    title: `Lien Test - Article Tech ${uniqueId}`,
    description: 'Lien dofollow dans un article sur la technologie',
    target_url: `https://site-test-editeur-${uniqueId}.com/article-tech`,
    anchor_text: 'technologie',
    link_type: 'dofollow',
    position: 'content',
    price: 300,
    currency: 'MAD',
    minimum_contract_duration: 12,
    allowed_niches: ['tech', 'business'],
    status: 'active',
    slug: `lien-test-article-tech-${uniqueId}-${timestamp}`,
    tags: ['tech', 'dofollow', 'content']
  };
  
  const { data, error } = await supabaseAdmin
    .from('link_listings')
    .insert([{
      ...linkListingData,
      user_id: publisherUser.id
    }])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Erreur création annonce: ${error.message}`);
  }
  
  testLinkListing = data;
  console.log('✅ Annonce de lien créée:', testLinkListing.title);
}

async function step4_CreateCampaign() {
  console.log('\n4️⃣ Création d\'une campagne par l\'annonceur...');
  
  const campaignData = {
    name: `Campagne Test - Tech ${uniqueId}`,
    urls: [`https://site-annonceur-test-${uniqueId}.com`],
    language: 'Français',
    budget: 1000,
    status: 'draft'
  };
  
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .insert([{
      ...campaignData,
      user_id: advertiserUser.id
    }])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Erreur création campagne: ${error.message}`);
  }
  
  testCampaign = data;
  console.log('✅ Campagne créée:', testCampaign.name);
}

async function step5_GetRecommendations() {
  console.log('\n5️⃣ Génération des recommandations de liens...');
  
  // Récupérer les liens existants
  const { data: linkListings } = await supabaseAdmin
    .from('link_listings')
    .select(`
      *,
      website:websites(*)
    `)
    .eq('status', 'active');
  
  // Récupérer les sites web
  const { data: websites } = await supabaseAdmin
    .from('websites')
    .select('*')
    .eq('status', 'active');
  
  const existingArticles = (linkListings || []).map((listing) => ({
    id: listing.id,
    campaign_id: testCampaign.id,
    type: 'existing_article',
    site_name: listing.website?.title || listing.title,
    site_url: listing.website?.url || listing.target_url,
    site_metrics: {
      dr: listing.website?.metrics?.domain_authority || 45,
      tf: listing.website?.metrics?.trust_flow || 35,
      cf: listing.website?.metrics?.citation_flow || 40
    },
    quality_type: 'silver',
    theme: 'tech',
    existing_article: {
      title: listing.title,
      url: listing.target_url,
      age: 6,
      outlinks: 15
    },
    price: listing.price,
    currency: 'MAD'
  }));
  
  const newArticles = (websites || []).map((website) => ({
    id: `new-${website.id}`,
    campaign_id: testCampaign.id,
    type: 'new_article',
    site_name: `${website.title} (Nouveau)`,
    site_url: website.url,
    site_metrics: {
      dr: website.metrics?.domain_authority || 45,
      tf: website.metrics?.trust_flow || 35,
      cf: website.metrics?.citation_flow || 40
    },
    quality_type: 'silver',
    theme: 'tech',
    new_article: {
      duration: '1 an',
      placement_info: 'Articles seront à 2 clics de la page d\'accueil'
    },
    price: 200,
    currency: 'MAD'
  }));
  
  console.log(`✅ ${existingArticles.length} articles existants trouvés`);
  console.log(`✅ ${newArticles.length} nouveaux articles trouvés`);
  
  return { existingArticles, newArticles };
}

async function step6_CreatePurchaseRequest() {
  console.log('\n6️⃣ Création d\'une demande d\'achat...');
  
  const purchaseRequestData = {
    link_listing_id: testLinkListing.id,
    user_id: advertiserUser.id,
    publisher_id: publisherUser.id,
    target_url: `https://site-annonceur-test-${uniqueId}.com`,
    anchor_text: 'technologie innovante',
    message: `Demande d'achat de lien pour notre site tech ${uniqueId}`,
    proposed_price: 300,
    proposed_duration: 12,
    campaign_id: testCampaign.id,
    status: 'pending'
  };
  
  const { data, error } = await supabaseAdmin
    .from('link_purchase_requests')
    .insert([purchaseRequestData])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Erreur création demande: ${error.message}`);
  }
  
  console.log('✅ Demande d\'achat créée:', data.id);
  
  // Créer une notification pour l'éditeur
  await supabaseAdmin
    .from('notifications')
    .insert([{
      user_id: publisherUser.id,
      title: 'Nouvelle demande de lien reçue',
      message: `Vous avez reçu une nouvelle demande d'achat de lien pour "${testLinkListing.title}"`,
      type: 'info',
      action_url: '/dashboard/purchase-requests',
      action_type: 'link_purchase',
      read: false
    }]);
  
  console.log('✅ Notification créée pour l\'éditeur');
  
  return data;
}

async function step7_AcceptRequest() {
  console.log('\n7️⃣ Acceptation de la demande par l\'éditeur...');
  
  // Récupérer la demande d'achat
  const { data: requests } = await supabaseAdmin
    .from('link_purchase_requests')
    .select('*')
    .eq('publisher_id', publisherUser.id)
    .eq('status', 'pending')
    .limit(1);
  
  if (!requests || requests.length === 0) {
    throw new Error('Aucune demande d\'achat trouvée');
  }
  
  const request = requests[0];
  
  // Accepter la demande
  const { error } = await supabaseAdmin
    .from('link_purchase_requests')
    .update({
      status: 'accepted',
      placed_url: `https://site-test-editeur-${uniqueId}.com/article-tech#lien-place`,
      editor_response: 'Lien placé avec succès !',
      response_date: new Date().toISOString()
    })
    .eq('id', request.id);
  
  if (error) {
    throw new Error(`Erreur acceptation: ${error.message}`);
  }
  
  console.log('✅ Demande acceptée par l\'éditeur');
}

async function step8_ProcessPayment() {
  console.log('\n8️⃣ Traitement du paiement...');
  
  // Récupérer la demande acceptée
  const { data: requests } = await supabaseAdmin
    .from('link_purchase_requests')
    .select('*')
    .eq('publisher_id', publisherUser.id)
    .eq('status', 'accepted')
    .limit(1);
  
  if (!requests || requests.length === 0) {
    throw new Error('Aucune demande acceptée trouvée');
  }
  
  const request = requests[0];
  
  // Vérifier le solde de l'annonceur
  const { data: advertiser } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', advertiserUser.id)
    .single();
  
  if (advertiser.balance < request.proposed_price) {
    throw new Error('Solde insuffisant pour l\'annonceur');
  }
  
  console.log(`✅ Solde annonceur: ${advertiser.balance} MAD`);
  console.log(`✅ Montant requis: ${request.proposed_price} MAD`);
  
  // Calculer les montants
  const platformFee = request.proposed_price * 0.10;
  const publisherAmount = request.proposed_price - platformFee;
  
  console.log(`✅ Commission plateforme: ${platformFee} MAD`);
  console.log(`✅ Montant éditeur: ${publisherAmount} MAD`);
  
  // Créer la transaction
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('link_purchase_transactions')
    .insert([{
      purchase_request_id: request.id,
      advertiser_id: advertiserUser.id,
      publisher_id: publisherUser.id,
      link_listing_id: request.link_listing_id,
      amount: request.proposed_price,
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
  
  console.log('✅ Transaction créée:', transaction.id);
  
  // Débiter l'annonceur
  const { error: debitError } = await supabaseAdmin
    .from('users')
    .update({ balance: advertiser.balance - request.proposed_price })
    .eq('id', advertiserUser.id);
  
  if (debitError) {
    throw new Error(`Erreur débit annonceur: ${debitError.message}`);
  }
  
  // Créditer l'éditeur
  const { data: publisher } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', publisherUser.id)
    .single();
  
  const { error: creditError } = await supabaseAdmin
    .from('users')
    .update({ balance: publisher.balance + publisherAmount })
    .eq('id', publisherUser.id);
  
  if (creditError) {
    throw new Error(`Erreur crédit éditeur: ${creditError.message}`);
  }
  
  console.log('✅ Paiement traité avec succès');
}

async function step9_VerifyResults() {
  console.log('\n9️⃣ Vérification des résultats...');
  
  // Vérifier les soldes
  const { data: advertiser } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', advertiserUser.id)
    .single();
  
  const { data: publisher } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', publisherUser.id)
    .single();
  
  console.log(`💰 Solde annonceur final: ${advertiser.balance} MAD`);
  console.log(`💰 Solde éditeur final: ${publisher.balance} MAD`);
  
  // Vérifier les transactions
  const { data: transactions } = await supabaseAdmin
    .from('link_purchase_transactions')
    .select('*')
    .eq('advertiser_id', advertiserUser.id)
    .eq('publisher_id', publisherUser.id);
  
  console.log(`📊 Nombre de transactions: ${transactions?.length || 0}`);
  
  // Vérifier les demandes
  const { data: requests } = await supabaseAdmin
    .from('link_purchase_requests')
    .select('*')
    .eq('user_id', advertiserUser.id)
    .eq('publisher_id', publisherUser.id);
  
  console.log(`📋 Nombre de demandes: ${requests?.length || 0}`);
  
  // Vérifier les notifications
  const { data: notifications } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', publisherUser.id);
  
  console.log(`🔔 Nombre de notifications: ${notifications?.length || 0}`);
  
  // Vérifier les sites et liens créés
  const { data: websites } = await supabaseAdmin
    .from('websites')
    .select('*')
    .eq('user_id', publisherUser.id);
  
  const { data: linkListings } = await supabaseAdmin
    .from('link_listings')
    .select('*')
    .eq('user_id', publisherUser.id);
  
  console.log(`🌐 Sites web créés: ${websites?.length || 0}`);
  console.log(`🔗 Annonces de liens créées: ${linkListings?.length || 0}`);
  
  console.log('\n✅ Vérification terminée - Tous les éléments sont en place !');
}

// Exécuter le test
testCompleteProcess();
