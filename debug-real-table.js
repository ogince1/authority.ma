import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Vérification RÉELLE de la table users\n');

async function debugRealTable() {
  try {
    // ÉTAPE 1: Vérifier l'état actuel de la table users
    console.log('📋 ÉTAPE 1: État actuel de la table users...');
    
    const { data: currentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (usersError) {
      console.log('❌ Erreur récupération users:', usersError);
      return;
    }

    console.log('✅ Utilisateurs actuels:');
    currentUsers?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Balance: ${user.balance} MAD`);
      console.log(`      Updated: ${new Date(user.updated_at).toLocaleString()}`);
    });

    const advertiser = currentUsers?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisher = currentUsers?.find(u => u.email === 'ogincema@gmail.com');

    if (!advertiser || !publisher) {
      console.log('❌ Utilisateurs non trouvés');
      return;
    }

    // ÉTAPE 2: Créer une transaction de test et vérifier IMMÉDIATEMENT
    console.log('\n📋 ÉTAPE 2: Test avec vérification immédiate...');
    
    const testAmount = 5;
    console.log(`🎯 Test avec l'éditeur (${publisher.email})`);
    console.log(`   Balance AVANT: ${publisher.balance} MAD`);

    // Créer la transaction
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test vérification réelle',
        currency: 'MAD',
        status: 'completed',
        balance_before: publisher.balance,
        balance_after: publisher.balance + testAmount,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur création transaction:', testError);
      return;
    }

    console.log(`✅ Transaction créée: ${testTransaction.id.slice(0, 8)}...`);

    // Vérifier IMMÉDIATEMENT (pas d'attente)
    console.log('\n📊 VÉRIFICATION IMMÉDIATE (sans attente):');
    
    const { data: immediateCheck, error: immediateError } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    if (immediateError) {
      console.log('❌ Erreur vérification immédiate:', immediateError);
    } else {
      console.log(`   Balance immédiate: ${immediateCheck.balance} MAD`);
      console.log(`   Updated immédiate: ${new Date(immediateCheck.updated_at).toLocaleString()}`);
      
      if (immediateCheck.balance === publisher.balance + testAmount) {
        console.log(`   ✅ TRIGGER FONCTIONNE IMMÉDIATEMENT !`);
      } else {
        console.log(`   ❌ TRIGGER NE FONCTIONNE PAS IMMÉDIATEMENT !`);
      }
    }

    // Attendre 1 seconde
    console.log('\n⏳ Attente de 1 seconde...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: oneSecondCheck } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`📊 APRÈS 1 SECONDE:`);
    console.log(`   Balance: ${oneSecondCheck?.balance} MAD`);
    console.log(`   Updated: ${new Date(oneSecondCheck?.updated_at).toLocaleString()}`);

    // Attendre 5 secondes
    console.log('\n⏳ Attente de 5 secondes supplémentaires...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const { data: fiveSecondCheck } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`📊 APRÈS 6 SECONDES TOTAL:`);
    console.log(`   Balance: ${fiveSecondCheck?.balance} MAD`);
    console.log(`   Updated: ${new Date(fiveSecondCheck?.updated_at).toLocaleString()}`);

    // ÉTAPE 3: Vérifier si le trigger existe vraiment
    console.log('\n📋 ÉTAPE 3: Vérification de l\'existence du trigger...');
    
    // Essayer de créer une fonction simple pour tester
    const { data: testFunc, error: testFuncError } = await supabase
      .rpc('test_trigger_exists');

    if (testFuncError) {
      console.log('❌ Fonction de test non disponible:', testFuncError.message);
    } else {
      console.log('✅ Fonction de test disponible');
    }

    // ÉTAPE 4: Vérifier les transactions créées vs les balances
    console.log('\n📋 ÉTAPE 4: Comparaison transactions vs balances...');
    
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(3);

    console.log(`📊 3 dernières transactions de l'éditeur:`);
    recentTransactions?.forEach((trans, index) => {
      console.log(`   ${index + 1}. ${trans.type} ${trans.amount} MAD`);
      console.log(`      Balance before: ${trans.balance_before} MAD`);
      console.log(`      Balance after: ${trans.balance_after} MAD`);
      console.log(`      Created: ${new Date(trans.created_at).toLocaleString()}`);
    });

    console.log(`\n📊 Balance actuelle dans users: ${fiveSecondCheck?.balance} MAD`);
    
    if (recentTransactions && recentTransactions.length > 0) {
      const latestTransaction = recentTransactions[0];
      console.log(`📊 Balance_after de la dernière transaction: ${latestTransaction.balance_after} MAD`);
      
      if (fiveSecondCheck?.balance === latestTransaction.balance_after) {
        console.log(`   ✅ COHÉRENCE: Balance users = Balance_after transaction`);
      } else {
        console.log(`   ❌ INCOHÉRENCE: Balance users ≠ Balance_after transaction`);
        console.log(`   Différence: ${Math.abs((fiveSecondCheck?.balance || 0) - latestTransaction.balance_after)} MAD`);
      }
    }

    // ÉTAPE 5: Diagnostic final
    console.log('\n🎯 DIAGNOSTIC FINAL:');
    console.log('   Si la balance dans users ne change jamais:');
    console.log('   1. Le trigger n\'existe pas du tout');
    console.log('   2. Le trigger existe mais a une erreur');
    console.log('   3. Les politiques RLS bloquent la mise à jour');
    console.log('   4. Il y a un conflit de noms de colonnes');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugRealTable();
