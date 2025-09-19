import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Création et confirmation d\'une demande fraîche\n');

async function createFreshTestRequest() {
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

    console.log(`✅ Annonceur: ${advertiser.email} (Solde: ${advertiser.balance} MAD)`);
    console.log(`✅ Éditeur: ${publisher.email} (Solde: ${publisher.balance} MAD)`);

    // Récupérer un lien existant ou créer un lien de test
    const { data: existingLink } = await supabase
      .from('link_listings')
      .select('id, title')
      .eq('status', 'active')
      .limit(1)
      .single();

    let linkListingId;
    if (existingLink) {
      linkListingId = existingLink.id;
      console.log(`✅ Lien existant utilisé: ${existingLink.title}`);
    } else {
      // Créer un lien de test
      const { data: newLink, error: linkError } = await supabase
        .from('link_listings')
        .insert({
          title: 'Lien de test pour confirmation',
          description: 'Test de confirmation',
          url: 'https://test.com',
          price: 100,
          type: 'dofollow',
          category: 'test',
          status: 'active',
          user_id: publisher.id
        })
        .select()
        .single();

      if (linkError) {
        console.log('❌ Erreur création lien de test:', linkError);
        return null;
      }

      linkListingId = newLink.id;
      console.log(`✅ Lien de test créé: ${newLink.title}`);
    }

    // Créer une demande d'achat
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: linkListingId,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://target-test.com',
        anchor_text: 'Test de confirmation',
        proposed_price: 100,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test de confirmation automatique'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return null;
    }

    console.log(`✅ Demande créée: ${purchaseRequest.id.slice(0, 8)}...`);

    // Accepter la demande immédiatement
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return null;
    }

    console.log('✅ Demande acceptée et mise en attente de confirmation');

    return {
      requestId: purchaseRequest.id,
      advertiser,
      publisher,
      amount: 100
    };

  } catch (error) {
    console.error('❌ Erreur création demande de test:', error);
    return null;
  }
}

// Simulation de la fonction confirmLinkPlacement du frontend
async function confirmLinkPlacement(requestId) {
  try {
    console.log(`\n🎯 Confirmation de la demande: ${requestId.slice(0, 8)}...`);

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
      console.error('❌ Erreur récupération demande:', requestError);
      throw new Error('Demande non trouvée');
    }

    console.log(`✅ Demande récupérée: ${request.link_listings?.title || 'Sans titre'}`);

    if (request.status !== 'pending_confirmation') {
      throw new Error('Cette demande n\'est pas en attente de confirmation');
    }

    // Vérifier que la demande n'a pas expiré (48h)
    const deadline = new Date(request.accepted_at || request.response_date);
    deadline.setHours(deadline.getHours() + 48);
    
    if (new Date() > deadline) {
      throw new Error('Le délai de confirmation a expiré');
    }

    console.log('✅ Demande valide et non expirée');

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Annonceur non trouvé');
    }

    console.log(`✅ Solde annonceur: ${advertiser.balance} MAD`);

    if (advertiser.balance < request.proposed_price) {
      throw new Error('Solde insuffisant pour confirmer cette demande');
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10; // 10% de commission
    const publisherAmount = request.proposed_price - platformFee;

    console.log(`✅ Calculs: Prix=${request.proposed_price} MAD, Commission=${platformFee} MAD, Éditeur=${publisherAmount} MAD`);

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
      console.error('❌ Erreur création transaction:', transactionError);
      throw transactionError;
    }

    console.log(`✅ Transaction créée: ${transaction.id.slice(0, 8)}...`);

    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) {
      console.error('❌ Erreur débit annonceur:', debitError);
      throw debitError;
    }

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

    console.log(`✅ Solde éditeur actuel: ${publisher.balance} MAD`);

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

    // Créer les transactions de crédit
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
      console.log('⚠️  Erreur lors de la création des transactions de crédit:', creditTransactionError);
    } else {
      console.log('✅ Transactions de crédit créées');
    }

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Erreur mise à jour statut:', updateError);
      throw updateError;
    }

    console.log('✅ Statut de la demande mis à jour');

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

    console.log(`\n📊 RÉSULTATS FINAUX:`);
    console.log(`   Annonceur: ${finalAdvertiser?.balance} MAD (était: ${advertiser.balance} MAD)`);
    console.log(`   Éditeur: ${finalPublisher?.balance} MAD (était: ${publisher.balance} MAD)`);

    return { 
      success: true, 
      transaction_id: transaction.id,
      advertiser_balance: finalAdvertiser?.balance,
      publisher_balance: finalPublisher?.balance
    };

  } catch (error) {
    console.error('❌ Erreur dans confirmLinkPlacement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

async function testFreshConfirmation() {
  try {
    // Créer une demande fraîche
    const testData = await createFreshTestRequest();
    
    if (!testData) {
      console.log('❌ Impossible de créer une demande de test');
      return;
    }

    console.log(`\n🎯 Test avec la demande fraîche: ${testData.requestId.slice(0, 8)}...`);
    console.log(`   Annonceur: ${testData.advertiser.email} (Solde: ${testData.advertiser.balance} MAD)`);
    console.log(`   Éditeur: ${testData.publisher.email} (Solde: ${testData.publisher.balance} MAD)`);
    console.log(`   Montant: ${testData.amount} MAD`);

    // Tester la fonction confirmLinkPlacement
    const result = await confirmLinkPlacement(testData.requestId);

    if (result.success) {
      console.log('\n🎉 CONFIRMATION RÉUSSIE !');
      console.log(`   Transaction ID: ${result.transaction_id?.slice(0, 8)}...`);
      console.log(`   Solde annonceur final: ${result.advertiser_balance} MAD`);
      console.log(`   Solde éditeur final: ${result.publisher_balance} MAD`);
      
      // Vérifier que l'éditeur a bien reçu l'argent
      const expectedPublisherBalance = testData.publisher.balance + (testData.amount - (testData.amount * 0.10));
      if (result.publisher_balance === expectedPublisherBalance) {
        console.log('✅ L\'éditeur a bien reçu l\'argent !');
      } else {
        console.log(`❌ Problème: L'éditeur devrait avoir ${expectedPublisherBalance} MAD mais a ${result.publisher_balance} MAD`);
      }
    } else {
      console.log('\n❌ CONFIRMATION ÉCHOUÉE !');
      console.log(`   Erreur: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testFreshConfirmation();
