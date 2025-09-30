// Script pour déboguer le problème RLS persistant
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Débogage du problème RLS persistant...\n');

async function debugRLSIssue() {
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';
    const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';
    
    // 1. Vérifier les politiques RLS actuelles
    console.log('1️⃣ Vérification des politiques RLS actuelles...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'credit_transactions' });
    
    if (policiesError) {
      console.log('⚠️  Impossible de récupérer les politiques via RPC:', policiesError.message);
      
      // Essayer une requête directe
      const { data: directPolicies, error: directError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'credit_transactions');
      
      if (directError) {
        console.log('❌ Impossible de récupérer les politiques:', directError.message);
      } else {
        console.log(`📋 ${directPolicies.length} politique(s) trouvée(s) pour credit_transactions:`);
        directPolicies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname}`);
          console.log(`      Commandes: ${policy.cmd}`);
          console.log(`      Rôles: ${policy.roles}`);
          console.log(`      Condition: ${policy.qual || 'Aucune'}`);
          console.log('');
        });
      }
    } else {
      console.log('📋 Politiques récupérées via RPC:', policies);
    }
    
    // 2. Tester l'insertion avec différents utilisateurs
    console.log('2️⃣ Test d\'insertion avec différents utilisateurs...');
    
    // Test 1: Insertion avec l'ID de l'éditeur
    console.log('\n   Test 1: Insertion avec l\'ID de l\'éditeur...');
    const testTransaction1 = {
      user_id: publisherId,
      type: 'deposit',
      amount: 5,
      description: 'Test RLS - Éditeur',
      currency: 'MAD',
      status: 'completed',
      balance_before: 0,
      balance_after: 5,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    const { data: inserted1, error: error1 } = await supabase
      .from('credit_transactions')
      .insert([testTransaction1])
      .select('id')
      .single();
    
    if (error1) {
      console.log('   ❌ Erreur insertion éditeur:', error1.message);
      console.log('   Code:', error1.code);
    } else {
      console.log('   ✅ Insertion éditeur réussie:', inserted1.id);
      
      // Supprimer la transaction de test
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', inserted1.id);
    }
    
    // Test 2: Insertion avec l'ID de l'annonceur
    console.log('\n   Test 2: Insertion avec l\'ID de l\'annonceur...');
    const testTransaction2 = {
      user_id: advertiserId,
      type: 'purchase',
      amount: 5,
      description: 'Test RLS - Annonceur',
      currency: 'MAD',
      status: 'completed',
      balance_before: 0,
      balance_after: 5,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    const { data: inserted2, error: error2 } = await supabase
      .from('credit_transactions')
      .insert([testTransaction2])
      .select('id')
      .single();
    
    if (error2) {
      console.log('   ❌ Erreur insertion annonceur:', error2.message);
      console.log('   Code:', error2.code);
    } else {
      console.log('   ✅ Insertion annonceur réussie:', inserted2.id);
      
      // Supprimer la transaction de test
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', inserted2.id);
    }
    
    // 3. Tester l'insertion multiple (comme dans confirmLinkPlacement)
    console.log('\n3️⃣ Test d\'insertion multiple (comme dans confirmLinkPlacement)...');
    
    const multipleTransactions = [
      {
        user_id: advertiserId,
        type: 'purchase',
        amount: 10,
        description: 'Test RLS - Achat multiple',
        currency: 'MAD',
        status: 'completed',
        balance_before: 0,
        balance_after: 10,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      },
      {
        user_id: publisherId,
        type: 'deposit',
        amount: 9,
        description: 'Test RLS - Vente multiple',
        currency: 'MAD',
        status: 'completed',
        balance_before: 0,
        balance_after: 9,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
    ];
    
    const { data: insertedMultiple, error: errorMultiple } = await supabase
      .from('credit_transactions')
      .insert(multipleTransactions)
      .select('id');
    
    if (errorMultiple) {
      console.log('❌ Erreur insertion multiple:', errorMultiple.message);
      console.log('Code:', errorMultiple.code);
      console.log('Details:', errorMultiple.details);
      console.log('Hint:', errorMultiple.hint);
    } else {
      console.log('✅ Insertion multiple réussie:', insertedMultiple.length, 'transactions');
      
      // Supprimer les transactions de test
      const ids = insertedMultiple.map(t => t.id);
      await supabase
        .from('credit_transactions')
        .delete()
        .in('id', ids);
    }
    
    // 4. Vérifier si RLS est activé sur la table
    console.log('\n4️⃣ Vérification du statut RLS sur la table...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'credit_transactions');
    
    if (tableError) {
      console.log('⚠️  Impossible de récupérer les infos de la table:', tableError.message);
    } else {
      console.log('📋 Informations de la table credit_transactions:');
      console.log('   Nom:', tableInfo[0]?.tablename);
      console.log('   Schéma:', tableInfo[0]?.schemaname);
    }
    
    // 5. Solution alternative : Désactiver temporairement RLS
    console.log('\n5️⃣ Solution alternative : Désactiver temporairement RLS...');
    
    console.log('💡 Si le problème persiste, exécutez ce SQL dans Supabase:');
    console.log('');
    console.log('-- Désactiver temporairement RLS sur credit_transactions');
    console.log('ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Ou créer une politique plus permissive');
    console.log('CREATE POLICY "Allow all operations on credit_transactions" ON credit_transactions');
    console.log('  FOR ALL USING (true) WITH CHECK (true);');
    console.log('');
    
    // 6. Test avec une politique permissive
    console.log('\n6️⃣ Test avec une politique permissive...');
    
    console.log('💡 Essayez d\'exécuter ce SQL dans Supabase:');
    console.log('');
    console.log('-- Supprimer toutes les politiques existantes');
    console.log('DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;');
    console.log('DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON credit_transactions;');
    console.log('DROP POLICY IF EXISTS "Users can update their own credit transactions" ON credit_transactions;');
    console.log('DROP POLICY IF EXISTS "Users can delete their own credit transactions" ON credit_transactions;');
    console.log('DROP POLICY IF EXISTS "Allow all operations on credit_transactions" ON credit_transactions;');
    console.log('');
    console.log('-- Créer une politique permissive');
    console.log('CREATE POLICY "Allow all operations on credit_transactions" ON credit_transactions');
    console.log('  FOR ALL USING (true) WITH CHECK (true);');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur dans debugRLSIssue:', error);
  }
}

// Fonction principale
async function runDebug() {
  console.log('🚀 Démarrage du débogage RLS...\n');
  
  await debugRLSIssue();
  
  console.log('\n✅ Débogage terminé !');
  console.log('\n💡 Solutions recommandées:');
  console.log('   1. Désactiver temporairement RLS sur credit_transactions');
  console.log('   2. Créer une politique permissive');
  console.log('   3. Vérifier que les politiques ont été appliquées correctement');
}

// Exécuter le débogage
runDebug().catch(console.error);
