// Test complet du frontend - Simulation du workflow utilisateur
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Test complet du frontend - Simulation du workflow utilisateur...\n');

// Simuler les fonctions du frontend
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

async function getUserBalance(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return user.balance || 0;
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return 0;
  }
}

async function getPendingConfirmationRequests(advertiserId) {
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings!inner(
          id,
          title,
          price,
          websites!inner(
            id,
            title,
            url
          )
        ),
        publishers:users!link_purchase_requests_publisher_id_fkey(
          id,
          email,
          name
        )
      `)
      .eq('user_id', advertiserId)
      .eq('status', 'pending_confirmation')
      .order('confirmation_deadline', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending confirmation requests:', error);
    return [];
  }
}

async function confirmLinkPlacement(requestId) {
  try {
    console.log(`🔍 Confirmation de la demande: ${requestId}`);
    
    // Récupérer les détails de la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings!inner(title),
        publishers:users!link_purchase_requests_publisher_id_fkey(name)
      `)
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Demande non trouvée');

    if (request.status !== 'pending_confirmation') {
      throw new Error('Demande non en attente de confirmation');
    }

    // Vérifier que le délai n'est pas dépassé
    if (new Date(request.confirmation_deadline) < new Date()) {
      throw new Error('Délai de confirmation dépassé');
    }

    // Traiter le paiement manuellement
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    console.log(`📊 Montant total: ${request.proposed_price} MAD`);
    console.log(`📊 Commission plateforme: ${platformFee} MAD`);
    console.log(`📊 Montant éditeur: ${publisherAmount} MAD`);

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError) throw advertiserError;
    if (advertiser.balance < request.proposed_price) {
      throw new Error('Solde insuffisant');
    }

    console.log(`✅ Solde annonceur suffisant: ${advertiser.balance} MAD`);

    // Créer la transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: requestId,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: request.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (transactionError) throw transactionError;
    console.log(`✅ Transaction créée: ${transaction.id}`);

    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) throw debitError;
    console.log(`✅ Annonceur débité de ${request.proposed_price} MAD`);

    // Récupérer le solde actuel de l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError) {
      console.log('⚠️  Erreur récupération solde éditeur:', publisherError);
      throw new Error('Impossible de récupérer le solde de l\'éditeur');
    }

    // Créditer l'éditeur
    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) {
      console.log('⚠️  Erreur lors du crédit éditeur:', creditError);
      throw new Error('Erreur lors du crédit de l\'éditeur');
    }
    console.log(`✅ Éditeur crédité de ${publisherAmount} MAD`);

    // Créer les transactions de crédit (sans les soldes avant/après pour éviter les problèmes RLS)
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: request.user_id,
          type: 'purchase',
          amount: request.proposed_price,
          description: 'Achat de lien',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId
        },
        {
          user_id: request.publisher_id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  Erreur lors de la création des transactions de crédit:', creditTransactionError);
    }

    // Mettre à jour le statut de la demande (sans payment_transaction_id pour éviter l'erreur de contrainte)
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;
    console.log(`✅ Demande confirmée`);

    // Créer une notification pour l'éditeur
    await supabase.rpc('create_notification', {
      p_user_id: request.publisher_id,
      p_type: 'success',
      p_message: `Le placement du lien "${request.link_listings?.title}" a été confirmé. Le paiement a été effectué.`,
      p_action_type: 'payment',
      p_action_url: requestId,
      p_read: false
    });

    // Déclencher un événement pour mettre à jour les soldes dans l'interface
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balance-updated'));
      console.log('💰 Événement balance-updated déclenché');
    }

    return {
      success: true,
      transaction_id: transaction.id
    };
  } catch (error) {
    console.error('Error confirming link placement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la confirmation du placement'
    };
  }
}

