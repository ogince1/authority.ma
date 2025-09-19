import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Vérification des triggers côté backend uniquement\n');

async function testBackendTriggers() {
  try {
    // Récupérer l'annonceur et l'éditeur
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!advertiser || !publisher) {
      console.log('❌ Impossible de trouver les utilisateurs');
      return;
    }

    console.log(`🎯 Annonceur: ${advertiser.email}`);
    console.log(`   Solde actuel: ${advertiser.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(advertiser.updated_at).toLocaleString()}`);

    console.log(`🎯 Éditeur: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(publisher.updated_at).toLocaleString()}`);

    // Créer une demande de test
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
        target_url: 'https://test-backend-triggers.com',
        anchor_text: 'Test triggers backend',
        proposed_price: 40,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test des triggers côté backend uniquement'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return;
    }

    // Accepter la demande
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-backend-triggers.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test triggers backend'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return;
    }

    console.log(`\n✅ Demande de test créée: ${purchaseRequest.id.slice(0, 8)}...`);

    // TEST: Simuler la fonction confirmLinkPlacement simplifiée
    console.log('\n🔍 TEST: Simulation de confirmLinkPlacement simplifiée...');
    
    const platformFee = purchaseRequest.proposed_price * 0.10;
    const publisherAmount = purchaseRequest.proposed_price - platformFee;

    console.log(`💰 Calculs pour la demande ${purchaseRequest.id.slice(0, 8)}...`);
    console.log(`   Prix total: ${purchaseRequest.proposed_price} MAD`);
    console.log(`   Commission plateforme (10%): ${platformFee} MAD`);
    console.log(`   Montant éditeur: ${publisherAmount} MAD`);

    // Créer la transaction d'achat
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: purchaseRequest.id,
        advertiser_id: advertiser.id,
        publisher_id: publisher.id,
        link_listing_id: purchaseRequest.link_listing_id,
        amount: purchaseRequest.proposed_price,
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

    // Créer les transactions de crédit (les triggers vont s'occuper des soldes)
    console.log(`💳 Création des transactions de crédit...`);
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiser.id,
          type: 'purchase',
          amount: purchaseRequest.proposed_price,
          description: 'Achat de lien (test triggers backend)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: purchaseRequest.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: publisher.id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien (test triggers backend)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: purchaseRequest.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);

    if (creditTransactionError) {
      console.log('❌ Erreur création transactions de crédit:', creditTransactionError);
      return;
    }

    console.log(`✅ Transactions de crédit créées avec succès`);

    // Mettre à jour le statut de la demande
    console.log(`🔄 Mise à jour du statut de la demande: pending_confirmation → confirmed`);
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseRequest.id)
      .eq('status', 'pending_confirmation');

    if (updateError) {
      console.log(`❌ Erreur mise à jour statut: ${updateError.message}`);
      return;
    }
    console.log(`✅ Statut de la demande mis à jour avec succès`);

    // Attendre un peu pour que les triggers se déclenchent côté backend
    console.log(`\n⏳ Attente de 5 secondes pour que les triggers backend se déclenchent...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vérifier les soldes après les triggers
    console.log(`\n📋 VÉRIFICATION DES SOLDES APRÈS LES TRIGGERS BACKEND:`);
    
    const { data: finalAdvertiser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    const { data: finalPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`\n🎯 RÉSULTATS FINAUX:`);
    console.log(`   Annonceur: ${advertiser.balance} MAD → ${finalAdvertiser?.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} MAD → ${finalPublisher?.balance} MAD`);

    // Vérifier si les triggers ont fonctionné
    const expectedAdvertiserBalance = advertiser.balance - purchaseRequest.proposed_price;
    const expectedPublisherBalance = publisher.balance + publisherAmount;

    console.log(`\n🔍 VÉRIFICATION:`);
    console.log(`   Annonceur attendu: ${expectedAdvertiserBalance} MAD`);
    console.log(`   Annonceur réel: ${finalAdvertiser?.balance} MAD`);
    console.log(`   Éditeur attendu: ${expectedPublisherBalance} MAD`);
    console.log(`   Éditeur réel: ${finalPublisher?.balance} MAD`);

    if (finalAdvertiser?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ TRIGGER ANNOUNCEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER ANNOUNCEUR: NE FONCTIONNE PAS !`);
    }

    if (finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ TRIGGER ÉDITEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER ÉDITEUR: NE FONCTIONNE PAS !`);
    }

    console.log(`\n🎉 TEST TERMINÉ !`);
    console.log(`   Les triggers sont entièrement gérés côté backend`);
    console.log(`   Le frontend n'a qu'à créer les transactions`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testBackendTriggers();
