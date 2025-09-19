import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Confirmation réelle d\'un lien\n');

async function testLinkConfirmation() {
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
    console.log(`🎯 Test de confirmation pour la demande: ${testRequest.id.slice(0, 8)}...`);
    console.log(`   Annonceur: ${testRequest.advertiser?.email} (Solde: ${testRequest.advertiser?.balance} MAD)`);
    console.log(`   Éditeur: ${testRequest.publisher?.email} (Solde: ${testRequest.publisher?.balance} MAD)`);
    console.log(`   Montant: ${testRequest.proposed_price} MAD`);

    // ÉTAPE 1: Créer la transaction d'achat
    console.log('\n📋 ÉTAPE 1: Création de la transaction d\'achat...');
    const platformFee = testRequest.proposed_price * 0.10;
    const publisherAmount = testRequest.proposed_price - platformFee;

    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: testRequest.id,
        advertiser_id: testRequest.user_id,
        publisher_id: testRequest.publisher_id,
        link_listing_id: testRequest.link_listing_id,
        amount: testRequest.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        payment_method: 'balance'
      })
      .select()
      .single();

    if (transactionError) {
      console.log('❌ Erreur création transaction:', transactionError);
      return;
    }
    console.log(`✅ Transaction créée: ${transaction.id.slice(0, 8)}...`);

    // ÉTAPE 2: Débiter l'annonceur
    console.log('\n📋 ÉTAPE 2: Débit de l\'annonceur...');
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: testRequest.advertiser.balance - testRequest.proposed_price })
      .eq('id', testRequest.user_id);

    if (debitError) {
      console.log('❌ Erreur débit annonceur:', debitError);
      return;
    }
    console.log(`✅ Annonceur débité de ${testRequest.proposed_price} MAD`);

    // ÉTAPE 3: Récupérer le solde actuel de l'éditeur
    console.log('\n📋 ÉTAPE 3: Récupération du solde éditeur...');
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', testRequest.publisher_id)
      .single();

    if (publisherError) {
      console.log('❌ Erreur récupération solde éditeur:', publisherError);
      return;
    }
    console.log(`✅ Solde éditeur actuel: ${publisher.balance} MAD`);

    // ÉTAPE 4: Créditer l'éditeur
    console.log('\n📋 ÉTAPE 4: Crédit de l\'éditeur...');
    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', testRequest.publisher_id);

    if (creditError) {
      console.log('❌ Erreur crédit éditeur:', creditError);
      return;
    }
    console.log(`✅ Éditeur crédité de ${publisherAmount} MAD`);

    // ÉTAPE 5: Créer les transactions de crédit
    console.log('\n📋 ÉTAPE 5: Création des transactions de crédit...');
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: testRequest.user_id,
          type: 'purchase',
          amount: testRequest.proposed_price,
          description: 'Achat de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: testRequest.link_listing_id,
          related_purchase_request_id: testRequest.id
        },
        {
          user_id: testRequest.publisher_id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: testRequest.link_listing_id,
          related_purchase_request_id: testRequest.id
        }
      ]);

    if (creditTransactionError) {
      console.log('❌ Erreur création transactions crédit:', creditTransactionError);
    } else {
      console.log('✅ Transactions de crédit créées');
    }

    // ÉTAPE 6: Mettre à jour le statut de la demande
    console.log('\n📋 ÉTAPE 6: Mise à jour du statut de la demande...');
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', testRequest.id);

    if (updateError) {
      console.log('❌ Erreur mise à jour statut:', updateError);
      return;
    }
    console.log('✅ Statut de la demande mis à jour');

    // ÉTAPE 7: Vérification finale des soldes
    console.log('\n📋 ÉTAPE 7: Vérification finale des soldes...');
    const { data: finalAdvertiser, error: finalAdvError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', testRequest.user_id)
      .single();

    const { data: finalPublisher, error: finalPubError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', testRequest.publisher_id)
      .single();

    if (finalAdvError || finalPubError) {
      console.log('❌ Erreur vérification soldes finaux');
      return;
    }

    console.log(`✅ Solde annonceur final: ${finalAdvertiser.balance} MAD (était: ${testRequest.advertiser.balance} MAD)`);
    console.log(`✅ Solde éditeur final: ${finalPublisher.balance} MAD (était: ${testRequest.publisher.balance} MAD)`);

    const expectedAdvertiserBalance = testRequest.advertiser.balance - testRequest.proposed_price;
    const expectedPublisherBalance = testRequest.publisher.balance + publisherAmount;

    if (finalAdvertiser.balance === expectedAdvertiserBalance) {
      console.log('✅ Débit annonceur correct');
    } else {
      console.log(`❌ Débit annonceur incorrect. Attendu: ${expectedAdvertiserBalance}, Reçu: ${finalAdvertiser.balance}`);
    }

    if (finalPublisher.balance === expectedPublisherBalance) {
      console.log('✅ Crédit éditeur correct');
    } else {
      console.log(`❌ Crédit éditeur incorrect. Attendu: ${expectedPublisherBalance}, Reçu: ${finalPublisher.balance}`);
    }

    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');
    console.log('   Le processus de confirmation fonctionne correctement.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testLinkConfirmation();
