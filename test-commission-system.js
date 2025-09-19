import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Système de commission 20% sur les retraits\n');

async function testCommissionSystem() {
  try {
    console.log('📋 ÉTAPE 1: Vérification du système...');
    
    // Vérifier que les nouvelles fonctions existent
    const { data: testFunc, error: testError } = await supabase.rpc('request_add_funds', {
      p_amount: 1.0,
      p_payment_method: 'bank_transfer',
      p_description: 'Test existence fonction'
    });

    if (testError) {
      console.log('❌ Fonctions pas encore créées:', testError.message);
      console.log('   Exécutez d\'abord clean-balance-system.sql');
      return;
    }

    console.log('✅ Fonctions créées et disponibles');

    console.log('\n📋 ÉTAPE 2: Simulation d\'une demande de retrait avec commission...');
    
    // Récupérer l'éditeur
    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log(`🎯 Éditeur: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);

    // Simuler une demande de retrait de 100 MAD
    const withdrawAmount = 100;
    const commission = withdrawAmount * 0.20;
    const netAmount = withdrawAmount - commission;

    console.log(`\n💰 CALCULS DE COMMISSION:`);
    console.log(`   Montant demandé: ${withdrawAmount} MAD`);
    console.log(`   Commission plateforme (20%): ${commission} MAD`);
    console.log(`   Montant net reçu: ${netAmount} MAD`);

    // Créer une demande de retrait
    const { data: withdrawResult, error: withdrawError } = await supabase.rpc('request_withdraw_funds', {
      p_amount: withdrawAmount,
      p_payment_method: 'bank_transfer',
      p_description: 'Test retrait avec commission 20%'
    });

    if (withdrawError) {
      console.log('❌ Erreur création demande retrait:', withdrawError);
      return;
    }

    if (withdrawResult?.success) {
      console.log(`✅ Demande de retrait créée: ${withdrawResult.request_id?.slice(0, 8)}...`);
    } else {
      console.log('❌ Échec création demande:', withdrawResult?.message);
      return;
    }

    console.log('\n📋 ÉTAPE 3: Simulation de l\'approbation par l\'admin...');
    
    // Approuver la demande (simulation admin)
    const { data: approvalResult, error: approvalError } = await supabase.rpc('admin_process_balance_request', {
      p_request_id: withdrawResult.request_id,
      p_action: 'approve',
      p_admin_notes: 'Test automatique - commission 20% appliquée'
    });

    if (approvalError) {
      console.log('❌ Erreur approbation:', approvalError);
      return;
    }

    if (approvalResult?.success) {
      console.log('✅ Demande approuvée par l\'admin');
    } else {
      console.log('❌ Échec approbation:', approvalResult?.message);
      return;
    }

    console.log('\n📋 ÉTAPE 4: Vérification des transactions créées...');
    
    // Attendre que les triggers se déclenchent
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier les transactions créées
    const { data: recentTransactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (transError) {
      console.log('❌ Erreur récupération transactions:', transError);
    } else {
      console.log(`📊 Transactions créées (${recentTransactions?.length || 0}):`);
      recentTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.type} ${trans.amount} MAD - ${trans.description}`);
        console.log(`      Balance: ${trans.balance_before} → ${trans.balance_after} MAD`);
        console.log(`      Date: ${new Date(trans.created_at).toLocaleString()}`);
      });
    }

    // Vérifier le nouveau solde
    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance')
      .eq('id', publisher.id)
      .single();

    console.log(`\n📊 RÉSULTAT FINAL:`);
    console.log(`   Solde avant: ${publisher.balance} MAD`);
    console.log(`   Solde après: ${updatedPublisher?.balance} MAD`);
    console.log(`   Différence: ${publisher.balance - (updatedPublisher?.balance || 0)} MAD`);

    // Vérifier que la commission a été appliquée
    const expectedBalance = publisher.balance - withdrawAmount - commission;
    
    console.log(`\n🔍 VÉRIFICATION DE LA COMMISSION:`);
    console.log(`   Solde attendu: ${expectedBalance} MAD`);
    console.log(`   Solde réel: ${updatedPublisher?.balance} MAD`);
    
    if (Math.abs((updatedPublisher?.balance || 0) - expectedBalance) < 0.01) {
      console.log(`   ✅ COMMISSION 20% APPLIQUÉE CORRECTEMENT !`);
    } else {
      console.log(`   ❌ PROBLÈME AVEC LA COMMISSION !`);
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log(`   Montant demandé: ${withdrawAmount} MAD`);
    console.log(`   Commission (20%): ${commission} MAD`);
    console.log(`   Total débité: ${withdrawAmount + commission} MAD`);
    console.log(`   Montant net pour l'éditeur: ${netAmount} MAD`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testCommissionSystem();
