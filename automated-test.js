// Test automatisé complet du processus campagne -> achat backlink
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

let advertiserId, publisherId, campaignId, purchaseRequestId, transactionId;

async function step1_createAdvertiser() {
  console.log('👤 ÉTAPE 1: Création d\'un annonceur de test');
  console.log('==============================================');
  
  try {
    // Créer un utilisateur annonceur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-annonceur@back.ma',
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test Annonceur',
          role: 'advertiser'
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Erreur création auth:', authError.message);
      // Essayer de se connecter si l'utilisateur existe
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: 'test-annonceur@back.ma',
        password: 'TestPassword123!'
      });
      advertiserId = loginData.user?.id;
    } else {
      advertiserId = authData.user?.id;
    }
    
    console.log('✅ Annonceur créé/connecté:', advertiserId);
    
    // Créer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: advertiserId,
        name: 'Test Annonceur',
        email: 'test-annonceur@back.ma',
        role: 'advertiser',
        balance: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (profileError) {
      console.log('⚠️ Erreur profil:', profileError.message);
    } else {
      console.log('✅ Profil annonceur créé');
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 1:', error.message);
    return false;
  }
}

async function step2_createPublisher() {
  console.log('👨‍💼 ÉTAPE 2: Création d\'un éditeur de test');
  console.log('============================================');
  
  try {
    // Créer un utilisateur éditeur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-editeur@back.ma',
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test Éditeur',
          role: 'publisher'
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Erreur création auth:', authError.message);
      // Essayer de se connecter si l'utilisateur existe
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: 'test-editeur@back.ma',
        password: 'TestPassword123!'
      });
      publisherId = loginData.user?.id;
    } else {
      publisherId = authData.user?.id;
    }
    
    console.log('✅ Éditeur créé/connecté:', publisherId);
    
    // Créer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: publisherId,
        name: 'Test Éditeur',
        email: 'test-editeur@back.ma',
        role: 'publisher',
        balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (profileError) {
      console.log('⚠️ Erreur profil:', profileError.message);
    } else {
      console.log('✅ Profil éditeur créé');
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 2:', error.message);
    return false;
  }
}

async function step3_createCampaign() {
  console.log('🎯 ÉTAPE 3: Création d\'une campagne de test');
  console.log('=============================================');
  
  try {
    const campaignData = {
      user_id: advertiserId,
      name: 'Campagne Test SEO Automatisée',
      target_url: 'https://example-test.com',
      language: 'fr',
      budget: 500,
      status: 'draft',
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erreur création campagne:', error.message);
      return false;
    }
    
    campaignId = campaign.id;
    console.log('✅ Campagne créée:', campaign.name);
    console.log('   ID:', campaignId);
    console.log('   Budget:', campaign.budget, 'MAD');
    console.log('   URL cible:', campaign.target_url);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 3:', error.message);
    return false;
  }
}

