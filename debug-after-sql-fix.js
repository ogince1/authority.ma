import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Problème après application du SQL fix\n');

async function debugAfterSQLFix() {
  try {
    // Vérifier les soldes actuels
    console.log('📊 SOLDES ACTUELS:');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (usersError) {
      console.log('❌ Erreur récupération users:', usersError);
      return;
    }

    users?.forEach((user) => {
      console.log(`   ${user.email}: ${user.balance} MAD (${new Date(user.updated_at).toLocaleString()})`);
    });

    const advertiser = users?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisher = users?.find(u => u.email === 'ogincema@gmail.com');

    // Test simple avec une transaction de 2 MAD
    console.log('\n📋 TEST 1: Transaction simple éditeur (2 MAD)...');
    
    const testAmount1 = 2;
    const { data: testTransaction1, error: testError1 } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher?.id,
        type: 'deposit',
        amount: testAmount1,
        description: 'Test après SQL fix - éditeur',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError1) {
      console.log('❌ Erreur transaction éditeur:', testError1);
      console.log('   Code:', testError1.code);
      console.log('   Message:', testError1.message);
      console.log('   Détails:', testError1.details);
    } else {
      console.log(`✅ Transaction éditeur créée: ${testTransaction1.id.slice(0, 8)}...`);
      console.log(`   Balance before: ${testTransaction1.balance_before} MAD`);
      console.log(`   Balance after: ${testTransaction1.balance_after} MAD`);
    }

    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: updatedPublisher1 } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher?.id)
      .single();

    console.log(`   Solde éditeur après: ${publisher?.balance} → ${updatedPublisher1?.balance} MAD`);
    
    if (testTransaction1 && updatedPublisher1?.balance === testTransaction1.balance_after) {
      console.log(`   ✅ TRIGGER ÉDITEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER ÉDITEUR: NE FONCTIONNE PAS !`);
    }

    // Test simple avec une transaction annonceur
    console.log('\n📋 TEST 2: Transaction simple annonceur (3 MAD)...');
    
    const testAmount2 = 3;
    const { data: testTransaction2, error: testError2 } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: advertiser?.id,
        type: 'purchase',
        amount: testAmount2,
        description: 'Test après SQL fix - annonceur',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError2) {
      console.log('❌ Erreur transaction annonceur:', testError2);
      console.log('   Code:', testError2.code);
      console.log('   Message:', testError2.message);
      console.log('   Détails:', testError2.details);
    } else {
      console.log(`✅ Transaction annonceur créée: ${testTransaction2.id.slice(0, 8)}...`);
      console.log(`   Balance before: ${testTransaction2.balance_before} MAD`);
      console.log(`   Balance after: ${testTransaction2.balance_after} MAD`);
    }

    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: updatedAdvertiser2 } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser?.id)
      .single();

    console.log(`   Solde annonceur après: ${advertiser?.balance} → ${updatedAdvertiser2?.balance} MAD`);
    
    if (testTransaction2 && updatedAdvertiser2?.balance === testTransaction2.balance_after) {
      console.log(`   ✅ TRIGGER ANNONCEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER ANNONCEUR: NE FONCTIONNE PAS !`);
    }

    // Vérifier l'état des triggers via RPC
    console.log('\n📋 TEST 3: Vérification des triggers via RPC...');
    
    try {
      const { data: triggerStatus, error: triggerError } = await supabase
        .rpc('check_triggers_status');

      if (triggerError) {
        console.log('❌ Erreur vérification triggers:', triggerError);
      } else {
        console.log(`✅ État des triggers:`);
        triggerStatus?.forEach((trigger, index) => {
          console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.is_active ? 'Actif' : 'Inactif'})`);
        });
      }
    } catch (err) {
      console.log('❌ RPC check_triggers_status non disponible:', err.message);
    }

    // Test via RPC si disponible
    console.log('\n📋 TEST 4: Test via RPC si disponible...');
    
    try {
      const { data: rpcTest, error: rpcError } = await supabase
        .rpc('test_balance_triggers', {
          p_user_id: publisher?.id,
          p_type: 'deposit',
          p_amount: 1,
          p_description: 'Test RPC'
        });

      if (rpcError) {
        console.log('❌ Erreur test RPC:', rpcError);
      } else {
        console.log(`✅ Test RPC réussi:`);
        rpcTest?.forEach((result, index) => {
          console.log(`   ${index + 1}. Success: ${result.success}`);
          console.log(`      Old balance: ${result.old_balance} MAD`);
          console.log(`      New balance: ${result.new_balance} MAD`);
        });
      }
    } catch (err) {
      console.log('❌ RPC test_balance_triggers non disponible:', err.message);
    }

    console.log('\n🎯 DIAGNOSTIC:');
    console.log('   Si aucun trigger ne fonctionne après le SQL fix:');
    console.log('   1. Le SQL n\'a pas été exécuté correctement');
    console.log('   2. Il y a une erreur de syntaxe dans les fonctions');
    console.log('   3. Les triggers ont été supprimés mais pas recréés');
    console.log('   4. Il y a un problème de permissions');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugAfterSQLFix();
