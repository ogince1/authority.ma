import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VÉRIFICATION: Triggers réels vs triggers de script\n');

async function checkRealTriggers() {
  try {
    console.log('📋 ÉTAPE 1: Vérification des triggers via RPC (si disponible)...');
    
    // Essayer d'utiliser la fonction RPC que j'ai créée
    try {
      const { data: rpcTriggers, error: rpcError } = await supabase
        .rpc('check_triggers_status');

      if (rpcError) {
        console.log('❌ RPC check_triggers_status non disponible:', rpcError.message);
      } else {
        console.log('✅ RPC disponible - Triggers trouvés via RPC:');
        rpcTriggers?.forEach((trigger, index) => {
          console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.is_active ? 'Actif' : 'Inactif'})`);
        });
      }
    } catch (err) {
      console.log('❌ RPC non disponible:', err.message);
    }

    console.log('\n📋 ÉTAPE 2: Test avec transaction SANS balance_before/balance_after...');
    
    // Récupérer un utilisateur de test
    const { data: testUser } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!testUser) {
      console.log('❌ Utilisateur de test non trouvé');
      return;
    }

    console.log(`🎯 Utilisateur test: ${testUser.email}`);
    console.log(`   Solde avant: ${testUser.balance} MAD`);
    console.log(`   Timestamp avant: ${new Date(testUser.updated_at).toLocaleString()}`);

    // Créer une transaction SANS balance_before et balance_after
    const testAmount = 3;
    console.log(`\n💳 Création d'une transaction de ${testAmount} MAD SANS balance_before/balance_after...`);
    
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: testUser.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test triggers réels',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
        // PAS de balance_before ni balance_after - les triggers doivent les calculer
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur création transaction:', testError);
      console.log('   Code:', testError.code);
      console.log('   Message:', testError.message);
      console.log('   Détails:', testError.details);
      return;
    }

    console.log(`✅ Transaction créée: ${testTransaction.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction.balance_after} MAD`);

    // Vérifier si les champs ont été calculés par les triggers
    if (testTransaction.balance_before === null || testTransaction.balance_after === null) {
      console.log(`❌ PROBLÈME: Les triggers n'ont PAS calculé balance_before/balance_after !`);
      console.log(`   balance_before: ${testTransaction.balance_before}`);
      console.log(`   balance_after: ${testTransaction.balance_after}`);
    } else {
      console.log(`✅ Les triggers ont calculé balance_before et balance_after`);
    }

    // Attendre 2 secondes et vérifier le solde dans la table users
    console.log('\n⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: updatedUser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', testUser.id)
      .single();

    console.log(`📊 Vérification du solde dans la table users:`);
    console.log(`   Solde avant: ${testUser.balance} MAD`);
    console.log(`   Solde après: ${updatedUser?.balance} MAD`);
    console.log(`   Timestamp après: ${new Date(updatedUser?.updated_at).toLocaleString()}`);

    // Comparaison avec ce que les triggers auraient dû faire
    const expectedBalance = testUser.balance + testAmount;
    const expectedBalanceFromTransaction = testTransaction.balance_after;

    console.log(`\n🔍 ANALYSE:`);
    console.log(`   Balance attendue: ${expectedBalance} MAD`);
    console.log(`   Balance réelle: ${updatedUser?.balance} MAD`);
    console.log(`   Balance_after transaction: ${expectedBalanceFromTransaction} MAD`);

    if (updatedUser?.balance === expectedBalance) {
      console.log(`   ✅ TRIGGER DE MISE À JOUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER DE MISE À JOUR: NE FONCTIONNE PAS !`);
    }

    if (testTransaction.balance_before === testUser.balance && testTransaction.balance_after === expectedBalance) {
      console.log(`   ✅ TRIGGER DE CALCUL: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER DE CALCUL: NE FONCTIONNE PAS !`);
    }

    console.log('\n📋 ÉTAPE 3: Test avec transaction AVEC balance_before/balance_after...');
    
    // Maintenant tester avec balance_before et balance_after fournis
    const testAmount2 = 4;
    console.log(`\n💳 Création d'une transaction de ${testAmount2} MAD AVEC balance_before/balance_after...`);
    
    const currentBalance = updatedUser?.balance || testUser.balance;
    const { data: testTransaction2, error: testError2 } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: testUser.id,
        type: 'deposit',
        amount: testAmount2,
        description: 'Test triggers réels avec balance',
        currency: 'MAD',
        status: 'completed',
        balance_before: currentBalance,
        balance_after: currentBalance + testAmount2,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError2) {
      console.log('❌ Erreur création transaction 2:', testError2);
      return;
    }

    console.log(`✅ Transaction 2 créée: ${testTransaction2.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction2.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction2.balance_after} MAD`);

    // Vérifier à nouveau
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: finalUser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', testUser.id)
      .single();

    console.log(`📊 Vérification finale:`);
    console.log(`   Solde final: ${finalUser?.balance} MAD`);
    console.log(`   Attendu: ${currentBalance + testAmount2} MAD`);

    if (finalUser?.balance === currentBalance + testAmount2) {
      console.log(`   ✅ TRIGGER AVEC BALANCE FOURNIE: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER AVEC BALANCE FOURNIE: NE FONCTIONNE PAS !`);
    }

    console.log('\n🎯 CONCLUSION FINALE:');
    console.log('   Si les triggers fonctionnent dans les scripts mais pas dans le frontend:');
    console.log('   1. Les triggers existent mais ne sont pas les bons');
    console.log('   2. Il y a une différence entre service_role et anon');
    console.log('   3. Les politiques RLS interfèrent');
    console.log('   4. Il y a un problème de permissions');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkRealTriggers();