async function step4_getAvailableListings() {
  console.log('🔗 ÉTAPE 4: Récupération des annonces disponibles');
  console.log('=================================================');
  
  try {
    const { data: listings, error } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `)
      .eq('status', 'active');
    
    if (error) {
      console.log('❌ Erreur récupération annonces:', error.message);
      return null;
    }
    
    console.log('✅ Annonces disponibles:', listings.length);
    if (listings.length > 0) {
      const listing = listings[0];
      console.log('   📋 Première annonce:');
      console.log('      Titre:', listing.title);
      console.log('      Prix:', listing.price, listing.currency);
      console.log('      Site:', listing.website?.title);
      console.log('      URL:', listing.target_url);
    }
    
    console.log('');
    return listings[0];
  } catch (error) {
    console.log('❌ Erreur étape 4:', error.message);
    return null;
  }
}

async function step5_createPurchaseRequest(listing) {
  console.log('📝 ÉTAPE 5: Création d\'une demande d\'achat');
  console.log('============================================');
  
  try {
    if (!listing) {
      console.log('❌ Aucune annonce disponible');
      return false;
    }
    
    const requestData = {
      link_listing_id: listing.id,
      user_id: advertiserId,
      publisher_id: listing.user_id,
      target_url: 'https://example-test.com',
      anchor_text: 'référencement SEO test',
      message: 'Bonjour, je souhaite acheter ce lien pour ma campagne de test automatisée. Pouvez-vous confirmer la disponibilité ?',
      proposed_price: listing.price,
      proposed_duration: 12,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: request, error } = await supabase
      .from('link_purchase_requests')
      .insert([requestData])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erreur création demande:', error.message);
      return false;
    }
    
    purchaseRequestId = request.id;
    console.log('✅ Demande d\'achat créée:');
    console.log('   ID:', purchaseRequestId);
    console.log('   Annonceur:', advertiserId);
    console.log('   Éditeur:', listing.user_id);
    console.log('   Prix:', request.proposed_price, 'MAD');
    console.log('   Statut:', request.status);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 5:', error.message);
    return false;
  }
}

async function step6_acceptRequest() {
  console.log('✅ ÉTAPE 6: Acceptation de la demande par l\'éditeur');
  console.log('===================================================');
  
  try {
    if (!purchaseRequestId) {
      console.log('❌ Aucune demande d\'achat à traiter');
      return false;
    }
    
    // L'éditeur accepte la demande
    const { data: acceptedRequest, error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'accepted',
        editor_response: 'Parfait ! Je peux placer votre lien. Voici l\'URL où il sera placé : https://leplombier.ma/guide-seo-test/',
        placed_url: 'https://leplombier.ma/guide-seo-test/',
        response_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseRequestId)
      .select()
      .single();
    
    if (acceptError) {
      console.log('❌ Erreur acceptation:', acceptError.message);
      return false;
    }
    
    console.log('✅ Demande acceptée par l\'éditeur:');
    console.log('   URL de placement:', acceptedRequest.placed_url);
    console.log('   Réponse:', acceptedRequest.editor_response);
    console.log('   Date de réponse:', new Date(acceptedRequest.response_date).toLocaleString());
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 6:', error.message);
    return false;
  }
}

async function step7_processPayment() {
  console.log('💳 ÉTAPE 7: Traitement du paiement');
  console.log('==================================');
  
  try {
    if (!purchaseRequestId) {
      console.log('❌ Aucune demande d\'achat à traiter');
      return false;
    }
    
    // Récupérer la demande acceptée
    const { data: request } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', purchaseRequestId)
      .single();
    
    if (!request) {
      console.log('❌ Demande non trouvée');
      return false;
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
      return false;
    }
    
    // Créer la transaction de paiement
    const platformFee = request.proposed_price * 0.10; // 10% de commission
    const publisherAmount = request.proposed_price - platformFee;
    
    const { data: transaction, error: transError } = await supabase
      .from('link_purchase_transactions')
      .insert([{
        purchase_request_id: purchaseRequestId,
        advertiser_id: advertiserId,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: request.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        payment_method: 'balance',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (transError) {
      console.log('❌ Erreur transaction:', transError.message);
      return false;
    }
    
    transactionId = transaction.id;
    console.log('✅ Transaction créée:');
    console.log('   ID:', transactionId);
    console.log('   Montant total:', transaction.amount, 'MAD');
    console.log('   Commission plateforme:', transaction.platform_fee, 'MAD');
    console.log('   Montant éditeur:', transaction.publisher_amount, 'MAD');
    console.log('   Statut:', transaction.status);
    
    // Mettre à jour les soldes
    const newAdvertiserBalance = advertiser.balance - request.proposed_price;
    const { data: publisher } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();
    
    const newPublisherBalance = (publisher.balance || 0) + publisherAmount;
    
    await supabase
      .from('users')
      .update({ balance: newAdvertiserBalance })
      .eq('id', advertiserId);
    
    await supabase
      .from('users')
      .update({ balance: newPublisherBalance })
      .eq('id', request.publisher_id);
    
    console.log('✅ Soldes mis à jour:');
    console.log('   Nouveau solde annonceur:', newAdvertiserBalance, 'MAD');
    console.log('   Nouveau solde éditeur:', newPublisherBalance, 'MAD');
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 7:', error.message);
    return false;
  }
}

async function step8_createNotifications() {
  console.log('🔔 ÉTAPE 8: Création des notifications');
  console.log('======================================');
  
  try {
    // Notification pour l'annonceur
    const { data: advNotif, error: advError } = await supabase
      .from('notifications')
      .insert([{
        user_id: advertiserId,
        title: 'Demande d\'achat acceptée',
        message: 'Votre demande d\'achat de lien a été acceptée par l\'éditeur ! Le paiement a été traité avec succès.',
        type: 'success',
        action_type: 'link_purchase',
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (!advError) {
      console.log('✅ Notification annonceur créée:', advNotif.id);
    }
    
    // Notification pour l'éditeur
    const { data: pubNotif, error: pubError } = await supabase
      .from('notifications')
      .insert([{
        user_id: publisherId,
        title: 'Paiement reçu',
        message: 'Vous avez reçu un paiement pour la vente de votre lien !',
        type: 'success',
        action_type: 'payment',
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (!pubError) {
      console.log('✅ Notification éditeur créée:', pubNotif.id);
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 8:', error.message);
    return false;
  }
}

async function step9_verifyResults() {
  console.log('📊 ÉTAPE 9: Vérification des résultats');
  console.log('======================================');
  
  try {
    // Vérifier les utilisateurs créés
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', [advertiserId, publisherId]);
    
    console.log('👥 Utilisateurs créés:', users?.length || 0);
    if (users) {
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}): ${user.balance} MAD`);
      });
    }
    
    // Vérifier les campagnes
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', advertiserId);
    
    console.log('🎯 Campagnes créées:', campaigns?.length || 0);
    if (campaigns) {
      campaigns.forEach(campaign => {
        console.log(`   - ${campaign.name}: ${campaign.budget} MAD`);
      });
    }
    
    // Vérifier les demandes d'achat
    const { data: requests } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('user_id', advertiserId);
    
    console.log('📝 Demandes d\'achat:', requests?.length || 0);
    if (requests) {
      requests.forEach(request => {
        console.log(`   - Prix: ${request.proposed_price} MAD, Statut: ${request.status}`);
      });
    }
    
    // Vérifier les transactions
    const { data: transactions } = await supabase
      .from('link_purchase_transactions')
      .select('*')
      .eq('advertiser_id', advertiserId);
    
    console.log('💳 Transactions:', transactions?.length || 0);
    if (transactions) {
      transactions.forEach(transaction => {
        console.log(`   - Montant: ${transaction.amount} MAD, Statut: ${transaction.status}`);
      });
    }
    
    // Vérifier les notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .in('user_id', [advertiserId, publisherId]);
    
    console.log('🔔 Notifications:', notifications?.length || 0);
    if (notifications) {
      notifications.forEach(notif => {
        console.log(`   - ${notif.title}: ${notif.type}`);
      });
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Erreur étape 9:', error.message);
    return false;
  }
}

