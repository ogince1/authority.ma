import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud avec Service Role
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeServiceRole() {
  console.log('🔑 Analyse avec Service Role Key Supabase...\n');

  try {
    // 1. Décoder le JWT pour voir les permissions
    console.log('🔍 ANALYSE DU JWT SERVICE ROLE:');
    console.log('==============================');
    
    const base64Payload = serviceRoleKey.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    
    console.log('📋 Contenu du JWT:');
    console.log(`   - Issuer: ${payload.iss}`);
    console.log(`   - Reference: ${payload.ref}`);
    console.log(`   - Role: ${payload.role}`);
    console.log(`   - Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
    console.log(`   - Expires At: ${new Date(payload.exp * 1000).toISOString()}`);
    
    // 2. Explorer les schémas disponibles avec service role
    console.log('\n🗂️ EXPLORATION DES SCHÉMAS:');
    console.log('===========================');
    
    const schemas = ['public', 'auth', 'storage', 'realtime', 'information_schema', 'pg_catalog'];
    
    for (const schema of schemas) {
      console.log(`\n📁 Schéma: ${schema}`);
      
      try {
        // Essayer d'accéder aux tables du schéma
        const { data, error } = await supabase
          .from(`${schema === 'public' ? '' : schema + '.'}users`)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === '42P01') {
            console.log(`   ❌ Table users n'existe pas dans ${schema}`);
          } else {
            console.log(`   ⚠️ Erreur d'accès: ${error.message.substring(0, 100)}...`);
          }
        } else {
          console.log(`   ✅ Accès réussi à ${schema}.users`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message.substring(0, 50)}...`);
      }
    }

    // 3. Utiliser des requêtes SQL directes avec le service role
    console.log('\n🔧 REQUÊTES SQL DIRECTES:');
    console.log('========================');
    
    const sqlQueries = [
      {
        name: 'Lister les schémas',
        query: `SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`
      },
      {
        name: 'Lister les tables publiques',
        query: `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      },
      {
        name: 'Lister les fonctions',
        query: `SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name`
      },
      {
        name: 'Lister les triggers',
        query: `SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public'`
      },
      {
        name: 'Lister les contraintes',
        query: `SELECT constraint_name, table_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public'`
      }
    ];

    for (const { name, query } of sqlQueries) {
      console.log(`\n🔍 ${name}:`);
      try {
        const { data, error } = await supabase.rpc('exec_sql', { query });
        
        if (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        } else {
          console.log(`   ✅ Résultats: ${JSON.stringify(data).substring(0, 200)}...`);
        }
      } catch (e) {
        // Essayer une approche alternative si exec_sql n'existe pas
        console.log(`   ⚠️ exec_sql non disponible, tentative alternative...`);
        
        // Pour les tables, essayer un accès direct
        if (name.includes('tables')) {
          try {
            const { data: tables, error: tablesError } = await supabase
              .from('information_schema.tables')
              .select('table_name, table_type')
              .eq('table_schema', 'public');
              
            if (!tablesError) {
              console.log(`   ✅ Tables trouvées: ${tables?.length || 0}`);
              tables?.slice(0, 5).forEach(table => {
                console.log(`      - ${table.table_name} (${table.table_type})`);
              });
            }
          } catch (altError) {
            console.log(`   ❌ Accès alternatif échoué: ${altError.message}`);
          }
        }
      }
    }

    // 4. Explorer les tables système auth avec service role
    console.log('\n👤 EXPLORATION DU SCHÉMA AUTH:');
    console.log('=============================');
    
    const authTables = ['users', 'identities', 'sessions', 'refresh_tokens'];
    
    for (const table of authTables) {
      console.log(`\n🔍 auth.${table}:`);
      try {
        const { data, error } = await supabase
          .from(`auth.${table}`)
          .select('*')
          .limit(2);
          
        if (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        } else {
          console.log(`   ✅ ${data?.length || 0} enregistrements trouvés`);
          if (data && data.length > 0) {
            console.log(`   📋 Colonnes: ${Object.keys(data[0]).join(', ')}`);
            // Masquer les données sensibles
            const safeData = data.map(row => {
              const safe = { ...row };
              if (safe.email) safe.email = safe.email.replace(/(.{2}).*(@.*)/, '$1***$2');
              if (safe.encrypted_password) safe.encrypted_password = '***';
              if (safe.phone) safe.phone = '***';
              return safe;
            });
            console.log(`   📄 Exemple: ${JSON.stringify(safeData[0], null, 2)}`);
          }
        }
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message}`);
      }
    }

    // 5. Vérifier les capacités de storage
    console.log('\n📁 EXPLORATION DU STORAGE:');
    console.log('==========================');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.log(`❌ Erreur buckets: ${bucketsError.message}`);
      } else {
        console.log(`✅ ${buckets?.length || 0} buckets trouvés`);
        buckets?.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'privé'})`);
        });
      }
    } catch (e) {
      console.log(`❌ Storage inaccessible: ${e.message}`);
    }

    // 6. Tester les fonctions RPC avec plus de permissions
    console.log('\n🔧 TEST DES FONCTIONS RPC AVEC SERVICE ROLE:');
    console.log('===========================================');
    
    const rpcFunctions = [
      'get_user_stats',
      'calculate_balance',
      'process_payment',
      'update_metrics',
      'cleanup_expired',
      'generate_report'
    ];
    
    for (const func of rpcFunctions) {
      try {
        console.log(`🔍 Test: ${func}`);
        const { data, error } = await supabase.rpc(func);
        
        if (error) {
          if (error.code === '42883') {
            console.log(`   ❌ Fonction ${func} n'existe pas`);
          } else {
            console.log(`   ⚠️ Fonction ${func} existe mais erreur: ${error.message.substring(0, 100)}...`);
          }
        } else {
          console.log(`   ✅ Fonction ${func} disponible: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message.substring(0, 50)}...`);
      }
    }

    // 7. Analyser les politiques RLS avec service role
    console.log('\n🔒 ANALYSE RLS AVEC SERVICE ROLE:');
    console.log('================================');
    
    const tables = ['users', 'credit_transactions', 'websites'];
    
    for (const table of tables) {
      console.log(`\n📊 Table: ${table}`);
      
      try {
        // Le service role devrait bypasser RLS
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);
          
        if (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        } else {
          console.log(`   ✅ Service role accès: ${data?.length || 0} enregistrements`);
          console.log(`   🔓 RLS bypassé avec service role`);
        }
        
        // Test d'insertion avec service role
        const testId = crypto.randomUUID();
        const testData = table === 'users' ? {
          id: testId,
          name: 'Test Service Role',
          email: `test-${Date.now()}@service.com`,
          role: 'advertiser',
          balance: 0
        } : table === 'credit_transactions' ? {
          id: testId,
          user_id: '187fba7a-38bf-4280-a069-656240b1c630',
          type: 'deposit',
          amount: 1,
          currency: 'MAD',
          status: 'completed',
          description: 'Test service role',
          payment_method: 'bank_transfer'
        } : {
          id: testId,
          user_id: '187fba7a-38bf-4280-a069-656240b1c630',
          title: 'Test Website Service',
          url: 'https://test-service.com',
          category: 'test',
          slug: 'test-service'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from(table)
          .insert([testData])
          .select();
          
        if (insertError) {
          console.log(`   ⚠️ Insertion bloquée: ${insertError.message.substring(0, 100)}...`);
        } else {
          console.log(`   ✅ Insertion réussie avec service role`);
          
          // Nettoyer immédiatement
          await supabase.from(table).delete().eq('id', testId);
          console.log(`   🗑️ Test data supprimée`);
        }
        
      } catch (e) {
        console.log(`   ❌ Erreur: ${e.message}`);
      }
    }

    console.log('\n✅ Analyse service role terminée!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'analyse
analyzeServiceRole().catch(error => {
  console.error('❌ Erreur générale:', error);
  process.exit(1);
});
