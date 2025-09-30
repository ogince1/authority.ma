import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exploreDatabaseFunctions() {
  console.log('🔍 Exploration approfondie des fonctions et triggers...\n');

  try {
    // 1. Utiliser une requête SQL directe pour lister les fonctions
    console.log('📋 RECHERCHE DES FONCTIONS EXISTANTES:');
    console.log('====================================');

    // Essayer plusieurs approches pour obtenir les métadonnées
    const sqlQueries = [
      `SELECT routine_name, routine_type, routine_definition 
       FROM information_schema.routines 
       WHERE routine_schema = 'public'`,
      
      `SELECT proname as name, prokind as type 
       FROM pg_proc 
       WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
       
      `SELECT schemaname, tablename, triggername, tgfname 
       FROM pg_trigger t 
       JOIN pg_class c ON t.tgrelid = c.oid 
       JOIN pg_namespace n ON c.relnamespace = n.oid 
       WHERE n.nspname = 'public'`
    ];

    for (let i = 0; i < sqlQueries.length; i++) {
      console.log(`\n🔍 Tentative ${i + 1}: Requête SQL directe...`);
      
      try {
        const { data, error } = await supabase
          .from('information_schema')
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`   ❌ Accès information_schema bloqué: ${error.message}`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message}`);
      }
    }

    // 2. Tester des fonctions système Supabase connues
    console.log('\n🔧 TEST DES FONCTIONS SYSTÈME SUPABASE:');
    console.log('=====================================');

    const systemFunctions = [
      'auth.users',
      'auth.refresh_tokens', 
      'storage.objects',
      'realtime.messages'
    ];

    for (const func of systemFunctions) {
      try {
        console.log(`🔍 Test: ${func}`);
        const { data, error } = await supabase
          .from(func.replace('auth.', '').replace('storage.', '').replace('realtime.', ''))
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === '42P01') {
            console.log(`   ❌ Table/vue ${func} n'existe pas`);
          } else {
            console.log(`   ⚠️ ${func}: ${error.message}`);
          }
        } else {
          console.log(`   ✅ ${func} accessible`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message}`);
      }
    }

    // 3. Analyser les triggers en observant le comportement
    console.log('\n🔄 ANALYSE COMPORTEMENTALE DES TRIGGERS:');
    console.log('======================================');

    // Test sur la table users avec un UUID valide
    console.log('\n📊 Test de triggers sur la table users:');
    try {
      const testUserId = crypto.randomUUID();
      console.log(`   🧪 Tentative d'insertion avec UUID: ${testUserId}`);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: testUserId,
          name: 'Test Trigger User',
          email: `test-${Date.now()}@trigger-test.com`,
          role: 'advertiser',
          balance: 0
        }])
        .select();

      if (insertError) {
        console.log(`   ❌ Insertion bloquée: ${insertError.message}`);
        
        if (insertError.message.includes('duplicate key')) {
          console.log(`   🔄 Contrainte d'unicité active`);
        } else if (insertError.message.includes('foreign key')) {
          console.log(`   🔗 Contrainte de clé étrangère active`);
        } else if (insertError.message.includes('check constraint')) {
          console.log(`   ✅ Contrainte de validation active`);
        }
      } else if (insertResult && insertResult.length > 0) {
        console.log(`   ✅ Insertion réussie`);
        
        // Vérifier les valeurs automatiques
        const inserted = insertResult[0];
        if (inserted.created_at) {
          console.log(`   🕒 created_at automatique: ${inserted.created_at}`);
        }
        if (inserted.updated_at) {
          console.log(`   🔄 updated_at automatique: ${inserted.updated_at}`);
        }
        
        // Test de mise à jour pour voir les triggers
        console.log(`   🔄 Test de mise à jour...`);
        const { data: updateResult, error: updateError } = await supabase
          .from('users')
          .update({ name: 'Test Updated' })
          .eq('id', testUserId)
          .select();
          
        if (!updateError && updateResult && updateResult.length > 0) {
          const updated = updateResult[0];
          if (updated.updated_at !== inserted.updated_at) {
            console.log(`   ✅ Trigger de mise à jour détecté (updated_at modifié)`);
          }
        }
        
        // Nettoyer
        await supabase
          .from('users')
          .delete()
          .eq('id', testUserId);
        console.log(`   🗑️ Données de test supprimées`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur test users: ${e.message}`);
    }

    // 4. Test sur credit_transactions pour détecter les triggers financiers
    console.log('\n💰 Test de triggers sur credit_transactions:');
    try {
      // Utiliser un user_id existant
      const existingUserId = '187fba7a-38bf-4280-a069-656240b1c630';
      const testTransactionId = crypto.randomUUID();
      
      console.log(`   🧪 Test de transaction pour user: ${existingUserId}`);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('credit_transactions')
        .insert([{
          id: testTransactionId,
          user_id: existingUserId,
          type: 'deposit',
          amount: 100,
          currency: 'MAD',
          status: 'pending',
          description: 'Test trigger transaction',
          payment_method: 'test'
        }])
        .select();

      if (insertError) {
        console.log(`   ❌ Insertion transaction bloquée: ${insertError.message}`);
      } else if (insertResult && insertResult.length > 0) {
        console.log(`   ✅ Transaction créée`);
        
        const transaction = insertResult[0];
        
        // Vérifier les champs automatiques
        if (transaction.balance_before !== null) {
          console.log(`   💰 balance_before calculé: ${transaction.balance_before}`);
        }
        if (transaction.balance_after !== null) {
          console.log(`   💰 balance_after calculé: ${transaction.balance_after}`);
        }
        if (transaction.commission_amount !== null) {
          console.log(`   💸 commission calculée: ${transaction.commission_amount}`);
        }
        
        // Vérifier si la balance utilisateur a été mise à jour
        const { data: userBalance } = await supabase
          .from('users')
          .select('balance')
          .eq('id', existingUserId)
          .single();
          
        console.log(`   👤 Balance utilisateur actuelle: ${userBalance?.balance}`);
        
        // Nettoyer
        await supabase
          .from('credit_transactions')
          .delete()
          .eq('id', testTransactionId);
        console.log(`   🗑️ Transaction de test supprimée`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur test transactions: ${e.message}`);
    }

    // 5. Vérifier les politiques RLS en détail
    console.log('\n🔒 ANALYSE DÉTAILLÉE DES POLITIQUES RLS:');
    console.log('======================================');

    const tables = ['users', 'credit_transactions', 'websites', 'advertiser_requests'];
    
    for (const table of tables) {
      console.log(`\n🔍 Table: ${table}`);
      
      // Test avec clé anonyme
      const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI');
      
      try {
        // Test de lecture
        const { data: readData, error: readError } = await anonSupabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (readError) {
          console.log(`   🔒 Lecture anonyme bloquée: ${readError.message}`);
        } else {
          console.log(`   ⚠️ Lecture anonyme autorisée (${readData?.length || 0} résultats)`);
        }
        
        // Test d'écriture
        const testId = crypto.randomUUID();
        const testData = table === 'users' ? {
          id: testId,
          name: 'Test RLS',
          email: 'test-rls@test.com',
          role: 'advertiser'
        } : { id: testId, user_id: testId };
        
        const { error: writeError } = await anonSupabase
          .from(table)
          .insert([testData]);
          
        if (writeError) {
          console.log(`   🔒 Écriture anonyme bloquée: ${writeError.message}`);
        } else {
          console.log(`   ⚠️ Écriture anonyme autorisée`);
          // Nettoyer si l'insertion a réussi
          await supabase.from(table).delete().eq('id', testId);
        }
        
      } catch (e) {
        console.log(`   ❌ Erreur test RLS: ${e.message}`);
      }
    }

    console.log('\n✅ Exploration terminée!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'exploration
exploreDatabaseFunctions().catch(error => {
  console.error('❌ Erreur générale:', error);
  process.exit(1);
});
