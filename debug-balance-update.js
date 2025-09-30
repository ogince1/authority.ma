import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Analyse complète du problème de mise à jour du balance\n');

async function debugBalanceUpdate() {
  try {
    // ÉTAPE 1: Vérifier les triggers existants
    console.log('📋 ÉTAPE 1: Vérification des triggers existants...');
    
    // Vérifier si les triggers existent via une requête SQL directe
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'credit_transactions');

    if (triggerError) {
      console.log('❌ Erreur récupération triggers:', triggerError);
    } else {
      console.log(`✅ Triggers trouvés: ${triggers?.length || 0}`);
      triggers?.forEach((trigger, index) => {
        console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }

    // ÉTAPE 2: Vérifier les fonctions de trigger
    console.log('\n📋 ÉTAPE 2: Vérification des fonctions de trigger...');
    
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_name', 'update_user_balance_after_transaction');

    if (funcError) {
      console.log('❌ Erreur récupération fonctions:', funcError);
    } else {
      console.log(`✅ Fonctions trouvées: ${functions?.length || 0}`);
      functions?.forEach((func, index) => {
        console.log(`   ${index + 1}. ${func.routine_name} (${func.routine_type})`);
      });
    }

    // ÉTAPE 3: Test direct avec une transaction simple
    console.log('\n📋 ÉTAPE 3: Test direct avec une transaction simple...');
    
    // Récupérer un utilisateur de test
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (userError || !testUser) {
      console.log('❌ Impossible de trouver l\'utilisateur de test');
      return;
    }

    console.log(`🎯 Utilisateur de test: ${testUser.email}`);
    console.log(`   Solde avant: ${testUser.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(testUser.updated_at).toLocaleString()}`);

    // Créer une transaction de test SIMPLE
    const testAmount = 1;
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: testUser.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test debug balance',
        currency: 'MAD',
        status: 'completed',
        balance_before: testUser.balance,
        balance_after: testUser.balance + testAmount,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur création transaction de test:', testError);
      console.log('   Code:', testError.code);
      console.log('   Message:', testError.message);
      console.log('   Détails:', testError.details);
      return;
    }

    console.log(`✅ Transaction de test créée: ${testTransaction.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction.balance_after} MAD`);

    // Attendre que le trigger se déclenche
    console.log('\n⏳ Attente de 5 secondes pour que le trigger se déclenche...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vérifier si le solde a été mis à jour
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', testUser.id)
      .single();

    if (updateError) {
      console.log('❌ Erreur vérification solde mis à jour:', updateError);
      return;
    }

    console.log(`\n📊 RÉSULTATS DU TEST:`);
    console.log(`   Solde avant: ${testUser.balance} MAD`);
    console.log(`   Solde après: ${updatedUser.balance} MAD`);
    console.log(`   Attendu: ${testUser.balance + testAmount} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(updatedUser.updated_at).toLocaleString()}`);

    if (updatedUser.balance === testUser.balance + testAmount) {
      console.log(`   ✅ TRIGGER FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER NE FONCTIONNE PAS !`);
      console.log(`   Différence: ${Math.abs(updatedUser.balance - (testUser.balance + testAmount))} MAD`);
    }

    // ÉTAPE 4: Vérifier les logs d'erreur de Supabase
    console.log('\n📋 ÉTAPE 4: Vérification des logs d\'erreur...');
    
    // Essayer de récupérer les logs récents (si accessible)
    const { data: logs, error: logError } = await supabase
      .from('pg_stat_statements')
      .select('*')
      .limit(5);

    if (logError) {
      console.log('❌ Logs non accessibles:', logError.message);
    } else {
      console.log(`✅ Logs récupérés: ${logs?.length || 0} entrées`);
    }

    // ÉTAPE 5: Vérifier les politiques RLS
    console.log('\n📋 ÉTAPE 5: Vérification des politiques RLS...');
    
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'users');

    if (policyError) {
      console.log('❌ Erreur récupération politiques:', policyError);
    } else {
      console.log(`✅ Politiques trouvées: ${policies?.length || 0}`);
    }

    // ÉTAPE 6: Test de mise à jour manuelle
    console.log('\n📋 ÉTAPE 6: Test de mise à jour manuelle...');
    
    const manualUpdateAmount = 2;
    const { error: manualError } = await supabase
      .from('users')
      .update({ 
        balance: testUser.balance + manualUpdateAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id);

    if (manualError) {
      console.log('❌ Erreur mise à jour manuelle:', manualError);
      console.log('   Code:', manualError.code);
      console.log('   Message:', manualError.message);
    } else {
      console.log('✅ Mise à jour manuelle réussie');
      
      // Vérifier la mise à jour manuelle
      const { data: manualCheck } = await supabase
        .from('users')
        .select('balance, updated_at')
        .eq('id', testUser.id)
        .single();

      console.log(`   Nouveau solde: ${manualCheck?.balance} MAD`);
      console.log(`   Timestamp: ${new Date(manualCheck?.updated_at).toLocaleString()}`);
    }

    // ÉTAPE 7: Analyser le problème
    console.log('\n🎯 DIAGNOSTIC FINAL:');
    console.log('   Si la transaction simple ne met pas à jour le solde:');
    console.log('   1. Le trigger n\'existe pas ou est inactif');
    console.log('   2. La fonction de trigger a une erreur');
    console.log('   3. Les politiques RLS bloquent la mise à jour');
    console.log('   4. Il y a un conflit dans la logique de trigger');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugBalanceUpdate();
