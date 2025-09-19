import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Protection globale contre les appels multiples\n');

// Simulation du verrou global
const confirmationLocks = new Set();

async function confirmLinkPlacementWithGlobalLock(requestId) {
  // Vérifier si une confirmation est déjà en cours pour cette demande
  if (confirmationLocks.has(requestId)) {
    console.log(`🔒 [TEST] Confirmation déjà en cours pour la demande: ${requestId.slice(0, 8)}...`);
    return { success: false, error: 'Confirmation déjà en cours' };
  }

  try {
    // Ajouter le verrou
    confirmationLocks.add(requestId);
    console.log(`🔒 [TEST] Début de confirmation pour la demande: ${requestId.slice(0, 8)}...`);
    
    // Récupérer la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings(title)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('❌ [TEST] Erreur récupération demande:', requestError);
      throw new Error('Demande non trouvée');
    }

    console.log(`✅ [TEST] Demande récupérée: ${request.link_listings?.title || 'Sans titre'}`);

    if (request.status !== 'pending_confirmation') {
      console.log(`⚠️  [TEST] Demande déjà traitée: ${request.status}`);
      throw new Error('Cette demande n\'est pas en attente de confirmation');
    }

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Annonceur non trouvé');
    }

    console.log(`✅ [TEST] Solde annonceur: ${advertiser.balance} MAD`);

    if (advertiser.balance < request.proposed_price) {
      throw new Error('Solde insuffisant pour confirmer cette demande');
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    console.log(`💰 [TEST] Calculs pour la demande ${requestId.slice(0, 8)}...`);
    console.log(`   Prix total: ${request.proposed_price} MAD`);
    console.log(`   Commission plateforme (10%): ${platformFee} MAD`);
    console.log(`   Montant éditeur: ${publisherAmount} MAD`);

    // Créer la transaction d'achat
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
        payment_method: 'balance'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ [TEST] Erreur création transaction:', transactionError);
      throw transactionError;
    }

    console.log(`✅ [TEST] Transaction créée: ${transaction.id.slice(0, 8)}...`);

    // Débiter l'annonceur
    console.log(`💳 [TEST] Débit de l'annonceur: ${advertiser.balance} MAD → ${advertiser.balance - request.proposed_price} MAD`);
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) {
      console.error('❌ [TEST] Erreur débit annonceur:', debitError);
      throw debitError;
    }
    console.log(`✅ [TEST] Annonceur débité avec succès de ${request.proposed_price} MAD`);

    // Récupérer le solde actuel de l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError) {
      console.log('⚠️  [TEST] Erreur récupération solde éditeur:', publisherError);
      throw new Error('Impossible de récupérer le solde de l\'éditeur');
    }

    console.log(`📊 [TEST] Solde éditeur avant crédit: ${publisher.balance} MAD`);

    // Créditer l'éditeur
    console.log(`💳 [TEST] Crédit de l'éditeur: ${publisher.balance} MAD → ${publisher.balance + publisherAmount} MAD`);
    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) {
      console.log('❌ [TEST] Erreur lors du crédit éditeur:', creditError);
      throw new Error('Erreur lors du crédit de l\'éditeur');
    }

    console.log(`✅ [TEST] Éditeur crédité avec succès de ${publisherAmount} MAD`);

    // Créer les transactions de crédit
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: request.user_id,
          type: 'purchase',
          amount: request.proposed_price,
          description: 'Achat de lien (test verrou global)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: request.publisher_id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien (test verrou global)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  [TEST] Erreur lors de la création des transactions de crédit:', creditTransactionError);
    } else {
      console.log(`✅ [TEST] Transactions de crédit créées avec succès`);
    }

    // Mettre à jour le statut de la demande
    console.log(`🔄 [TEST] Mise à jour du statut de la demande: pending_confirmation → confirmed`);
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('status', 'pending_confirmation');

    if (updateError) {
      console.log(`❌ [TEST] Erreur mise à jour statut: ${updateError.message}`);
      throw updateError;
    }
    console.log(`✅ [TEST] Statut de la demande mis à jour avec succès`);

    // Vérification finale des soldes
    const { data: finalAdvertiser } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    const { data: finalPublisher } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    console.log(`\n🎉 [TEST] RÉSULTATS FINAUX:`);
    console.log(`   Annonceur: ${finalAdvertiser?.balance} MAD (était: ${advertiser.balance} MAD)`);
    console.log(`   Éditeur: ${finalPublisher?.balance} MAD (était: ${publisher.balance} MAD)`);
    
    // Vérifier que l'éditeur a bien été crédité
    const expectedPublisherBalance = publisher.balance + publisherAmount;
    if (finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ L'éditeur a bien été crédité de ${publisherAmount} MAD !`);
    } else {
      console.log(`   ⚠️  ATTENTION: L'éditeur devrait avoir ${expectedPublisherBalance} MAD mais a ${finalPublisher?.balance} MAD`);
      console.log(`   Différence: ${Math.abs((finalPublisher?.balance || 0) - expectedPublisherBalance)} MAD`);
    }

    return { 
      success: true, 
      transaction_id: transaction.id,
      advertiser_balance: finalAdvertiser?.balance,
      publisher_balance: finalPublisher?.balance
    };

  } catch (error) {
    console.error('❌ [TEST] Erreur dans confirmLinkPlacement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  } finally {
    // Retirer le verrou
    confirmationLocks.delete(requestId);
    console.log(`🔓 [TEST] Verrou retiré pour la demande: ${requestId.slice(0, 8)}...`);
  }
}

