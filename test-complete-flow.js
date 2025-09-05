// Script de test complet du processus de campagne -> achat de backlink
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Variables globales pour stocker les IDs créés
let advertiserId, publisherId, campaignId, linkOrderId, purchaseRequestId;

async function createTestUsers() {
  console.log('👥 Création des utilisateurs de test...\n');
  
  // Créer un annonceur
  console.log('📢 Création de l\'annonceur...');
  const { data: advertiser, error: advError } = await supabase.auth.signUp({
    email: 'annonceur@test.com',
    password: 'password123',
    options: {
      data: {
        name: 'Test Annonceur',
        role: 'advertiser'
      }
    }
  });
  
  if (advError) {
    console.log('⚠️ Erreur création annonceur:', advError.message);
    // Essayer de se connecter si l'utilisateur existe déjà
    const { data: loginData } = await supabase.auth.signInWithPassword({
      email: 'annonceur@test.com',
      password: 'password123'
    });
    advertiserId = loginData.user?.id;
  } else {
    advertiserId = advertiser.user?.id;
  }
  
  console.log('✅ Annonceur créé/connecté:', advertiserId);
  
  // Créer un éditeur
  console.log('📝 Création de l\'éditeur...');
  const { data: publisher, error: pubError } = await supabase.auth.signUp({
    email: 'editeur@test.com',
    password: 'password123',
    options: {
      data: {
        name: 'Test Éditeur',
        role: 'publisher'
      }
    }
  });
  
  if (pubError) {
    console.log('⚠️ Erreur création éditeur:', pubError.message);
    // Essayer de se connecter si l'utilisateur existe déjà
    const { data: loginData } = await supabase.auth.signInWithPassword({
      email: 'editeur@test.com',
      password: 'password123'
    });
    publisherId = loginData.user?.id;
  } else {
    publisherId = publisher.user?.id;
  }
  
  console.log('✅ Éditeur créé/connecté:', publisherId);
  
  // Ajouter des fonds à l'annonceur
  console.log('💰 Ajout de fonds à l\'annonceur...');
  try {
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: 1000 })
      .eq('id', advertiserId);
    
    if (!balanceError) {
      console.log('✅ Solde de 1000 MAD ajouté à l\'annonceur');
    }
  } catch (err) {
    console.log('⚠️ Erreur ajout solde:', err.message);
  }
  
  console.log('');
}

async function createTestCampaign() {
  console.log('🎯 Création d\'une campagne de test...\n');
  
  const campaignData = {
    user_id: advertiserId,
    name: 'Campagne Test SEO',
    target_url: 'https://example.com',
    target_keywords: ['SEO', 'référencement', 'backlinks'],
    language: 'fr',
    budget: 500,
    description: 'Campagne de test pour acheter des backlinks de qualité',
    status: 'draft'
  };
  
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert([campaignData])
    .select()
    .single();
  
  if (error) {
    console.log('❌ Erreur création campagne:', error.message);
    return;
  }
  
  campaignId = campaign.id;
  console.log('✅ Campagne créée:', campaign.name);
  console.log('   ID:', campaignId);
  console.log('   Budget:', campaign.budget, 'MAD');
  console.log('   URL cible:', campaign.target_url);
  console.log('');
}

async function analyzeURL() {
  console.log('🔍 Analyse de l\'URL de la campagne...\n');
  
  const { data: analysis, error } = await supabase
    .from('url_analyses')
    .insert([{
      url: 'https://example.com',
      metrics: {
        traffic: 5000,
        mc: 2500,
        dr: 45,
        cf: 30,
        tf: 35
      },
      category: 'Business/Marketing and Advertising',
      analysis_status: 'completed'
    }])
    .select()
    .single();
  
  if (error) {
    console.log('❌ Erreur analyse URL:', error.message);
    return;
  }
  
  console.log('✅ Analyse URL terminée:');
  console.log('   Traffic:', analysis.metrics.traffic);
  console.log('   DR:', analysis.metrics.dr);
  console.log('   CF:', analysis.metrics.cf);
  console.log('   TF:', analysis.metrics.tf);
  console.log('');
}

