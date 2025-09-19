import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VÉRIFICATION DES TABLES SUR SUPABASE CLOUD\n');

async function checkSupabaseTables() {
  try {
    // 1. Vérifier les tables principales
    console.log('📋 1. VÉRIFICATION DES TABLES PRINCIPALES:');
    
    const tables = ['users', 'credit_transactions', 'link_purchase_requests', 'link_purchase_transactions', 'websites', 'link_listings'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: Table existe (${data?.length || 0} enregistrement(s) de test)`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }

    // 2. Vérifier la structure de la table credit_transactions
    console.log('\n📋 2. STRUCTURE DE LA TABLE credit_transactions:');
    
    const { data: creditSample, error: creditError } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(1)
      .single();

    if (creditError) {
      console.log('   ❌ Erreur récupération credit_transactions:', creditError);
    } else {
      console.log('   ✅ Colonnes de credit_transactions:');
      Object.keys(creditSample).forEach(key => {
        console.log(`      - ${key}: ${typeof creditSample[key]} (${creditSample[key]})`);
      });
    }

    // 3. Vérifier la structure de la table users
    console.log('\n📋 3. STRUCTURE DE LA TABLE users:');
    
    const { data: userSample, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();

    if (userError) {
      console.log('   ❌ Erreur récupération users:', userError);
    } else {
      console.log('   ✅ Colonnes de users:');
      Object.keys(userSample).forEach(key => {
        console.log(`      - ${key}: ${typeof userSample[key]} (${userSample[key]})`);
      });
    }

    // 4. Vérifier les fonctions RPC existantes
    console.log('\n📋 4. FONCTIONS RPC EXISTANTES:');
    
    const rpcFunctions = [
      'get_table_triggers',
      'check_trigger_status', 
      'repair_missing_triggers',
      'test_balance_trigger',
      'update_user_balance_after_transaction',
      'check_balance_before_transaction'
    ];

    for (const funcName of rpcFunctions) {
      try {
        // Essayer d'appeler la fonction avec des paramètres par défaut
        let result;
        if (funcName === 'get_table_triggers') {
          result = await supabase.rpc(funcName, { table_name: 'credit_transactions' });
        } else if (funcName === 'test_balance_trigger') {
          // Skip cette fonction car elle nécessite des paramètres spécifiques
          console.log(`   ⏭️  ${funcName}: Nécessite des paramètres spécifiques`);
          continue;
        } else {
          result = await supabase.rpc(funcName);
        }
        
        if (result.error) {
          console.log(`   ❌ ${funcName}: ${result.error.message}`);
        } else {
          console.log(`   ✅ ${funcName}: Fonction existe`);
        }
      } catch (err) {
        console.log(`   ❌ ${funcName}: ${err.message}`);
      }
    }

    // 5. Test des triggers avec une transaction réelle
    console.log('\n📋 5. TEST DES TRIGGERS AVEC UNE TRANSACTION RÉELLE:');
    
    // Récupérer un utilisateur de test
    const { data: testUser, error: userTestError } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (userTestError || !testUser) {
      console.log('   ❌ Impossible de trouver un utilisateur de test');
    } else {
      console.log(`   🎯 Utilisateur de test: ${testUser.email} (Solde: ${testUser.balance} MAD)`);
      
      // Créer une transaction de test
      const testAmount = 5;
      const { data: testTransaction, error: testError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: testUser.id,
          type: 'deposit',
          amount: testAmount,
          description: 'Test vérification triggers',
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
        console.log('   ❌ Erreur création transaction de test:', testError);
      } else {
        console.log(`   ✅ Transaction de test créée: ${testTransaction.id.slice(0, 8)}...`);
        
        // Attendre un peu pour que le trigger se déclenche
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Vérifier si le solde a été mis à jour
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .select('balance, updated_at')
          .eq('id', testUser.id)
          .single();

        if (updateError) {
          console.log('   ❌ Erreur vérification solde:', updateError);
        } else {
          console.log(`   📊 Solde avant: ${testUser.balance} MAD`);
          console.log(`   📊 Solde après: ${updatedUser.balance} MAD`);
          
          if (updatedUser.balance === testUser.balance + testAmount) {
            console.log('   ✅ TRIGGER FONCTIONNE ! Solde mis à jour automatiquement');
          } else {
            console.log('   ❌ TRIGGER NE FONCTIONNE PAS ! Solde non mis à jour');
          }
        }
      }
    }

    // 6. Vérifier les migrations récentes
    console.log('\n📋 6. VÉRIFICATION DES MIGRATIONS:');
    
    try {
      const { data: migrations, error: migrationError } = await supabase
        .from('supabase_migrations')
        .select('*')
        .order('version', { ascending: false })
        .limit(5);

      if (migrationError) {
        console.log('   ❌ Erreur récupération migrations:', migrationError);
      } else {
        console.log('   ✅ Migrations récentes:');
        migrations?.forEach((migration, index) => {
          console.log(`      ${index + 1}. ${migration.version} - ${migration.name}`);
        });
      }
    } catch (err) {
      console.log('   ❌ Table supabase_migrations non accessible:', err.message);
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log('   - Vérifiez que les tables existent');
    console.log('   - Vérifiez que les triggers fonctionnent');
    console.log('   - Vérifiez que les fonctions RPC sont créées');
    console.log('   - Vérifiez que les migrations sont appliquées');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkSupabaseTables();