async function createTestRequest() {
  try {
    // Récupérer l'annonceur et l'éditeur
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!advertiser || !publisher) {
      console.log('❌ Impossible de trouver les utilisateurs');
      return null;
    }

    // Récupérer un lien existant
    const { data: existingLink } = await supabase
      .from('link_listings')
      .select('id, title')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!existingLink) {
      console.log('❌ Aucun lien existant trouvé');
      return null;
    }

    // Créer une demande d'achat
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: existingLink.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-global-lock.com',
        anchor_text: 'Test verrou global',
        proposed_price: 15,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test du verrou global contre les appels multiples'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return null;
    }

    // Accepter la demande immédiatement
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-global-lock.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test verrou global'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return null;
    }

    return {
      requestId: purchaseRequest.id,
      advertiser,
      publisher,
      amount: 15
    };

  } catch (error) {
    console.error('❌ Erreur création demande de test:', error);
    return null;
  }
}

async function testGlobalLock() {
  try {
    console.log('📋 Création d\'une demande de test pour vérifier le verrou global...');
    
    // Créer une demande fraîche
    const testData = await createTestRequest();
    
    if (!testData) {
      console.log('❌ Impossible de créer une demande de test');
      return;
    }

    console.log(`✅ Demande de test créée: ${testData.requestId.slice(0, 8)}...`);
    console.log(`   Annonceur: ${testData.advertiser.email} (Solde: ${testData.advertiser.balance} MAD)`);
    console.log(`   Éditeur: ${testData.publisher.email} (Solde: ${testData.publisher.balance} MAD)`);
    console.log(`   Montant: ${testData.amount} MAD`);

    console.log('\n🔍 Test du verrou global:');

    // Test 1: Premier appel (devrait réussir)
    console.log('\n📋 TEST 1: Premier appel de confirmation...');
    const result1 = await confirmLinkPlacementWithGlobalLock(testData.requestId);

    if (result1.success) {
      console.log('✅ Premier appel réussi');
    } else {
      console.log('❌ Premier appel échoué:', result1.error);
    }

    // Test 2: Deuxième appel simultané (devrait être bloqué)
    console.log('\n📋 TEST 2: Deuxième appel simultané...');
    const result2 = await confirmLinkPlacementWithGlobalLock(testData.requestId);

    if (!result2.success && result2.error?.includes('déjà en cours')) {
      console.log('✅ Deuxième appel bloqué par le verrou global');
    } else {
      console.log('❌ Deuxième appel non bloqué:', result2.error);
    }

    // Test 3: Troisième appel après le premier (devrait échouer car déjà confirmé)
    console.log('\n📋 TEST 3: Troisième appel après confirmation...');
    const result3 = await confirmLinkPlacementWithGlobalLock(testData.requestId);

    if (!result3.success && result3.error?.includes('pas en attente de confirmation')) {
      console.log('✅ Troisième appel bloqué car demande déjà confirmée');
    } else {
      console.log('❌ Troisième appel non bloqué:', result3.error);
    }

    console.log('\n🎉 TEST TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testGlobalLock();
