import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunctionsAndTriggers() {
  console.log('🔧 Vérification des fonctions et triggers Supabase...\n');

  try {
    // 1. Vérifier les fonctions RPC disponibles
    console.log('📋 FONCTIONS RPC DISPONIBLES:');
    console.log('============================');

    // Liste des fonctions RPC communes à tester
    const commonRPCFunctions = [
      'get_user_balance',
      'update_user_balance',
      'process_payment',
      'create_transaction',
      'get_website_stats',
      'update_website_metrics',
      'process_link_request',
      'calculate_commission',
      'get_publisher_earnings',
      'update_credit_transaction',
      'handle_expired_requests',
      'get_table_list'
    ];

    const availableFunctions = [];

    for (const funcName of commonRPCFunctions) {
      try {
        console.log(`🔍 Test de la fonction: ${funcName}`);
        
        // Essayer d'appeler la fonction (elle peut échouer mais nous dire qu'elle existe)
        const { data, error } = await supabase.rpc(funcName);
        
        if (error) {
          if (error.code === '42883') {
            console.log(`   ❌ Fonction '${funcName}' n'existe pas`);
          } else if (error.code === '42P01' || error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
            console.log(`   ✅ Fonction '${funcName}' existe mais nécessite des paramètres ou permissions`);
            availableFunctions.push(funcName);
          } else {
            console.log(`   ⚠️ Fonction '${funcName}' - Erreur: ${error.message}`);
            availableFunctions.push(funcName);
          }
        } else {
          console.log(`   ✅ Fonction '${funcName}' disponible et fonctionnelle`);
          availableFunctions.push(funcName);
          if (data) {
            console.log(`      Résultat: ${JSON.stringify(data).substring(0, 100)}...`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️ Erreur lors du test de '${funcName}': ${e.message}`);
      }
    }

    console.log(`\n📊 Résumé: ${availableFunctions.length} fonctions RPC détectées`);
    if (availableFunctions.length > 0) {
      console.log('Fonctions disponibles:');
      availableFunctions.forEach((func, index) => {
        console.log(`   ${index + 1}. ${func}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // 2. Vérifier les triggers en analysant les tables
    console.log('\n🔄 ANALYSE DES TRIGGERS:');
    console.log('=======================');

    const tablesToCheck = ['users', 'credit_transactions', 'websites', 'advertiser_requests'];

    for (const tableName of tablesToCheck) {
      console.log(`\n📊 Analyse des triggers pour la table: ${tableName}`);
      
      try {
        // Test d'insertion pour voir si des triggers se déclenchent
        console.log(`   🧪 Test d'insertion (sera annulé)...`);
        
        // Commencer une transaction pour pouvoir l'annuler
        const testData = tableName === 'users' ? {
          id: 'test-trigger-' + Date.now(),
          name: 'Test Trigger',
          email: 'test-trigger@test.com',
          role: 'advertiser'
        } : tableName === 'credit_transactions' ? {
          id: 'test-trigger-' + Date.now(),
          user_id: 'test-user',
          type: 'deposit',
          amount: 100,
          currency: 'MAD',
          status: 'pending',
          description: 'Test trigger'
        } : tableName === 'websites' ? {
          id: 'test-trigger-' + Date.now(),
          user_id: 'test-user',
          title: 'Test Website',
          url: 'https://test.com',
          category: 'test'
        } : {
          id: 'test-trigger-' + Date.now(),
          user_id: 'test-user',
          website_id: 'test-website',
          status: 'pending'
        };

        const { data: insertResult, error: insertError } = await supabase
          .from(tableName)
          .insert([testData])
          .select();

        if (insertError) {
          console.log(`   ⚠️ Insertion échouée: ${insertError.message}`);
          
          // Analyser le type d'erreur pour déduire les triggers
          if (insertError.message.includes('trigger') || insertError.message.includes('function')) {
            console.log(`   🔄 Triggers probablement présents sur ${tableName}`);
          } else if (insertError.message.includes('foreign key') || insertError.message.includes('constraint')) {
            console.log(`   🔗 Contraintes de clés étrangères détectées sur ${tableName}`);
          } else if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
            console.log(`   🔒 Politiques RLS actives sur ${tableName}`);
          }
        } else if (insertResult) {
          console.log(`   ✅ Insertion réussie - ID: ${insertResult[0]?.id}`);
          
          // Supprimer immédiatement le test
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', insertResult[0].id);
            
          if (!deleteError) {
            console.log(`   🗑️ Données de test supprimées`);
          }
        }

        // Vérifier les colonnes updated_at pour détecter les triggers de mise à jour
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          if (columns.includes('updated_at')) {
            console.log(`   🕒 Colonne 'updated_at' détectée - trigger de mise à jour probable`);
          }
          if (columns.includes('created_at')) {
            console.log(`   📅 Colonne 'created_at' détectée - trigger de création probable`);
          }
        }

      } catch (e) {
        console.log(`   ❌ Erreur lors de l'analyse: ${e.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));

    // 3. Tester des fonctions spécifiques liées aux transactions
    console.log('\n💰 TEST DES FONCTIONS FINANCIÈRES:');
    console.log('==================================');

    // Test de fonction de balance
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_balance', { user_id: '187fba7a-38bf-4280-a069-656240b1c630' });
      
      if (balanceError) {
        console.log(`❌ get_user_balance: ${balanceError.message}`);
      } else {
        console.log(`✅ get_user_balance fonctionne: ${balanceData}`);
      }
    } catch (e) {
      console.log(`⚠️ get_user_balance non disponible`);
    }

    // Test de fonction de mise à jour de balance
    try {
      const { data: updateData, error: updateError } = await supabase
        .rpc('update_user_balance', { 
          user_id: '187fba7a-38bf-4280-a069-656240b1c630',
          amount: 0 // Test avec 0 pour ne pas modifier
        });
      
      if (updateError) {
        console.log(`❌ update_user_balance: ${updateError.message}`);
      } else {
        console.log(`✅ update_user_balance disponible`);
      }
    } catch (e) {
      console.log(`⚠️ update_user_balance non disponible`);
    }

    console.log('\n' + '='.repeat(60));

    // 4. Vérifier les politiques RLS
    console.log('\n🔒 VÉRIFICATION DES POLITIQUES RLS:');
    console.log('==================================');

    const testTables = ['users', 'credit_transactions', 'websites'];
    
    for (const table of testTables) {
      try {
        console.log(`\n🔍 Test RLS sur la table: ${table}`);
        
        // Test avec clé anonyme
        const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI');
        
        const { data: anonData, error: anonError } = await anonSupabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (anonError) {
          if (anonError.message.includes('RLS') || anonError.message.includes('policy')) {
            console.log(`   🔒 RLS activé sur ${table} - accès anonyme bloqué`);
          } else {
            console.log(`   ⚠️ Erreur d'accès anonyme: ${anonError.message}`);
          }
        } else {
          console.log(`   ⚠️ Accès anonyme autorisé sur ${table} (${anonData?.length || 0} résultats)`);
        }
        
      } catch (e) {
        console.log(`   ❌ Erreur test RLS: ${e.message}`);
      }
    }

    console.log('\n✅ Analyse des fonctions et triggers terminée!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'analyse
checkFunctionsAndTriggers().catch(error => {
  console.error('❌ Erreur générale:', error);
  process.exit(1);
});
