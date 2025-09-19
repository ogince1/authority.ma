import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 INSPECTION DIRECTE DES TRIGGERS DANS SUPABASE CLOUD\n');

async function checkSupabaseCloudTriggers() {
  try {
    console.log('📋 MÉTHODE 1: Utilisation de l\'API REST pour inspecter les triggers...');
    
    // Créer une fonction RPC simple pour inspecter les triggers
    const inspectTriggersSQL = `
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'credit_transactions'
      ORDER BY trigger_name;
    `;

    // Utiliser l'API REST directement
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ query: inspectTriggersSQL })
    });

    if (response.ok) {
      const triggers = await response.json();
      console.log('✅ Triggers trouvés via API REST:');
      triggers?.forEach((trigger, index) => {
        console.log(`   ${index + 1}. ${trigger.trigger_name}`);
        console.log(`      Table: ${trigger.event_object_table}`);
        console.log(`      Timing: ${trigger.action_timing}`);
        console.log(`      Event: ${trigger.event_manipulation}`);
        console.log(`      Function: ${trigger.action_statement}`);
      });
    } else {
      console.log('❌ API REST non disponible:', await response.text());
    }

    console.log('\n📋 MÉTHODE 2: Inspection des fonctions de trigger...');
    
    const inspectFunctionsSQL = `
      SELECT 
        routine_name,
        routine_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_name LIKE '%balance%'
        AND routine_schema = 'public'
      ORDER BY routine_name;
    `;

    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ query: inspectFunctionsSQL })
    });

    if (response2.ok) {
      const functions = await response2.json();
      console.log('✅ Fonctions de trigger trouvées:');
      functions?.forEach((func, index) => {
        console.log(`   ${index + 1}. ${func.routine_name} (${func.routine_type})`);
        console.log(`      Définition: ${func.routine_definition?.substring(0, 100)}...`);
      });
    } else {
      console.log('❌ Inspection des fonctions échouée:', await response2.text());
    }

    console.log('\n📋 MÉTHODE 3: Vérification directe via RPC existant...');
    
    // Utiliser la fonction RPC que j'ai créée précédemment
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('check_triggers_status');

      if (rpcError) {
        console.log('❌ RPC check_triggers_status:', rpcError.message);
      } else {
        console.log('✅ Triggers via RPC:');
        rpcResult?.forEach((trigger, index) => {
          console.log(`   ${index + 1}. ${trigger.trigger_name} sur ${trigger.table_name}`);
          console.log(`      Actif: ${trigger.is_enabled ? 'OUI' : 'NON'}`);
          console.log(`      Fonction: ${trigger.function_name}`);
        });
      }
    } catch (err) {
      console.log('❌ RPC non disponible:', err.message);
    }

    console.log('\n📋 MÉTHODE 4: Test direct d\'une transaction simple...');
    
    // Test très simple pour voir si les triggers se déclenchent
    const { data: testUser } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (testUser) {
      console.log(`🎯 Test avec ${testUser.email} (Solde: ${testUser.balance} MAD)`);
      
      // Transaction très simple
      const { data: simpleTransaction, error: simpleError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: testUser.id,
          type: 'deposit',
          amount: 0.5,
          description: 'Test inspection triggers',
          currency: 'MAD',
          status: 'completed'
        })
        .select()
        .single();

      if (simpleError) {
        console.log('❌ Erreur transaction simple:', simpleError);
        console.log('   Code:', simpleError.code);
        console.log('   Message:', simpleError.message);
      } else {
        console.log('✅ Transaction simple créée:');
        console.log(`   ID: ${simpleTransaction.id.slice(0, 8)}...`);
        console.log(`   Balance before: ${simpleTransaction.balance_before}`);
        console.log(`   Balance after: ${simpleTransaction.balance_after}`);
        
        if (simpleTransaction.balance_before !== null && simpleTransaction.balance_after !== null) {
          console.log('   ✅ Les triggers BEFORE fonctionnent (calculent les balances)');
        } else {
          console.log('   ❌ Les triggers BEFORE ne fonctionnent PAS');
        }

        // Vérifier si le solde a été mis à jour
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: updatedUser } = await supabase
          .from('users')
          .select('balance')
          .eq('id', testUser.id)
          .single();

        if (updatedUser?.balance === simpleTransaction.balance_after) {
          console.log('   ✅ Les triggers AFTER fonctionnent (mettent à jour users)');
        } else {
          console.log('   ❌ Les triggers AFTER ne fonctionnent PAS');
          console.log(`   Balance attendue: ${simpleTransaction.balance_after}`);
          console.log(`   Balance réelle: ${updatedUser?.balance}`);
        }
      }
    }

    console.log('\n🎯 RÉSUMÉ DE L\'INSPECTION:');
    console.log('   Regardez les résultats ci-dessus pour voir:');
    console.log('   1. Quels triggers existent réellement');
    console.log('   2. Si les fonctions de trigger sont correctes');
    console.log('   3. Si les triggers se déclenchent vraiment');
    console.log('   4. Si il y a des erreurs de permissions');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'inspection
checkSupabaseCloudTriggers();
