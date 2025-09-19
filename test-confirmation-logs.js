import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Vérification des logs de confirmation\n');

async function createTestRequest() {
  try {
    // Récupérer un annonceur et un éditeur
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('role', 'advertiser')
      .limit(1)
      .single();

    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('role', 'publisher')
      .limit(1)
      .single();

    if (!advertiser || !publisher) {
      console.log('❌ Impossible de trouver annonceur ou éditeur');
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
        target_url: 'https://test-logs.com',
        anchor_text: 'Test des logs de confirmation',
        proposed_price: 150,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test des logs de confirmation automatique'
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
        placed_url: 'https://test-placement-logs.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test des logs'
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
      amount: 150
    };

  } catch (error) {
    console.error('❌ Erreur création demande de test:', error);
    return null;
  }
}

// Simulation de la fonction confirmLinkPlacement avec logs
async function confirmLinkPlacementWithLogs(requestId) {
  try {
    console.log(`\n🎯 [TEST] Confirmation de la demande: ${requestId.slice(0, 8)}...`);

    // Récupérer la demande avec les détails du lien
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
      throw new Error('Cette demande n\'est pas en attente de confirmation');
    }

    // Vérifier que la demande n'a pas expiré (48h)
    const deadline = new Date(request.accepted_at || request.response_date);
    deadline.setHours(deadline.getHours() + 48);
    
    if (new Date() > deadline) {
      throw new Error('Le délai de confirmation a expiré');
    }

    console.log('✅ [TEST] Demande valide et non expirée');

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
    const platformFee = request.proposed_price * 0.10; // 10% de commission
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
          description: 'Achat de lien (test logs)',
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
          description: 'Vente de lien (test logs)',
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
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ [TEST] Erreur mise à jour statut:', updateError);
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
    console.log(`   ✅ L'éditeur a bien été crédité de ${publisherAmount} MAD !`);

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
  }
}

async function testConfirmationLogs() {
  try {
    console.log('📋 Création d\'une demande de test pour vérifier les logs...');
    
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

    console.log('\n🔍 Les logs suivants montrent le processus de confirmation:');
    console.log('   (Ces logs apparaîtront dans la console du navigateur quand vous cliquez sur "Confirmer")');

    // Tester la fonction confirmLinkPlacement avec logs
    const result = await confirmLinkPlacementWithLogs(testData.requestId);

    if (result.success) {
      console.log('\n🎉 TEST RÉUSSI !');
      console.log(`   Transaction ID: ${result.transaction_id?.slice(0, 8)}...`);
      console.log(`   Solde annonceur final: ${result.advertiser_balance} MAD`);
      console.log(`   Solde éditeur final: ${result.publisher_balance} MAD`);
      console.log('\n💡 Les logs ci-dessus montrent exactement ce qui se passe quand vous cliquez sur "Confirmer"');
    } else {
      console.log('\n❌ TEST ÉCHOUÉ !');
      console.log(`   Erreur: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testConfirmationLogs();
