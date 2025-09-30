import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Créer une demande et tester le processus complet\n');

async function createAndTestReal() {
  try {
    // Récupérer les utilisateurs
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
      console.log('❌ Utilisateurs non trouvés');
      return;
    }

    console.log(`🎯 SOLDES INITIAUX:`);
    console.log(`   Annonceur (${advertiser.email}): ${advertiser.balance} MAD`);
    console.log(`   Éditeur (${publisher.email}): ${publisher.balance} MAD`);

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

    // ÉTAPE 1: Créer une demande d'achat
    console.log('\n📋 ÉTAPE 1: Création d\'une demande d\'achat...');
    
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: existingLink.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-create-and-test.com',
        anchor_text: 'Test création et test',
        proposed_price: 25,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test complet du processus'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return;
    }

    console.log(`✅ Demande créée: ${purchaseRequest.id.slice(0, 8)}...`);

    // ÉTAPE 2: Accepter la demande (comme le ferait l'éditeur)
    console.log('\n📋 ÉTAPE 2: Acceptation de la demande par l\'éditeur...');
    
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-create-and-test.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test complet'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return;
    }

    console.log(`✅ Demande acceptée et en attente de confirmation`);

    // ÉTAPE 3: Confirmation EXACTE comme dans le frontend
    console.log('\n📋 ÉTAPE 3: Confirmation EXACTE comme dans le frontend...');
    
    // Calculer les montants
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

    // Créer les transactions de crédit EXACTEMENT comme dans le frontend
    console.log(`💳 Création des transactions de crédit...`);
    
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
      console.log(`      Balance before: ${trans.balance_before} MAD`);
      console.log(`      Balance after: ${trans.balance_after} MAD`);
    });

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

    // ÉTAPE 4: Vérification immédiate des soldes dans la table users
    console.log('\n📋 ÉTAPE 4: Vérification IMMÉDIATE des soldes dans la table users...');
    
    const { data: advertiserImmediate } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    const { data: publisherImmediate } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`📊 SOLDES IMMÉDIATS (0 seconde d'attente):`);
    console.log(`   Annonceur: ${advertiser.balance} → ${advertiserImmediate?.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} → ${publisherImmediate?.balance} MAD`);

    // ÉTAPE 5: Vérification après 3 secondes
    console.log('\n📋 ÉTAPE 5: Vérification après 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: advertiserDelayed } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    const { data: publisherDelayed } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`📊 SOLDES APRÈS 3 SECONDES:`);
    console.log(`   Annonceur: ${advertiser.balance} → ${advertiserDelayed?.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} → ${publisherDelayed?.balance} MAD`);

    // ÉTAPE 6: Analyse finale
    console.log('\n📋 ÉTAPE 6: Analyse finale...');
    
    const expectedAdvertiserBalance = advertiser.balance - purchaseRequest.proposed_price;
    const expectedPublisherBalance = publisher.balance + publisherAmount;

    console.log(`🔍 ATTENDU:`);
    console.log(`   Annonceur: ${expectedAdvertiserBalance} MAD`);
    console.log(`   Éditeur: ${expectedPublisherBalance} MAD`);

    console.log(`🔍 RÉEL (après 3 secondes):`);
    console.log(`   Annonceur: ${advertiserDelayed?.balance} MAD`);
    console.log(`   Éditeur: ${publisherDelayed?.balance} MAD`);

    // Vérification finale
    if (advertiserDelayed?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ ANNONCEUR: TRIGGER FONCTIONNE !`);
    } else {
      console.log(`   ❌ ANNONCEUR: TRIGGER NE FONCTIONNE PAS !`);
    }

    if (publisherDelayed?.balance === expectedPublisherBalance) {
      console.log(`   ✅ ÉDITEUR: TRIGGER FONCTIONNE !`);
    } else {
      console.log(`   ❌ ÉDITEUR: TRIGGER NE FONCTIONNE PAS !`);
      console.log(`   Différence: ${Math.abs((publisherDelayed?.balance || 0) - expectedPublisherBalance)} MAD`);
    }

    console.log('\n🎯 CONCLUSION:');
    if (advertiserDelayed?.balance === expectedAdvertiserBalance && publisherDelayed?.balance === expectedPublisherBalance) {
      console.log('   ✅ LES TRIGGERS FONCTIONNENT PARFAITEMENT !');
      console.log('   Le problème que vous voyez doit être ailleurs');
    } else {
      console.log('   ❌ IL Y A UN VRAI PROBLÈME AVEC LES TRIGGERS !');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
createAndTestReal();
