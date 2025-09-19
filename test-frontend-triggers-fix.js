import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Frontend corrigé avec triggers automatiques\n');

async function testFrontendTriggersFixed() {
  try {
    // Récupérer les utilisateurs
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
      console.log('❌ Utilisateurs non trouvés');
      return;
    }

    console.log(`🎯 SOLDES AVANT TEST:`);
    console.log(`   Annonceur: ${advertiser.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} MAD`);

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

    // Créer et accepter une demande
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: existingLink.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-frontend-triggers-fix.com',
        anchor_text: 'Test frontend corrigé',
        proposed_price: 30,
        proposed_duration: 1,
        status: 'pending_confirmation', // Directement en attente de confirmation
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-frontend-fix.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test frontend corrigé',
        message: 'Test du frontend corrigé avec triggers automatiques'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return;
    }

    console.log(`\n✅ Demande créée: ${purchaseRequest.id.slice(0, 8)}...`);

    // SIMULATION EXACTE DU FRONTEND CORRIGÉ
    console.log('\n📋 SIMULATION DU FRONTEND CORRIGÉ...');
    
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

    console.log(`✅ Transaction d'achat créée: ${transaction.id.slice(0, 8)}...`);

    // Créer les transactions de crédit SANS balance_before et balance_after
    console.log(`💳 Création des transactions de crédit - les triggers vont calculer automatiquement...`);
    
    const { data: creditTransactions, error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiser.id,
          type: 'purchase',
          amount: purchaseRequest.proposed_price,
          description: 'Achat de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: purchaseRequest.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
          // balance_before et balance_after calculés par les triggers
        },
        {
          user_id: publisher.id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: purchaseRequest.link_listing_id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
          // balance_before et balance_after calculés par les triggers
        }
      ])
      .select();

    if (creditTransactionError) {
      console.log('❌ Erreur création transactions de crédit:', creditTransactionError);
      console.log('   Code:', creditTransactionError.code);
      console.log('   Message:', creditTransactionError.message);
      console.log('   Détails:', creditTransactionError.details);
      return;
    }

    console.log(`✅ Transactions de crédit créées: ${creditTransactions?.length || 0}`);
    
    creditTransactions?.forEach((trans, index) => {
      const userType = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
      console.log(`      Balance before: ${trans.balance_before} MAD (calculé par trigger)`);
      console.log(`      Balance after: ${trans.balance_after} MAD (calculé par trigger)`);
    });

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseRequest.id);

    if (updateError) {
      console.log(`❌ Erreur mise à jour statut: ${updateError.message}`);
      return;
    }

    console.log(`✅ Statut mis à jour: confirmed`);

    // Vérifier les soldes après 3 secondes
    console.log('\n⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

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
      console.log(`   ✅ ANNONCEUR: TRIGGER FONCTIONNE AVEC LE FRONTEND CORRIGÉ !`);
    } else {
      console.log(`   ❌ ANNONCEUR: PROBLÈME AVEC LE FRONTEND CORRIGÉ !`);
    }

    console.log(`   Éditeur attendu: ${expectedPublisherBalance} MAD`);
    console.log(`   Éditeur réel: ${finalPublisher?.balance} MAD`);
    
    if (finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ ÉDITEUR: TRIGGER FONCTIONNE AVEC LE FRONTEND CORRIGÉ !`);
    } else {
      console.log(`   ❌ ÉDITEUR: PROBLÈME AVEC LE FRONTEND CORRIGÉ !`);
    }

    console.log(`\n🎉 CONCLUSION:`);
    if (finalAdvertiser?.balance === expectedAdvertiserBalance && finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ LE FRONTEND CORRIGÉ FONCTIONNE PARFAITEMENT AVEC LES TRIGGERS !`);
    } else {
      console.log(`   ❌ IL Y A ENCORE UN PROBLÈME AVEC L'INTÉGRATION FRONTEND-TRIGGERS`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testFrontendTriggersFixed();