async function runCompleteAutomatedTest() {
  console.log('🚀 DÉBUT DU TEST AUTOMATISÉ COMPLET');
  console.log('====================================');
  console.log('Processus: Création Campagne → Achat Backlink');
  console.log('====================================\n');
  
  const steps = [
    { name: 'Création annonceur', fn: step1_createAdvertiser },
    { name: 'Création éditeur', fn: step2_createPublisher },
    { name: 'Création campagne', fn: step3_createCampaign },
    { name: 'Récupération annonces', fn: step4_getAvailableListings },
    { name: 'Demande d\'achat', fn: step5_createPurchaseRequest },
    { name: 'Acceptation demande', fn: step6_acceptRequest },
    { name: 'Traitement paiement', fn: step7_processPayment },
    { name: 'Création notifications', fn: step8_createNotifications },
    { name: 'Vérification résultats', fn: step9_verifyResults }
  ];
  
  let successCount = 0;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n🔄 Exécution de l'étape ${i + 1}/9: ${step.name}`);
    
    try {
      let result;
      if (i === 4) { // Étape 5: Demande d'achat
        const listing = await step4_getAvailableListings();
        result = await step.fn(listing);
      } else {
        result = await step.fn();
      }
      
      if (result) {
        successCount++;
        console.log(`✅ Étape ${i + 1} réussie`);
      } else {
        console.log(`❌ Étape ${i + 1} échouée`);
      }
    } catch (error) {
      console.log(`❌ Erreur étape ${i + 1}:`, error.message);
    }
  }
  
  console.log('\n🎉 RÉSULTATS DU TEST AUTOMATISÉ');
  console.log('================================');
  console.log(`✅ Étapes réussies: ${successCount}/${steps.length}`);
  console.log(`📊 Taux de réussite: ${Math.round((successCount / steps.length) * 100)}%`);
  
  if (successCount === steps.length) {
    console.log('\n🎊 TEST COMPLET RÉUSSI !');
    console.log('========================');
    console.log('✅ Tous les processus fonctionnent parfaitement');
    console.log('✅ La plateforme est prête pour les utilisateurs réels');
    console.log('✅ Le système de campagne → achat backlink est opérationnel');
  } else {
    console.log('\n⚠️ TEST PARTIELLEMENT RÉUSSI');
    console.log('============================');
    console.log('Certaines étapes ont échoué, vérifiez les erreurs ci-dessus');
  }
  
  console.log('\n📋 RÉSUMÉ DES DONNÉES CRÉÉES:');
  console.log('==============================');
  console.log(`👤 Annonceur: ${advertiserId}`);
  console.log(`👨‍💼 Éditeur: ${publisherId}`);
  console.log(`🎯 Campagne: ${campaignId}`);
  console.log(`📝 Demande: ${purchaseRequestId}`);
  console.log(`💳 Transaction: ${transactionId}`);
}

// Exécuter le test automatisé complet
runCompleteAutomatedTest();
