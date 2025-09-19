import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Simulation de la fonction confirmLinkPlacement du frontend\n');

// Simulation de la fonction confirmLinkPlacement du frontend
async function confirmLinkPlacement(requestId) {
  try {
    console.log(`🎯 Confirmation de la demande: ${requestId.slice(0, 8)}...`);

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
      console.log('⚠️  Erreur lors de la création des transactions de crédit:', creditTransactionError);
      // This is the error the user was previously reporting (42501 RLS)
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

async function testFrontendConfirmation() {
  try {
    // Récupérer une demande en attente de confirmation
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        advertiser:users!link_purchase_requests_user_id_fkey(id, email, balance),
        publisher:users!link_purchase_requests_publisher_id_fkey(id, email, balance),
        link_listing:link_listings(id, title)
      `)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false })
      .limit(1);

    if (requestsError || !pendingRequests || pendingRequests.length === 0) {
      console.log('❌ Aucune demande en attente de confirmation trouvée');
      return;
    }

    const testRequest = pendingRequests[0];
    console.log(`🎯 Test avec la demande: ${testRequest.id.slice(0, 8)}...`);
    console.log(`   Annonceur: ${testRequest.advertiser?.email} (Solde: ${testRequest.advertiser?.balance} MAD)`);
    console.log(`   Éditeur: ${testRequest.publisher?.email} (Solde: ${testRequest.publisher?.balance} MAD)`);
    console.log(`   Montant: ${testRequest.proposed_price} MAD\n`);

    // Tester la fonction confirmLinkPlacement
    const result = await confirmLinkPlacement(testRequest.id);

    if (result.success) {
      console.log('\n🎉 CONFIRMATION RÉUSSIE !');
      console.log(`   Transaction ID: ${result.transaction_id?.slice(0, 8)}...`);
      console.log(`   Solde annonceur final: ${result.advertiser_balance} MAD`);
      console.log(`   Solde éditeur final: ${result.publisher_balance} MAD`);
    } else {
      console.log('\n❌ CONFIRMATION ÉCHOUÉE !');
      console.log(`   Erreur: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testFrontendConfirmation();
