import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - EXACTEMENT comme dans le frontend
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

// Utilisons la clé anon comme dans le vrai frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚀 TEST LIVE: Reproduction exacte du frontend et backend en temps réel\n');

// Copier EXACTEMENT la fonction confirmLinkPlacement du frontend corrigé
const confirmationLocks = new Set();

const confirmLinkPlacementLive = async (requestId) => {
  if (confirmationLocks.has(requestId)) {
    console.log(`🔒 [CONFIRMATION] Confirmation déjà en cours pour la demande: ${requestId.slice(0, 8)}...`);
    return { success: false, error: 'Confirmation déjà en cours' };
  }

  try {
    confirmationLocks.add(requestId);
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
      console.error('Error fetching request:', requestError);
      throw new Error('Demande non trouvée');
    }

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

    if (transactionError) throw transactionError;

    console.log(`✅ [CONFIRMATION] Transaction créée: ${transaction.id.slice(0, 8)}...`);

    console.log(`📊 [CONFIRMATION] Solde annonceur: ${advertiser.balance} MAD`);
    console.log(`📊 [CONFIRMATION] Les triggers vont gérer automatiquement les soldes`);

    // Créer les transactions de crédit EXACTEMENT comme dans le frontend corrigé
    console.log(`💳 [CONFIRMATION] Création des transactions - les triggers vont calculer les soldes automatiquement`);
    
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
          // balance_before et balance_after sont calculés automatiquement par les triggers
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
          // balance_before et balance_after sont calculés automatiquement par les triggers
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  [CONFIRMATION] Erreur lors de la création des transactions de crédit:', creditTransactionError);
      console.log('   Code:', creditTransactionError.code);
      console.log('   Message:', creditTransactionError.message);
      console.log('   Détails:', creditTransactionError.details);
      throw creditTransactionError;
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

    // Déclencher un événement pour mettre à jour les soldes dans l'interface (avec délai)
    console.log('💰 [CONFIRMATION] Événement balance-updated déclenché (simulation)');

    console.log(`✅ [CONFIRMATION] Les triggers vont automatiquement mettre à jour les soldes`);

    return {
      success: true,
      transaction_id: transaction.id
    };
  } catch (error) {
    console.error('Error confirming link placement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la confirmation du placement'
    };
  } finally {
    confirmationLocks.delete(requestId);
    console.log(`🔓 [CONFIRMATION] Verrou retiré pour la demande: ${requestId.slice(0, 8)}...`);
  }
};

