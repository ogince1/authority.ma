import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VÉRIFICATION: État après exécution du SQL\n');

async function verifyTriggersExecution() {
  try {
    console.log('📋 ÉTAPE 1: Vérification des fonctions disponibles...');
    
    // Essayer toutes les fonctions RPC que nous avons créées
    const testFunctions = [
      'test_triggers_final',
      'check_triggers_status',
      'test_balance_triggers',
      'repair_missing_triggers'
    ];

    for (const funcName of testFunctions) {
      try {
        // Test simple pour voir si la fonction existe
        if (funcName === 'test_triggers_final') {
          const { data, error } = await supabase.rpc(funcName, {
            p_user_email: 'ogincema@gmail.com',
            p_amount: 1.0,
            p_type: 'deposit'
          });
          
          if (error) {
            console.log(`❌ ${funcName}: ${error.message}`);
          } else {
            console.log(`✅ ${funcName}: Fonction existe et fonctionne`);
            console.log(`   Résultat:`, data);
          }
        } else if (funcName === 'test_balance_triggers') {
          // Skip car nécessite des paramètres UUID
          console.log(`⏭️  ${funcName}: Nécessite des paramètres UUID spécifiques`);
        } else {
          const { data, error } = await supabase.rpc(funcName);
          
          if (error) {
            console.log(`❌ ${funcName}: ${error.message}`);
          } else {
            console.log(`✅ ${funcName}: Fonction existe`);
          }
        }
      } catch (err) {
        console.log(`❌ ${funcName}: ${err.message}`);
      }
    }

    console.log('\n📋 ÉTAPE 2: Test direct avec une transaction simple...');
    
    // Récupérer l'éditeur
    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log(`🎯 Éditeur: ${publisher.email}`);
    console.log(`   Solde avant: ${publisher.balance} MAD`);
    console.log(`   Timestamp: ${new Date(publisher.updated_at).toLocaleString()}`);

    // Créer une transaction simple pour tester les triggers
    const testAmount = 2;
    console.log(`\n💳 Création d'une transaction de test (${testAmount} MAD)...`);
    
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test après recréation triggers',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
        // Pas de balance_before/balance_after - les triggers doivent les calculer
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur création transaction test:', testError);
      console.log('   Code:', testError.code);
      console.log('   Message:', testError.message);
      console.log('   Détails:', testError.details);
      
      // Si l'erreur mentionne balance_before ou balance_after
      if (testError.message?.includes('balance_before') || testError.message?.includes('balance_after')) {
        console.log('   🔍 PROBLÈME: Les colonnes balance_before/balance_after sont requises');
        console.log('   SOLUTION: Les triggers BEFORE ne fonctionnent pas');
      }
      
      return;
    }

    console.log(`✅ Transaction créée: ${testTransaction.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction.balance_after} MAD`);

    // Vérifier si les triggers ont calculé les valeurs
    if (testTransaction.balance_before === null || testTransaction.balance_after === null) {
      console.log(`❌ TRIGGERS BEFORE: NE FONCTIONNENT PAS !`);
      console.log(`   balance_before: ${testTransaction.balance_before}`);
      console.log(`   balance_after: ${testTransaction.balance_after}`);
    } else {
      console.log(`✅ TRIGGERS BEFORE: FONCTIONNENT ! (calculent les balances)`);
    }

    // Attendre et vérifier la mise à jour dans users
    console.log('\n⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`📊 Résultat dans la table users:`);
    console.log(`   Solde avant: ${publisher.balance} MAD`);
    console.log(`   Solde après: ${updatedPublisher?.balance} MAD`);
    console.log(`   Attendu: ${publisher.balance + testAmount} MAD`);
    console.log(`   Timestamp: ${new Date(updatedPublisher?.updated_at).toLocaleString()}`);

    if (updatedPublisher?.balance === publisher.balance + testAmount) {
      console.log(`   ✅ TRIGGERS AFTER: FONCTIONNENT ! (mettent à jour users)`);
    } else {
      console.log(`   ❌ TRIGGERS AFTER: NE FONCTIONNENT PAS !`);
      console.log(`   Différence: ${Math.abs((updatedPublisher?.balance || 0) - (publisher.balance + testAmount))} MAD`);
    }

    console.log('\n🎯 DIAGNOSTIC:');
    if (testTransaction.balance_before !== null && testTransaction.balance_after !== null && 
        updatedPublisher?.balance === publisher.balance + testAmount) {
      console.log('   ✅ TOUS LES TRIGGERS FONCTIONNENT PARFAITEMENT !');
    } else {
      console.log('   ❌ IL Y A ENCORE UN PROBLÈME AVEC LES TRIGGERS !');
      
      if (testTransaction.balance_before === null || testTransaction.balance_after === null) {
        console.log('   → Le trigger BEFORE ne fonctionne pas');
      }
      
      if (updatedPublisher?.balance !== publisher.balance + testAmount) {
        console.log('   → Le trigger AFTER ne fonctionne pas');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
verifyTriggersExecution();