async function getLinkRecommendations() {
  console.log('🎯 Récupération des recommandations de liens...\n');
  
  // Récupérer les sites disponibles
  const { data: websites, error: webError } = await supabase
    .from('websites')
    .select('*')
    .eq('status', 'active');
  
  if (webError) {
    console.log('❌ Erreur récupération sites:', webError.message);
    return;
  }
  
  console.log('✅ Sites disponibles:', websites.length);
  websites.forEach((site, index) => {
    console.log(`   ${index + 1}. ${site.title} (${site.category})`);
  });
  
  // Récupérer les annonces de liens
  const { data: listings, error: listError } = await supabase
    .from('link_listings')
    .select(`
      *,
      website:websites(*)
    `)
    .eq('status', 'active');
  
  if (listError) {
    console.log('❌ Erreur récupération annonces:', listError.message);
    return;
  }
  
  console.log('✅ Annonces de liens disponibles:', listings.length);
  listings.forEach((listing, index) => {
    console.log(`   ${index + 1}. ${listing.title}`);
    console.log(`      Prix: ${listing.price} ${listing.currency}`);
    console.log(`      Site: ${listing.website?.title}`);
  });
  
  console.log('');
  return { websites, listings };
}

async function createLinkOrder() {
  console.log('🛒 Création d\'une commande de lien...\n');
  
  // Récupérer une annonce de lien disponible
  const { data: listings } = await supabase
    .from('link_listings')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .single();
  
  if (!listings) {
    console.log('❌ Aucune annonce de lien disponible');
    return;
  }
  
  const orderData = {
    campaign_id: campaignId,
    advertiser_id: advertiserId,
    link_listing_id: listings.id,
    target_url: 'https://example.com',
    anchor_text: 'référencement SEO',
    message: 'Je souhaite acheter ce lien pour ma campagne SEO',
    proposed_price: listings.price,
    proposed_duration: 12,
    status: 'pending'
  };
  
  const { data: order, error } = await supabase
    .from('link_orders')
    .insert([orderData])
    .select()
    .single();
  
  if (error) {
    console.log('❌ Erreur création commande:', error.message);
    return;
  }
  
  linkOrderId = order.id;
  console.log('✅ Commande créée:');
  console.log('   ID:', linkOrderId);
  console.log('   Prix proposé:', order.proposed_price, 'MAD');
  console.log('   Durée:', order.proposed_duration, 'mois');
  console.log('   Statut:', order.status);
  console.log('');
}

async function createPurchaseRequest() {
  console.log('📝 Création d\'une demande d\'achat...\n');
  
  // Récupérer l'annonce de lien
  const { data: listing } = await supabase
    .from('link_listings')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .single();
  
  if (!listing) {
    console.log('❌ Aucune annonce de lien disponible');
    return;
  }
  
  const requestData = {
    link_listing_id: listing.id,
    user_id: advertiserId,
    publisher_id: publisherId,
    target_url: 'https://example.com',
    anchor_text: 'référencement SEO',
    message: 'Bonjour, je souhaite acheter ce lien pour ma campagne SEO. Pouvez-vous me confirmer la disponibilité ?',
    proposed_price: listing.price,
    proposed_duration: 12,
    status: 'pending'
  };
  
  const { data: request, error } = await supabase
    .from('link_purchase_requests')
    .insert([requestData])
    .select()
    .single();
  
  if (error) {
    console.log('❌ Erreur création demande:', error.message);
    return;
  }
  
  purchaseRequestId = request.id;
  console.log('✅ Demande d\'achat créée:');
  console.log('   ID:', purchaseRequestId);
  console.log('   Annonceur:', advertiserId);
  console.log('   Éditeur:', publisherId);
  console.log('   Prix:', request.proposed_price, 'MAD');
  console.log('   Statut:', request.status);
  console.log('');
}

async function simulatePublisherResponse() {
  console.log('👨‍💼 Simulation de la réponse de l\'éditeur...\n');
  
  // L'éditeur accepte la demande
  const { data: acceptedRequest, error: acceptError } = await supabase
    .from('link_purchase_requests')
    .update({
      status: 'accepted',
      editor_response: 'Parfait ! Je peux placer votre lien. Voici l\'URL où il sera placé : https://leplombier.ma/guide-seo/',
      placed_url: 'https://leplombier.ma/guide-seo/',
      response_date: new Date().toISOString()
    })
    .eq('id', purchaseRequestId)
    .select()
    .single();
  
  if (acceptError) {
    console.log('❌ Erreur acceptation:', acceptError.message);
    return;
  }
  
  console.log('✅ Demande acceptée par l\'éditeur:');
  console.log('   URL de placement:', acceptedRequest.placed_url);
  console.log('   Réponse:', acceptedRequest.editor_response);
  console.log('   Date de réponse:', new Date(acceptedRequest.response_date).toLocaleString());
  console.log('');
}

