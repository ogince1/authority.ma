import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - EXACTEMENT comme dans le frontend
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

// Utilisons la clé anon comme dans le frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 TEST: Utilisation de la VRAIE fonction confirmLinkPlacement\n');

// Copier EXACTEMENT la fonction confirmLinkPlacement du frontend
const confirmationLocks = new Set();

const confirmLinkPlacementTest = async (requestId) => {
  // Vérifier si une confirmation est déjà en cours pour cette demande
  if (confirmationLocks.has(requestId)) {
    console.log(`🔒 [CONFIRMATION] Confirmation déjà en cours pour la demande: ${requestId.slice(0, 8)}...`);
    return { success: false, error: 'Confirmation déjà en cours' };
  }

  try {
    // Ajouter le verrou
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

    // Récupérer le solde actuel de l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError) {
      console.log('⚠️  [CONFIRMATION] Erreur récupération solde éditeur:', publisherError);
      throw new Error('Impossible de récupérer le solde de l\'éditeur');
    }

    console.log(`📊 [CONFIRMATION] Solde annonceur: ${advertiser.balance} MAD`);
    console.log(`📊 [CONFIRMATION] Solde éditeur: ${publisher.balance} MAD`);

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
          balance_before: advertiser.balance,
          balance_after: advertiser.balance - request.proposed_price,
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
          balance_before: publisher.balance,
          balance_after: publisher.balance + publisherAmount,
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  [CONFIRMATION] Erreur lors de la création des transactions de crédit:', creditTransactionError);
      console.log('   Code:', creditTransactionError.code);
      console.log('   Message:', creditTransactionError.message);
      console.log('   Détails:', creditTransactionError.details);
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
    // Retirer le verrou
    confirmationLocks.delete(requestId);
    console.log(`🔓 [CONFIRMATION] Verrou retiré pour la demande: ${requestId.slice(0, 8)}...`);
  }
};

async function testRealConfirmation() {
  try {
    console.log('📋 Recherche d\'une demande en attente de confirmation...');
    
    // Chercher une demande en attente de confirmation
    const { data: pendingRequests, error: searchError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('status', 'pending_confirmation')
      .limit(1);

    if (searchError) {
      console.log('❌ Erreur recherche demandes:', searchError);
      return;
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('❌ Aucune demande en attente de confirmation trouvée');
      console.log('   Créez d\'abord une demande et acceptez-la');
      return;
    }

    const request = pendingRequests[0];
    console.log(`✅ Demande trouvée: ${request.id.slice(0, 8)}...`);

    // Vérifier les soldes AVANT la confirmation
    const { data: advertiserBefore } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', request.user_id)
      .single();

    const { data: publisherBefore } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', request.publisher_id)
      .single();

    console.log(`\n🎯 SOLDES AVANT CONFIRMATION:`);
    console.log(`   Annonceur: ${advertiserBefore?.balance} MAD`);
    console.log(`   Éditeur: ${publisherBefore?.balance} MAD`);

    // Exécuter la VRAIE fonction confirmLinkPlacement
    console.log(`\n📋 EXÉCUTION DE LA VRAIE FONCTION confirmLinkPlacement...`);
    const result = await confirmLinkPlacementTest(request.id);

    if (!result.success) {
      console.log('❌ Confirmation échouée:', result.error);
      return;
    }

    console.log('✅ Confirmation réussie !');

    // Attendre 5 secondes pour que les triggers se déclenchent
    console.log('\n⏳ Attente de 5 secondes pour que les triggers se déclenchent...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vérifier les soldes APRÈS la confirmation
    const { data: advertiserAfter } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', request.user_id)
      .single();

    const { data: publisherAfter } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', request.publisher_id)
      .single();

    console.log(`\n🎯 SOLDES APRÈS CONFIRMATION:`);
    console.log(`   Annonceur: ${advertiserBefore?.balance} → ${advertiserAfter?.balance} MAD`);
    console.log(`   Éditeur: ${publisherBefore?.balance} → ${publisherAfter?.balance} MAD`);

    // Calculer les montants attendus
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    const expectedAdvertiserBalance = (advertiserBefore?.balance || 0) - request.proposed_price;
    const expectedPublisherBalance = (publisherBefore?.balance || 0) + publisherAmount;

    console.log(`\n🔍 VÉRIFICATION:`);
    console.log(`   Annonceur attendu: ${expectedAdvertiserBalance} MAD`);
    console.log(`   Annonceur réel: ${advertiserAfter?.balance} MAD`);
    console.log(`   Éditeur attendu: ${expectedPublisherBalance} MAD`);
    console.log(`   Éditeur réel: ${publisherAfter?.balance} MAD`);

    if (advertiserAfter?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ ANNONCEUR: DÉBITÉ CORRECTEMENT !`);
    } else {
      console.log(`   ❌ ANNONCEUR: PROBLÈME DE DÉBIT !`);
    }

    if (publisherAfter?.balance === expectedPublisherBalance) {
      console.log(`   ✅ ÉDITEUR: CRÉDITÉ CORRECTEMENT !`);
    } else {
      console.log(`   ❌ ÉDITEUR: PROBLÈME DE CRÉDIT !`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testRealConfirmation();