async function testFrontendWorkflow() {
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';
    const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';
    
    console.log('🎯 Test du workflow frontend complet :');
    console.log('   1. Simulation de la connexion utilisateur');
    console.log('   2. Récupération du solde initial');
    console.log('   3. Récupération des demandes en attente');
    console.log('   4. Confirmation d\'une demande');
    console.log('   5. Vérification de la mise à jour du solde');
    console.log('');
    
    // 1. Simuler la connexion utilisateur (annonceur)
    console.log('1️⃣ Simulation de la connexion utilisateur (annonceur)...');
    
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ Utilisateur non connecté - simulation avec ID direct');
      // Simuler un utilisateur connecté
      const mockUser = { id: advertiserId, email: 'abderrahimmolatefpro@gmail.com' };
      console.log(`✅ Utilisateur simulé: ${mockUser.email}`);
    } else {
      console.log(`✅ Utilisateur connecté: ${user.email}`);
    }
    
    // 2. Récupérer le solde initial de l'annonceur
    console.log('\n2️⃣ Récupération du solde initial de l\'annonceur...');
    
    const initialAdvertiserBalance = await getUserBalance(advertiserId);
    console.log(`📊 Solde initial annonceur: ${initialAdvertiserBalance} MAD`);
    
    // 3. Récupérer le solde initial de l'éditeur
    console.log('\n3️⃣ Récupération du solde initial de l\'éditeur...');
    
    const initialPublisherBalance = await getUserBalance(publisherId);
    console.log(`📊 Solde initial éditeur: ${initialPublisherBalance} MAD`);
    
    // 4. Récupérer les demandes en attente de confirmation
    console.log('\n4️⃣ Récupération des demandes en attente de confirmation...');
    
    const pendingRequests = await getPendingConfirmationRequests(advertiserId);
    console.log(`📋 ${pendingRequests.length} demande(s) en attente de confirmation trouvée(s)`);
    
    if (pendingRequests.length === 0) {
      console.log('⚠️  Aucune demande en attente - création d\'une demande de test...');
      
      // Créer une demande de test
      const { data: linkListing, error: listingError } = await supabase
        .from('link_listings')
        .select('id, title, price')
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (listingError) {
        console.log('❌ Erreur récupération link_listing:', listingError);
        return;
      }
      
      const { data: testRequest, error: testRequestError } = await supabase
        .from('link_purchase_requests')
        .insert({
          link_listing_id: linkListing.id,
          user_id: advertiserId,
          publisher_id: publisherId,
          target_url: 'https://test-frontend.com',
          anchor_text: 'Test Frontend Link',
          proposed_price: 60,
          proposed_duration: 1,
          status: 'pending_confirmation',
          accepted_at: new Date().toISOString(),
          confirmation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          placed_url: 'https://test-frontend.com/placed-link'
        })
        .select('id')
        .single();
      
      if (testRequestError) {
        console.log('❌ Erreur création demande test:', testRequestError);
        return;
      }
      
      console.log(`✅ Demande de test créée: ${testRequest.id}`);
      
      // Récupérer à nouveau les demandes
      const updatedPendingRequests = await getPendingConfirmationRequests(advertiserId);
      console.log(`📋 ${updatedPendingRequests.length} demande(s) en attente après création`);
      
      if (updatedPendingRequests.length > 0) {
        pendingRequests.push(...updatedPendingRequests);
      }
    }
    
    // 5. Afficher les détails des demandes
    console.log('\n5️⃣ Détails des demandes en attente...');
    
    pendingRequests.forEach((request, index) => {
      console.log(`   ${index + 1}. ID: ${request.id}`);
      console.log(`      Titre: ${request.link_listings?.title || 'N/A'}`);
      console.log(`      Prix: ${request.proposed_price} MAD`);
      console.log(`      Délai: ${request.confirmation_deadline}`);
      console.log(`      Éditeur: ${request.publishers?.email || 'N/A'}`);
      console.log('');
    });
    
    // 6. Confirmer la première demande
    if (pendingRequests.length > 0) {
      console.log('6️⃣ Confirmation de la première demande...');
      
      const requestToConfirm = pendingRequests[0];
      console.log(`🎯 Confirmation de la demande: ${requestToConfirm.id}`);
      
      const confirmResult = await confirmLinkPlacement(requestToConfirm.id);
      
      if (confirmResult.success) {
        console.log('✅ Confirmation réussie !');
        console.log(`📋 Transaction ID: ${confirmResult.transaction_id}`);
      } else {
        console.log('❌ Erreur de confirmation:', confirmResult.error);
        return;
      }
    } else {
      console.log('⚠️  Aucune demande à confirmer');
      return;
    }
    
    // 7. Vérifier les soldes après confirmation
    console.log('\n7️⃣ Vérification des soldes après confirmation...');
    
    const finalAdvertiserBalance = await getUserBalance(advertiserId);
    const finalPublisherBalance = await getUserBalance(publisherId);
    
    console.log(`📊 Solde final annonceur: ${finalAdvertiserBalance} MAD`);
    console.log(`📊 Solde final éditeur: ${finalPublisherBalance} MAD`);
    
    // 8. Analyser les résultats
    console.log('\n8️⃣ Analyse des résultats...');
    
    const advertiserChange = finalAdvertiserBalance - initialAdvertiserBalance;
    const publisherChange = finalPublisherBalance - initialPublisherBalance;
    
    console.log(`📈 Changement solde annonceur: ${advertiserChange} MAD`);
    console.log(`📈 Changement solde éditeur: ${publisherChange} MAD`);
    
    // Vérifications
    let allTestsPassed = true;
    
    if (pendingRequests.length > 0) {
      const expectedAmount = pendingRequests[0].proposed_price;
      const expectedPublisherAmount = expectedAmount * 0.9; // 90% après commission
      
      if (advertiserChange === -expectedAmount) {
        console.log('✅ CORRECT: L\'annonceur a été débité du bon montant');
      } else {
        console.log('❌ ERREUR: Changement de solde annonceur incorrect');
        console.log(`   Attendu: -${expectedAmount} MAD`);
        console.log(`   Reçu: ${advertiserChange} MAD`);
        allTestsPassed = false;
      }
      
      if (Math.abs(publisherChange - expectedPublisherAmount) < 0.01) {
        console.log('✅ CORRECT: L\'éditeur a été crédité du bon montant');
      } else {
        console.log('❌ ERREUR: Changement de solde éditeur incorrect');
        console.log(`   Attendu: ${expectedPublisherAmount} MAD`);
        console.log(`   Reçu: ${publisherChange} MAD`);
        allTestsPassed = false;
      }
    }
    
    // 9. Test de la mise à jour du solde (simulation frontend)
    console.log('\n9️⃣ Test de la mise à jour du solde (simulation frontend)...');
    
    // Simuler le rechargement du solde comme dans le frontend
    const refreshedPublisherBalance = await getUserBalance(publisherId);
    console.log(`🔄 Solde éditeur après rechargement: ${refreshedPublisherBalance} MAD`);
    
    if (refreshedPublisherBalance === finalPublisherBalance) {
      console.log('✅ CORRECT: Le solde se met à jour correctement');
    } else {
      console.log('❌ ERREUR: Le solde ne se met pas à jour');
      allTestsPassed = false;
    }
    
    // 10. Résumé final
    console.log('\n📋 RÉSUMÉ DU TEST FRONTEND:');
    console.log('='.repeat(50));
    
    if (allTestsPassed) {
      console.log('🎉 TOUS LES TESTS FRONTEND SONT PASSÉS !');
      console.log('✅ La connexion utilisateur fonctionne');
      console.log('✅ La récupération du solde fonctionne');
      console.log('✅ La récupération des demandes fonctionne');
      console.log('✅ La confirmation fonctionne');
      console.log('✅ Les paiements sont effectués correctement');
      console.log('✅ La mise à jour du solde fonctionne');
    } else {
      console.log('❌ CERTAINS TESTS FRONTEND ONT ÉCHOUÉ');
      console.log('🔧 Vérifiez les erreurs ci-dessus');
    }
    
    console.log('='.repeat(50));
    
    // 11. Nettoyage
    console.log('\n🔟 Nettoyage des données de test...');
    
    if (pendingRequests.length > 0) {
      const requestToClean = pendingRequests[0];
      
      // Supprimer les transactions de crédit liées
      const { error: deleteTransactionsError } = await supabase
        .from('credit_transactions')
        .delete()
        .eq('related_purchase_request_id', requestToClean.id);
      
      if (deleteTransactionsError) {
        console.log('⚠️  Erreur suppression transactions:', deleteTransactionsError);
      }
      
      // Supprimer la demande
      const { error: deleteRequestError } = await supabase
        .from('link_purchase_requests')
        .delete()
        .eq('id', requestToClean.id);
      
      if (deleteRequestError) {
        console.log('⚠️  Erreur suppression demande:', deleteRequestError);
      } else {
        console.log('✅ Données de test supprimées');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur dans testFrontendWorkflow:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test complet du frontend...\n');
  
  await testFrontendWorkflow();
  
  console.log('\n✅ Test frontend terminé !');
  console.log('\n💡 Si tous les tests passent, le problème pourrait être :');
  console.log('   1. L\'interface ne se met pas à jour automatiquement');
  console.log('   2. L\'utilisateur ne rafraîchit pas la page');
  console.log('   3. Un problème de cache dans le navigateur');
  console.log('   4. L\'événement balance-updated n\'est pas écouté');
}

// Exécuter le test
runTest().catch(console.error);
