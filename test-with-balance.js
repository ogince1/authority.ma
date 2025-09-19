import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Confirmation avec solde suffisant\n');

async function testWithBalance() {
  try {
    // Récupérer l'annonceur avec solde
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
      return;
    }

    console.log(`✅ Annonceur: ${advertiser.email} (Solde: ${advertiser.balance} MAD)`);
    console.log(`✅ Éditeur: ${publisher.email} (Solde: ${publisher.balance} MAD)`);

    // Récupérer un lien existant
    const { data: existingLink } = await supabase
      .from('link_listings')
      .select('id, title')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!existingLink) {
      console.log('❌ Aucun lien existant trouvé');
      return;
    }

    // Créer une demande d'achat
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: existingLink.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-balance.com',
        anchor_text: 'Test avec solde',
        proposed_price: 30,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test avec solde suffisant'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return;
    }

    // Accepter la demande immédiatement
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-balance.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test avec solde'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return;
    }

    console.log(`✅ Demande créée: ${purchaseRequest.id.slice(0, 8)}...`);

    // Maintenant tester la confirmation
    console.log('\n🔍 Test de la confirmation:');

    // Récupérer la demande
    const { data: request, error: requestError2 } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings(title)
      `)
      .eq('id', purchaseRequest.id)
      .single();

    if (requestError2 || !request) {
      console.error('❌ Erreur récupération demande:', requestError2);
      return;
    }

    console.log(`✅ Demande récupérée: ${request.link_listings?.title || 'Sans titre'}`);

    // Vérifier le solde de l'annonceur
    const { data: advertiserCheck, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError || !advertiserCheck) {
      throw new Error('Annonceur non trouvé');
    }

    console.log(`✅ Solde annonceur: ${advertiserCheck.balance} MAD`);

    if (advertiserCheck.balance < request.proposed_price) {
      console.log(`❌ Solde insuffisant: ${advertiserCheck.balance} MAD < ${request.proposed_price} MAD`);
      return;
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    console.log(`💰 Calculs pour la demande ${purchaseRequest.id.slice(0, 8)}...`);
    console.log(`   Prix total: ${request.proposed_price} MAD`);
    console.log(`   Commission plateforme (10%): ${platformFee} MAD`);
    console.log(`   Montant éditeur: ${publisherAmount} MAD`);

    // Créer la transaction d'achat
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: purchaseRequest.id,
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
      return;
    }

    console.log(`✅ Transaction créée: ${transaction.id.slice(0, 8)}...`);

    // Débiter l'annonceur
    console.log(`💳 Débit de l'annonceur: ${advertiserCheck.balance} MAD → ${advertiserCheck.balance - request.proposed_price} MAD`);
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiserCheck.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) {
      console.error('❌ Erreur débit annonceur:', debitError);
      return;
    }
    console.log(`✅ Annonceur débité avec succès de ${request.proposed_price} MAD`);

    // Récupérer le solde actuel de l'éditeur
    const { data: publisherCheck, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError) {
      console.log('⚠️  Erreur récupération solde éditeur:', publisherError);
      return;
    }

    console.log(`📊 Solde éditeur avant crédit: ${publisherCheck.balance} MAD`);

    // Créditer l'éditeur
    console.log(`💳 Crédit de l'éditeur: ${publisherCheck.balance} MAD → ${publisherCheck.balance + publisherAmount} MAD`);
    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisherCheck.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) {
      console.log('❌ Erreur lors du crédit éditeur:', creditError);
      return;
    }

    console.log(`✅ Éditeur crédité avec succès de ${publisherAmount} MAD`);

    // Créer les transactions de crédit
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: request.user_id,
          type: 'purchase',
          amount: request.proposed_price,
          description: 'Achat de lien (test avec solde)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: request.publisher_id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien (test avec solde)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  Erreur lors de la création des transactions de crédit:', creditTransactionError);
    } else {
      console.log(`✅ Transactions de crédit créées avec succès`);
    }

    // Mettre à jour le statut de la demande
    console.log(`🔄 Mise à jour du statut de la demande: pending_confirmation → confirmed`);
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseRequest.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour statut:', updateError);
      return;
    }
    console.log(`✅ Statut de la demande mis à jour avec succès`);

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

    console.log(`\n🎉 RÉSULTATS FINAUX:`);
    console.log(`   Annonceur: ${finalAdvertiser?.balance} MAD (était: ${advertiserCheck.balance} MAD)`);
    console.log(`   Éditeur: ${finalPublisher?.balance} MAD (était: ${publisherCheck.balance} MAD)`);
    
    // Vérifier que l'éditeur a bien été crédité
    const expectedPublisherBalance = publisherCheck.balance + publisherAmount;
    if (finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ L'éditeur a bien été crédité de ${publisherAmount} MAD !`);
    } else {
      console.log(`   ⚠️  ATTENTION: L'éditeur devrait avoir ${expectedPublisherBalance} MAD mais a ${finalPublisher?.balance} MAD`);
      console.log(`   Différence: ${Math.abs((finalPublisher?.balance || 0) - expectedPublisherBalance)} MAD`);
    }

    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testWithBalance();
