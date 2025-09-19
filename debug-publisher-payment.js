// Script pour déboguer pourquoi l'éditeur ne reçoit pas l'argent
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Débogage du paiement éditeur...\n');

async function debugPublisherPayment() {
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';
    const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';
    
    // 1. Vérifier les soldes actuels
    console.log('1️⃣ Vérification des soldes actuels...');
    
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('email, balance')
      .eq('id', advertiserId)
      .single();
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('email, balance')
      .eq('id', publisherId)
      .single();
    
    if (advertiserError || publisherError) {
      console.log('❌ Erreur récupération utilisateurs:', advertiserError || publisherError);
      return;
    }
    
    console.log(`📊 Solde annonceur (${advertiser.email}): ${advertiser.balance} MAD`);
    console.log(`📊 Solde éditeur (${publisher.email}): ${publisher.balance} MAD`);
    
    // 2. Vérifier les demandes confirmées récentes
    console.log('\n2️⃣ Vérification des demandes confirmées récentes...');
    
    const { data: confirmedRequests, error: confirmedError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        user_id,
        publisher_id,
        status,
        proposed_price,
        confirmed_at,
        created_at,
        advertisers:users!link_purchase_requests_user_id_fkey(email),
        publishers:users!link_purchase_requests_publisher_id_fkey(email)
      `)
      .eq('status', 'confirmed')
      .eq('publisher_id', publisherId)
      .order('confirmed_at', { ascending: false })
      .limit(5);
    
    if (confirmedError) {
      console.log('❌ Erreur récupération demandes confirmées:', confirmedError);
    } else {
      console.log(`📋 ${confirmedRequests.length} demande(s) confirmée(s) récente(s):`);
      confirmedRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}`);
        console.log(`      Annonceur: ${request.advertisers?.email}`);
        console.log(`      Éditeur: ${request.publishers?.email}`);
        console.log(`      Prix: ${request.proposed_price} MAD`);
        console.log(`      Confirmé: ${request.confirmed_at}`);
        console.log('');
      });
    }
    
    // 3. Vérifier les transactions d'achat
    console.log('3️⃣ Vérification des transactions d\'achat...');
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('link_purchase_transactions')
      .select(`
        id,
        advertiser_id,
        publisher_id,
        amount,
        platform_fee,
        publisher_amount,
        status,
        completed_at,
        advertisers:users!link_purchase_transactions_advertiser_id_fkey(email),
        publishers:users!link_purchase_transactions_publisher_id_fkey(email)
      `)
      .eq('publisher_id', publisherId)
      .order('completed_at', { ascending: false })
      .limit(5);
    
    if (transactionsError) {
      console.log('❌ Erreur récupération transactions:', transactionsError);
    } else {
      console.log(`📋 ${transactions.length} transaction(s) trouvée(s):`);
      transactions.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ID: ${transaction.id}`);
        console.log(`      Annonceur: ${transaction.advertisers?.email}`);
        console.log(`      Éditeur: ${transaction.publishers?.email}`);
        console.log(`      Montant total: ${transaction.amount} MAD`);
        console.log(`      Commission: ${transaction.platform_fee} MAD`);
        console.log(`      Montant éditeur: ${transaction.publisher_amount} MAD`);
        console.log(`      Status: ${transaction.status}`);
        console.log(`      Complété: ${transaction.completed_at}`);
        console.log('');
      });
    }
    
    // 4. Vérifier les transactions de crédit
    console.log('4️⃣ Vérification des transactions de crédit...');
    
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        type,
        amount,
        description,
        status,
        created_at,
        users:users!credit_transactions_user_id_fkey(email)
      `)
      .eq('user_id', publisherId)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (creditError) {
      console.log('❌ Erreur récupération transactions de crédit:', creditError);
    } else {
      console.log(`📋 ${creditTransactions.length} transaction(s) de crédit trouvée(s):`);
      creditTransactions.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ID: ${transaction.id}`);
        console.log(`      Utilisateur: ${transaction.users?.email}`);
        console.log(`      Type: ${transaction.type}`);
        console.log(`      Montant: ${transaction.amount} MAD`);
        console.log(`      Description: ${transaction.description}`);
        console.log(`      Status: ${transaction.status}`);
        console.log(`      Créé: ${transaction.created_at}`);
        console.log('');
      });
    }
    
    // 5. Analyser le problème
    console.log('5️⃣ Analyse du problème...');
    
    if (confirmedRequests.length > 0 && transactions.length === 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Des demandes sont confirmées mais aucune transaction n\'a été créée');
      console.log('   💡 Solution: Vérifier la fonction confirmLinkPlacement');
    } else if (transactions.length > 0 && creditTransactions.length === 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Des transactions existent mais aucune transaction de crédit pour l\'éditeur');
      console.log('   💡 Solution: Vérifier la création des transactions de crédit');
    } else if (transactions.length > 0 && creditTransactions.length > 0) {
      console.log('✅ Les transactions et crédits existent');
      console.log('   💡 Le problème pourrait être dans l\'interface frontend');
    } else {
      console.log('❌ PROBLÈME IDENTIFIÉ: Aucune demande confirmée récente');
      console.log('   💡 Solution: Tester le workflow complet');
    }
    
    // 6. Vérifier les demandes en attente de confirmation
    console.log('\n6️⃣ Vérification des demandes en attente de confirmation...');
    
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        user_id,
        publisher_id,
        status,
        proposed_price,
        confirmation_deadline,
        advertisers:users!link_purchase_requests_user_id_fkey(email),
        publishers:users!link_purchase_requests_publisher_id_fkey(email)
      `)
      .eq('status', 'pending_confirmation')
      .eq('publisher_id', publisherId)
      .order('confirmation_deadline', { ascending: true });
    
    if (pendingError) {
      console.log('❌ Erreur récupération demandes en attente:', pendingError);
    } else {
      console.log(`📋 ${pendingRequests.length} demande(s) en attente de confirmation:`);
      pendingRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}`);
        console.log(`      Annonceur: ${request.advertisers?.email}`);
        console.log(`      Prix: ${request.proposed_price} MAD`);
        console.log(`      Délai: ${request.confirmation_deadline}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur dans debugPublisherPayment:', error);
  }
}

// Fonction principale
async function runDebug() {
  console.log('🚀 Démarrage du débogage du paiement éditeur...\n');
  
  await debugPublisherPayment();
  
  console.log('\n✅ Débogage terminé !');
  console.log('\n💡 Solutions possibles:');
  console.log('   1. Vérifier que la fonction confirmLinkPlacement est appelée');
  console.log('   2. Vérifier que les transactions sont créées');
  console.log('   3. Vérifier que les soldes sont mis à jour');
  console.log('   4. Vérifier que l\'interface frontend se met à jour');
}

// Exécuter le débogage
runDebug().catch(console.error);
