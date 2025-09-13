// Test spécifique pour identifier le problème exact
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Test spécifique pour identifier le problème exact...\n');

async function testSpecificIssue() {
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
    
    console.log(`📊 Solde actuel annonceur (${advertiser.email}): ${advertiser.balance} MAD`);
    console.log(`📊 Solde actuel éditeur (${publisher.email}): ${publisher.balance} MAD`);
    
    // 2. Vérifier les demandes en attente de confirmation
    console.log('\n2️⃣ Vérification des demandes en attente de confirmation...');
    
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        user_id,
        publisher_id,
        status,
        proposed_price,
        confirmation_deadline,
        created_at,
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
        console.log(`      Créé: ${request.created_at}`);
        console.log('');
      });
    }
    
    // 3. Vérifier les transactions récentes
    console.log('3️⃣ Vérification des transactions récentes...');
    
    const { data: recentTransactions, error: transactionsError } = await supabase
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
      .limit(10);
    
    if (transactionsError) {
      console.log('❌ Erreur récupération transactions:', transactionsError);
    } else {
      console.log(`📋 ${recentTransactions.length} transaction(s) récente(s):`);
      recentTransactions.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ID: ${transaction.id}`);
        console.log(`      Annonceur: ${transaction.advertisers?.email}`);
        console.log(`      Montant total: ${transaction.amount} MAD`);
        console.log(`      Commission: ${transaction.platform_fee} MAD`);
        console.log(`      Montant éditeur: ${transaction.publisher_amount} MAD`);
        console.log(`      Status: ${transaction.status}`);
        console.log(`      Complété: ${transaction.completed_at}`);
        console.log('');
      });
    }
    
    // 4. Vérifier les transactions de crédit récentes
    console.log('4️⃣ Vérification des transactions de crédit récentes...');
    
    const { data: recentCreditTransactions, error: creditError } = await supabase
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
      .limit(10);
    
    if (creditError) {
      console.log('❌ Erreur récupération transactions de crédit:', creditError);
    } else {
      console.log(`📋 ${recentCreditTransactions.length} transaction(s) de crédit récente(s):`);
      recentCreditTransactions.forEach((transaction, index) => {
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
    
    // Calculer le total des montants reçus récemment
    const totalReceived = recentCreditTransactions
      .filter(t => t.description === 'Vente de lien')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`💰 Total reçu récemment (ventes de liens): ${totalReceived} MAD`);
    
    // Vérifier s'il y a des doublons
    const duplicateTransactions = recentTransactions.filter((transaction, index, array) => 
      array.findIndex(t => t.amount === transaction.amount && 
                          Math.abs(new Date(t.completed_at) - new Date(transaction.completed_at)) < 60000) !== index
    );
    
    if (duplicateTransactions.length > 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Transactions dupliquées détectées');
      console.log('   💡 Solution: Vérifier la logique de confirmation');
    } else {
      console.log('✅ Aucune transaction dupliquée détectée');
    }
    
    // 6. Vérifier les demandes confirmées récentes
    console.log('\n6️⃣ Vérification des demandes confirmées récentes...');
    
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
        console.log(`      Prix: ${request.proposed_price} MAD`);
        console.log(`      Confirmé: ${request.confirmed_at}`);
        console.log(`      Créé: ${request.created_at}`);
        console.log('');
      });
    }
    
    // 7. Résumé et recommandations
    console.log('\n7️⃣ Résumé et recommandations...');
    
    console.log('📊 État actuel:');
    console.log(`   - Solde éditeur: ${publisher.balance} MAD`);
    console.log(`   - Demandes en attente: ${pendingRequests.length}`);
    console.log(`   - Demandes confirmées récentes: ${confirmedRequests.length}`);
    console.log(`   - Transactions récentes: ${recentTransactions.length}`);
    console.log(`   - Crédits récents: ${recentCreditTransactions.length}`);
    
    console.log('\n💡 Recommandations:');
    if (pendingRequests.length > 0) {
      console.log('   1. Il y a des demandes en attente de confirmation');
      console.log('   2. L\'annonceur peut les confirmer pour que l\'éditeur reçoive l\'argent');
    }
    
    if (recentTransactions.length > 0) {
      console.log('   3. Des transactions récentes existent - le système fonctionne');
      console.log('   4. L\'éditeur reçoit bien ses paiements');
    }
    
    console.log('\n🔧 Si l\'éditeur ne voit pas son solde mis à jour:');
    console.log('   1. Rafraîchir la page (F5)');
    console.log('   2. Vérifier que l\'événement balance-updated est écouté');
    console.log('   3. Attendre la mise à jour automatique (30 secondes)');
    console.log('   4. Vérifier la console du navigateur pour les erreurs');
    
  } catch (error) {
    console.error('❌ Erreur dans testSpecificIssue:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test spécifique...\n');
  
  await testSpecificIssue();
  
  console.log('\n✅ Test spécifique terminé !');
}

// Exécuter le test
runTest().catch(console.error);
