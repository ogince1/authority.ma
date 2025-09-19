import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Simulation complète du processus de confirmation\n');

async function testCompleteConfirmationProcess() {
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
      return;
    }

    console.log(`🎯 AVANT CONFIRMATION:`);
    console.log(`   Annonceur: ${advertiser.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} MAD`);

    // Créer une demande de test complète
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
        target_url: 'https://test-complete-process.com',
        anchor_text: 'Test processus complet',
        proposed_price: 20,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test du processus complet de confirmation'
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
        placed_url: 'https://test-placement-complete.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test complet'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return;
    }

    console.log(`\n✅ Demande créée et acceptée: ${purchaseRequest.id.slice(0, 8)}...`);

    // SIMULATION EXACTE DE confirmLinkPlacement
    console.log('\n📋 SIMULATION DE confirmLinkPlacement...');
    
    const platformFee = purchaseRequest.proposed_price * 0.10;
    const publisherAmount = purchaseRequest.proposed_price - platformFee;

    console.log(`💰 Calculs:`);
    console.log(`   Prix total: ${purchaseRequest.proposed_price} MAD`);
    console.log(`   Commission: ${platformFee} MAD`);
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

    // Créer les transactions de crédit EXACTEMENT comme dans le code frontend
    console.log(`💳 Création des transactions de crédit...`);
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiser.id,
          type: 'purchase',
          amount: purchaseRequest.proposed_price,
          description: 'Achat de lien',
          currency: 'MAD',
          status: 'completed',
          balance_before: advertiser.balance,
          balance_after: advertiser.balance - purchaseRequest.proposed_price,
          related_link_listing_id: purchaseRequest.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: publisher.id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          balance_before: publisher.balance,
          balance_after: publisher.balance + publisherAmount,
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

    console.log(`✅ Statut mis à jour: confirmed`);

    // Attendre que les triggers se déclenchent
    console.log(`\n⏳ Attente de 5 secondes pour que les triggers se déclenchent...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vérifier les soldes finaux
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
    console.log(`   Annonceur: ${advertiser.balance} → ${finalAdvertiser?.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} → ${finalPublisher?.balance} MAD`);

    // Vérification
    const expectedAdvertiserBalance = advertiser.balance - purchaseRequest.proposed_price;
    const expectedPublisherBalance = publisher.balance + publisherAmount;

    console.log(`\n🔍 VÉRIFICATION:`);
    console.log(`   Annonceur attendu: ${expectedAdvertiserBalance} MAD`);
    console.log(`   Annonceur réel: ${finalAdvertiser?.balance} MAD`);
    
    if (finalAdvertiser?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ ANNONCEUR: DÉBITÉ CORRECTEMENT !`);
    } else {
      console.log(`   ❌ ANNONCEUR: PROBLÈME DE DÉBIT !`);
    }

    console.log(`   Éditeur attendu: ${expectedPublisherBalance} MAD`);
    console.log(`   Éditeur réel: ${finalPublisher?.balance} MAD`);
    
    if (finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ ÉDITEUR: CRÉDITÉ CORRECTEMENT !`);
    } else {
      console.log(`   ❌ ÉDITEUR: PROBLÈME DE CRÉDIT !`);
      console.log(`   Différence: ${Math.abs((finalPublisher?.balance || 0) - expectedPublisherBalance)} MAD`);
    }

    console.log(`\n🎉 CONCLUSION:`);
    if (finalAdvertiser?.balance === expectedAdvertiserBalance && finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ LE SYSTÈME FONCTIONNE PARFAITEMENT !`);
      console.log(`   Le problème doit être dans l'interface utilisateur`);
    } else {
      console.log(`   ❌ IL Y A UN PROBLÈME DANS LES TRIGGERS`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testCompleteConfirmationProcess();