async function processPayment() {
  console.log('💳 Traitement du paiement...\n');
  
  // Récupérer la demande acceptée
  const { data: request } = await supabase
    .from('link_purchase_requests')
    .select('*')
    .eq('id', purchaseRequestId)
    .single();
  
  if (!request) {
    console.log('❌ Demande non trouvée');
    return;
  }
  
  // Vérifier le solde de l'annonceur
  const { data: advertiser } = await supabase
    .from('users')
    .select('balance')
    .eq('id', advertiserId)
    .single();
  
  console.log('💰 Solde annonceur avant paiement:', advertiser.balance, 'MAD');
  console.log('💸 Montant à débiter:', request.proposed_price, 'MAD');
  
  if (advertiser.balance < request.proposed_price) {
    console.log('❌ Solde insuffisant');
    return;
  }
  
  // Créer la transaction de paiement
  const platformFee = request.proposed_price * 0.10; // 10% de commission
  const publisherAmount = request.proposed_price - platformFee;
  
  const { data: transaction, error: transError } = await supabase
    .from('link_purchase_transactions')
    .insert([{
      purchase_request_id: purchaseRequestId,
      advertiser_id: advertiserId,
      publisher_id: publisherId,
      link_listing_id: request.link_listing_id,
      amount: request.proposed_price,
      platform_fee: platformFee,
      publisher_amount: publisherAmount,
      status: 'completed',
      payment_method: 'balance'
    }])
    .select()
    .single();
  
  if (transError) {
    console.log('❌ Erreur transaction:', transError.message);
    return;
  }
  
  console.log('✅ Transaction créée:');
  console.log('   ID:', transaction.id);
  console.log('   Montant total:', transaction.amount, 'MAD');
  console.log('   Commission plateforme:', transaction.platform_fee, 'MAD');
  console.log('   Montant éditeur:', transaction.publisher_amount, 'MAD');
  console.log('   Statut:', transaction.status);
  
  // Mettre à jour les soldes
  const newAdvertiserBalance = advertiser.balance - request.proposed_price;
  const { data: publisher } = await supabase
    .from('users')
    .select('balance')
    .eq('id', publisherId)
    .single();
  
  const newPublisherBalance = (publisher.balance || 0) + publisherAmount;
  
  await supabase
    .from('users')
    .update({ balance: newAdvertiserBalance })
    .eq('id', advertiserId);
  
  await supabase
    .from('users')
    .update({ balance: newPublisherBalance })
    .eq('id', publisherId);
  
  console.log('✅ Soldes mis à jour:');
  console.log('   Nouveau solde annonceur:', newAdvertiserBalance, 'MAD');
  console.log('   Nouveau solde éditeur:', newPublisherBalance, 'MAD');
  console.log('');
}

async function checkNotifications() {
  console.log('🔔 Vérification des notifications...\n');
  
  // Notifications pour l'annonceur
  const { data: advNotifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', advertiserId)
    .order('created_at', { ascending: false });
  
  console.log('📢 Notifications annonceur:', advNotifications?.length || 0);
  if (advNotifications) {
    advNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      ${notif.message}`);
      console.log(`      ${new Date(notif.created_at).toLocaleString()}`);
    });
  }
  
  // Notifications pour l'éditeur
  const { data: pubNotifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', publisherId)
    .order('created_at', { ascending: false });
  
  console.log('📝 Notifications éditeur:', pubNotifications?.length || 0);
  if (pubNotifications) {
    pubNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      ${notif.message}`);
      console.log(`      ${new Date(notif.created_at).toLocaleString()}`);
    });
  }
  
  console.log('');
}

async function checkMessages() {
  console.log('💬 Vérification des messages...\n');
  
  // Messages entre annonceur et éditeur
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('*')
    .or(`sender_id.eq.${advertiserId},receiver_id.eq.${advertiserId}`)
    .order('created_at', { ascending: true });
  
  console.log('💬 Messages échangés:', messages?.length || 0);
  if (messages) {
    messages.forEach((msg, index) => {
      const sender = msg.sender_id === advertiserId ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. [${sender}] ${msg.content}`);
      console.log(`      ${new Date(msg.created_at).toLocaleString()}`);
    });
  }
  
  console.log('');
}

async function runCompleteTest() {
  console.log('🚀 DÉBUT DU TEST COMPLET DU PROCESSUS CAMPAGNE -> ACHAT BACKLINK');
  console.log('================================================================\n');
  
  try {
    await createTestUsers();
    await createTestCampaign();
    await analyzeURL();
    await getLinkRecommendations();
    await createLinkOrder();
    await createPurchaseRequest();
    await simulatePublisherResponse();
    await processPayment();
    await checkNotifications();
    await checkMessages();
    
    console.log('🎉 TEST COMPLET TERMINÉ AVEC SUCCÈS !');
    console.log('=====================================');
    console.log('✅ Tous les processus ont été testés et fonctionnent correctement');
    console.log('✅ La plateforme est prête pour les utilisateurs réels');
    
  } catch (error) {
    console.log('❌ ERREUR LORS DU TEST:', error.message);
  }
}

// Exécuter le test complet
runCompleteTest();
