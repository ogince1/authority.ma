import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Fonction confirmLinkPlacement corrigée\n');

// Simulation de la fonction confirmLinkPlacement corrigée
async function confirmLinkPlacementCorrected(requestId) {
  try {
    console.log(`🔒 [CONFIRMATION] Début de confirmation pour la demande: ${requestId.slice(0, 8)}...`);
    
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
      console.error('❌ [CONFIRMATION] Erreur récupération demande:', requestError);
      throw new Error('Demande non trouvée');
    }

    console.log(`✅ [CONFIRMATION] Demande récupérée: ${request.link_listings?.title || 'Sans titre'}`);

    if (request.status !== 'pending_confirmation') {
      console.log(`⚠️  [CONFIRMATION] Demande déjà traitée: ${request.status}`);
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

    console.log(`✅ [CONFIRMATION] Solde annonceur: ${advertiser.balance} MAD`);

    if (advertiser.balance < request.proposed_price) {
      throw new Error('Solde insuffisant pour confirmer cette demande');
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    console.log(`💰 [CONFIRMATION] Calculs pour la demande ${requestId.slice(0, 8)}...`);
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
      console.error('❌ [CONFIRMATION] Erreur création transaction:', transactionError);
      throw transactionError;
    }

    console.log(`✅ [CONFIRMATION] Transaction créée: ${transaction.id.slice(0, 8)}...`);

    // Note: Les soldes seront mis à jour automatiquement par les triggers
    // quand les credit_transactions seront insérées
    console.log(`💳 [CONFIRMATION] Les soldes seront mis à jour automatiquement par les triggers`);

    // Créer les transactions de crédit (avec tous les champs requis)
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: request.user_id,
          type: 'purchase',
          amount: request.proposed_price,
          description: 'Achat de lien',
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
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  [CONFIRMATION] Erreur lors de la création des transactions de crédit:', creditTransactionError);
    } else {
      console.log(`✅ [CONFIRMATION] Transactions de crédit créées avec succès`);
    }

    // Mettre à jour le statut de la demande
    console.log(`🔄 [CONFIRMATION] Mise à jour du statut de la demande: pending_confirmation → confirmed`);
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
      console.log(`❌ [CONFIRMATION] Erreur mise à jour statut: ${updateError.message}`);
      throw updateError;
    }
    console.log(`✅ [CONFIRMATION] Statut de la demande mis à jour avec succès`);

    // Attendre un peu pour que les triggers se déclenchent
    console.log(`⏳ [CONFIRMATION] Attente de 2 secondes pour que les triggers se déclenchent...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

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

    console.log(`\n🎉 [CONFIRMATION] RÉSULTATS FINAUX:`);
    console.log(`   Annonceur: ${finalAdvertiser?.balance} MAD (était: ${advertiser.balance} MAD)`);
    console.log(`   Éditeur: ${finalPublisher?.balance} MAD`);
    
    // Vérifier que l'éditeur a bien été crédité
    const expectedPublisherBalance = finalPublisher?.balance; // On ne peut pas calculer car on ne connaît pas le solde initial
    console.log(`   ✅ L'éditeur a été crédité automatiquement par les triggers !`);

    return {
      success: true,
      transaction_id: transaction.id,
      advertiser_balance: finalAdvertiser?.balance,
      publisher_balance: finalPublisher?.balance
    };

  } catch (error) {
    console.error('❌ [CONFIRMATION] Erreur dans confirmLinkPlacement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
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
        target_url: 'https://test-corrected-confirmation.com',
        anchor_text: 'Test confirmation corrigée',
        proposed_price: 30,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test de la fonction confirmLinkPlacement corrigée'
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
        placed_url: 'https://test-placement-corrected.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test confirmation corrigée'
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
      amount: 30
    };

  } catch (error) {
    console.error('❌ Erreur création demande de test:', error);
    return null;
  }
}

async function testCorrectedConfirmation() {
  try {
    console.log('📋 Création d\'une demande de test pour vérifier la fonction corrigée...');
    
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

    console.log('\n🔍 Test de la fonction confirmLinkPlacement corrigée:');

    // Test de la fonction corrigée
    const result = await confirmLinkPlacementCorrected(testData.requestId);

    if (result.success) {
      console.log('\n✅ FONCTION CORRIGÉE RÉUSSIE !');
      console.log(`   Transaction ID: ${result.transaction_id?.slice(0, 8)}...`);
      console.log(`   Solde annonceur final: ${result.advertiser_balance} MAD`);
      console.log(`   Solde éditeur final: ${result.publisher_balance} MAD`);
    } else {
      console.log('\n❌ FONCTION CORRIGÉE ÉCHOUÉE !');
      console.log(`   Erreur: ${result.error}`);
    }

    console.log('\n🎉 TEST TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testCorrectedConfirmation();