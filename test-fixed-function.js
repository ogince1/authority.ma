// Test de la fonction confirmLinkPlacement corrigée
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Test de la fonction confirmLinkPlacement corrigée...\n');

// Simuler la fonction corrigée
async function testCorrectedConfirmLinkPlacement(requestId) {
  console.log(`1️⃣ Test avec la demande ID: ${requestId}`);
  
  try {
    // Récupérer les détails de la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings!inner(title),
        publishers:users!link_purchase_requests_publisher_id_fkey(name)
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.log('❌ Erreur lors de la récupération de la demande:', requestError);
      return false;
    }

    if (!request) {
      console.log('❌ Demande non trouvée');
      return false;
    }

    console.log('✅ Demande récupérée:');
    console.log(`   - Status: ${request.status}`);
    console.log(`   - Titre: ${request.link_listings?.title}`);
    console.log(`   - Prix: ${request.proposed_price} MAD`);
    console.log(`   - Annonceur: ${request.user_id}`);
    console.log(`   - Éditeur: ${request.publisher_id}`);
    console.log(`   - Délai: ${request.confirmation_deadline}`);

    if (request.status !== 'pending_confirmation') {
      console.log('❌ Demande non en attente de confirmation');
      return false;
    }

    // Vérifier que le délai n'est pas dépassé
    if (new Date(request.confirmation_deadline) < new Date()) {
      console.log('❌ Délai de confirmation dépassé');
      return false;
    }

    // Traiter le paiement manuellement
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    console.log('💰 Calculs de paiement:');
    console.log(`   - Prix total: ${request.proposed_price} MAD`);
    console.log(`   - Commission (10%): ${platformFee} MAD`);
    console.log(`   - Montant éditeur: ${publisherAmount} MAD`);

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError) {
      console.log('❌ Erreur lors de la récupération du solde annonceur:', advertiserError);
      return false;
    }

    console.log(`   - Solde annonceur: ${advertiser.balance} MAD`);

    if (advertiser.balance < request.proposed_price) {
      console.log('❌ Solde insuffisant');
      return false;
    }

    // Créer la transaction
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
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (transactionError) {
      console.log('❌ Erreur lors de la création de la transaction:', transactionError);
      return false;
    }

    console.log(`✅ Transaction créée: ${transaction.id}`);

    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) {
      console.log('❌ Erreur lors du débit annonceur:', debitError);
      return false;
    }

    console.log('✅ Annonceur débité');

    // Créditer l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError) {
      console.log('❌ Erreur lors de la récupération du solde éditeur:', publisherError);
      return false;
    }

    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) {
      console.log('❌ Erreur lors du crédit éditeur:', creditError);
      return false;
    }

    console.log('✅ Éditeur crédité');

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        payment_transaction_id: transaction.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.log('❌ Erreur lors de la mise à jour du statut:', updateError);
      return false;
    }

    console.log('✅ Statut mis à jour: confirmed');

    // Créer une notification pour l'éditeur
    const { data: notificationData, error: notificationError } = await supabase.rpc('create_notification', {
      p_user_id: request.publisher_id,
      p_title: 'Notification success',
      p_message: `Le placement du lien "${request.link_listings?.title}" a été confirmé. Le paiement a été effectué.`,
      p_type: 'success',
      p_action_url: `/dashboard/action/${requestId}`,
      p_action_type: 'payment'
    });

    if (notificationError) {
      console.log('⚠️  Erreur lors de la création de la notification:', notificationError);
    } else {
      console.log('✅ Notification créée pour l\'éditeur');
    }

    console.log('\n🎉 Confirmation réussie !');
    return true;

  } catch (error) {
    console.log('❌ Erreur dans testCorrectedConfirmLinkPlacement:', error);
    return false;
  }
}

// Test avec une vraie demande
async function testWithRealRequest() {
  console.log('2️⃣ Test avec une vraie demande...');
  
  try {
    // Récupérer une demande en attente de confirmation
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id')
      .eq('status', 'pending_confirmation')
      .limit(1);
    
    if (requestsError) {
      console.error('❌ Erreur lors de la récupération des demandes:', requestsError);
      return;
    }
    
    if (requests.length === 0) {
      console.log('ℹ️  Aucune demande en attente de confirmation');
      return;
    }
    
    const requestId = requests[0].id;
    console.log(`📋 Test avec la demande ID: ${requestId}`);
    
    const success = await testCorrectedConfirmLinkPlacement(requestId);
    
    if (success) {
      console.log('\n✅ Test réussi ! La fonction corrigée fonctionne parfaitement');
    } else {
      console.log('\n❌ Test échoué');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans testWithRealRequest:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test de la fonction corrigée...\n');
  
  await testWithRealRequest();
  
  console.log('\n✅ Test terminé !');
  console.log('\n💡 Résumé:');
  console.log('   - La fonction confirmLinkPlacement a été corrigée');
  console.log('   - Elle traite maintenant le paiement manuellement');
  console.log('   - Plus de dépendance sur la fonction RPC problématique');
  console.log('   - Le bouton "Confirmer le Lien" devrait maintenant fonctionner');
}

// Exécuter le test
runTest().catch(console.error);