async function testLiveConfirmation() {
  try {
    console.log('📋 ÉTAPE 1: Vérification des soldes AVANT votre commande...');
    
    const { data: usersBefore, error: usersBeforeError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (usersBeforeError) {
      console.log('❌ Erreur récupération users:', usersBeforeError);
      return;
    }

    console.log('📊 SOLDES AVANT VOTRE COMMANDE:');
    usersBefore?.forEach((user) => {
      console.log(`   ${user.email}: ${user.balance} MAD (${new Date(user.updated_at).toLocaleString()})`);
    });

    const advertiser = usersBefore?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisher = usersBefore?.find(u => u.email === 'ogincema@gmail.com');

    console.log('\n📋 ÉTAPE 2: Recherche de votre demande récente...');
    
    // Chercher la demande la plus récente en attente de confirmation
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false })
      .limit(3);

    if (pendingError) {
      console.log('❌ Erreur recherche demandes:', pendingError);
      return;
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('❌ Aucune demande en attente de confirmation trouvée');
      console.log('   Créons une demande de test...');
      
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

      const { data: testRequest, error: testRequestError } = await supabase
        .from('link_purchase_requests')
        .insert({
          link_listing_id: existingLink.id,
          user_id: advertiser?.id,
          publisher_id: publisher?.id,
          target_url: 'https://test-live-confirmation.com',
          anchor_text: 'Test live confirmation',
          proposed_price: 25,
          proposed_duration: 1,
          status: 'pending_confirmation',
          accepted_at: new Date().toISOString(),
          response_date: new Date().toISOString(),
          placed_url: 'https://test-placement-live.com',
          placed_at: new Date().toISOString(),
          editor_response: 'Demande acceptée pour test live',
          message: 'Test live de confirmation'
        })
        .select()
        .single();

      if (testRequestError) {
        console.log('❌ Erreur création demande test:', testRequestError);
        return;
      }

      pendingRequests.push(testRequest);
      console.log(`✅ Demande de test créée: ${testRequest.id.slice(0, 8)}...`);
    }

    const request = pendingRequests[0];
    console.log(`✅ Demande trouvée: ${request.id.slice(0, 8)}... (Prix: ${request.proposed_price} MAD)`);

    console.log('\n📋 ÉTAPE 3: CONFIRMATION LIVE - EXACTEMENT COMME LE FRONTEND...');
    
    // Exécuter la confirmation EXACTEMENT comme le frontend
    const result = await confirmLinkPlacementLive(request.id);

    if (!result.success) {
      console.log('❌ Confirmation échouée:', result.error);
      return;
    }

    console.log('✅ Confirmation réussie !');

    console.log('\n📋 ÉTAPE 4: Vérification IMMÉDIATE des soldes...');
    
    const { data: usersAfter, error: usersAfterError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (usersAfterError) {
      console.log('❌ Erreur récupération users après:', usersAfterError);
      return;
    }

    console.log('📊 SOLDES APRÈS CONFIRMATION (IMMÉDIAT):');
    usersAfter?.forEach((user) => {
      const userBefore = usersBefore?.find(u => u.id === user.id);
      console.log(`   ${user.email}: ${userBefore?.balance} → ${user.balance} MAD`);
      console.log(`      Timestamp: ${new Date(user.updated_at).toLocaleString()}`);
    });

    // Attendre 5 secondes et vérifier à nouveau
    console.log('\n📋 ÉTAPE 5: Vérification après 5 secondes...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const { data: usersDelayed, error: usersDelayedError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (usersDelayedError) {
      console.log('❌ Erreur récupération users delayed:', usersDelayedError);
      return;
    }

    console.log('📊 SOLDES APRÈS 5 SECONDES:');
    usersDelayed?.forEach((user) => {
      const userBefore = usersBefore?.find(u => u.id === user.id);
      console.log(`   ${user.email}: ${userBefore?.balance} → ${user.balance} MAD`);
      console.log(`      Timestamp: ${new Date(user.updated_at).toLocaleString()}`);
    });

    // Vérifier les transactions créées
    console.log('\n📋 ÉTAPE 6: Vérification des transactions créées...');
    
    const { data: createdTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('related_purchase_request_id', request.id)
      .order('created_at', { ascending: false });

    console.log(`📊 Transactions créées pour cette demande: ${createdTransactions?.length || 0}`);
    createdTransactions?.forEach((trans, index) => {
      const userType = trans.user_id === advertiser?.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
      console.log(`      Balance before: ${trans.balance_before} MAD`);
      console.log(`      Balance after: ${trans.balance_after} MAD`);
      console.log(`      Created: ${new Date(trans.created_at).toLocaleString()}`);
    });

    // Diagnostic final
    console.log('\n🎯 DIAGNOSTIC FINAL:');
    
    const advertiserAfter = usersDelayed?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisherAfter = usersDelayed?.find(u => u.email === 'ogincema@gmail.com');
    
    const expectedAdvertiserBalance = (advertiser?.balance || 0) - request.proposed_price;
    const expectedPublisherBalance = (publisher?.balance || 0) + (request.proposed_price * 0.9);

    console.log(`   Annonceur attendu: ${expectedAdvertiserBalance} MAD`);
    console.log(`   Annonceur réel: ${advertiserAfter?.balance} MAD`);
    
    if (advertiserAfter?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ ANNONCEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ ANNONCEUR: NE FONCTIONNE PAS !`);
    }

    console.log(`   Éditeur attendu: ${expectedPublisherBalance} MAD`);
    console.log(`   Éditeur réel: ${publisherAfter?.balance} MAD`);
    
    if (publisherAfter?.balance === expectedPublisherBalance) {
      console.log(`   ✅ ÉDITEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ ÉDITEUR: NE FONCTIONNE PAS !`);
    }

    if (advertiserAfter?.balance === expectedAdvertiserBalance && publisherAfter?.balance === expectedPublisherBalance) {
      console.log(`\n🎉 TOUT FONCTIONNE PARFAITEMENT !`);
    } else {
      console.log(`\n❌ IL Y A ENCORE UN PROBLÈME !`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test live
testLiveConfirmation();
