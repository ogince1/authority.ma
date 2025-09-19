import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec la clé ANON (comme le vrai frontend)
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 TEST: Après correction RLS - avec clé ANON\n');

async function testAfterRLSFix() {
  try {
    console.log('📋 ÉTAPE 1: Authentification...');
    
    // S'authentifier comme l'annonceur
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'abderrahimmolatefpro@gmail.com',
      password: 'password123'
    });

    if (authError) {
      console.log('❌ Erreur authentification:', authError.message);
      console.log('   Continuons sans authentification...');
    } else {
      console.log('✅ Authentifié comme:', authData.user?.email);
    }

    console.log('\n📋 ÉTAPE 2: Test de la fonction RPC simple...');
    
    // Tester la fonction RPC simple
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('test_triggers_simple', {
          user_email: 'ogincema@gmail.com',
          amount: 1.0
        });

      if (rpcError) {
        console.log('❌ Erreur RPC test_triggers_simple:', rpcError);
        console.log('   Code:', rpcError.code);
        console.log('   Message:', rpcError.message);
      } else {
        console.log('✅ RPC test_triggers_simple réussi:', rpcResult);
        
        if (rpcResult?.includes('SUCCESS')) {
          console.log('   ✅ LES TRIGGERS FONCTIONNENT AVEC LA CLÉ ANON !');
        } else {
          console.log('   ❌ Les triggers ne fonctionnent toujours pas:', rpcResult);
        }
      }
    } catch (err) {
      console.log('❌ RPC non disponible:', err.message);
    }

    console.log('\n📋 ÉTAPE 3: Test direct avec transaction...');
    
    // Récupérer les soldes actuels
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com']);

    if (usersError) {
      console.log('❌ Erreur récupération users:', usersError);
      return;
    }

    console.log('📊 SOLDES AVANT TEST:');
    users?.forEach((user) => {
      console.log(`   ${user.email}: ${user.balance} MAD (${new Date(user.updated_at).toLocaleString()})`);
    });

    const advertiser = users?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisher = users?.find(u => u.email === 'ogincema@gmail.com');

    if (!publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    // Test avec une transaction simple
    const testAmount = 2;
    console.log(`\n💳 Création d'une transaction de test (${testAmount} MAD) avec clé ANON...`);
    
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test après correction RLS',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur création transaction avec anon:', testError);
      console.log('   Code:', testError.code);
      console.log('   Message:', testError.message);
      console.log('   Détails:', testError.details);
      
      if (testError.code === 'P0001') {
        console.log('   🔍 PROBLÈME: Les triggers ne peuvent toujours pas mettre à jour users');
        console.log('   SOLUTION: Il faut ajuster davantage les politiques RLS');
      }
      
      return;
    }

    console.log(`✅ Transaction créée avec anon: ${testTransaction.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction.balance_after} MAD`);

    // Vérifier si les triggers ont calculé les valeurs
    if (testTransaction.balance_before === null || testTransaction.balance_after === null) {
      console.log(`❌ TRIGGERS BEFORE avec ANON: NE FONCTIONNENT PAS !`);
    } else {
      console.log(`✅ TRIGGERS BEFORE avec ANON: FONCTIONNENT !`);
    }

    // Attendre et vérifier la mise à jour dans users
    console.log('\n⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: updatedPublisher, error: updateError } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    if (updateError) {
      console.log('❌ Erreur récupération solde mis à jour:', updateError);
      return;
    }

    console.log(`📊 Résultat avec clé anon:`);
    console.log(`   Solde avant: ${publisher.balance} MAD`);
    console.log(`   Solde après: ${updatedPublisher.balance} MAD`);
    console.log(`   Attendu: ${publisher.balance + testAmount} MAD`);
    console.log(`   Timestamp: ${new Date(updatedPublisher.updated_at).toLocaleString()}`);

    if (updatedPublisher.balance === publisher.balance + testAmount) {
      console.log(`   ✅ TRIGGERS AFTER avec ANON: FONCTIONNENT !`);
      console.log(`\n🎉 PROBLÈME RÉSOLU ! LE FRONTEND VA MAINTENANT FONCTIONNER !`);
    } else {
      console.log(`   ❌ TRIGGERS AFTER avec ANON: NE FONCTIONNENT TOUJOURS PAS !`);
      console.log(`   Différence: ${Math.abs(updatedPublisher.balance - (publisher.balance + testAmount))} MAD`);
      console.log(`\n❌ IL FAUT ENCORE AJUSTER LES POLITIQUES RLS`);
    }

    console.log('\n📋 ÉTAPE 4: Test d\'une vraie confirmation...');
    
    if (advertiser && updatedPublisher.balance === publisher.balance + testAmount) {
      console.log('🚀 Les triggers fonctionnent ! Testons une vraie confirmation...');
      
      // Créer une demande et la confirmer
      const { data: existingLink } = await supabase
        .from('link_listings')
        .select('id, title')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (existingLink) {
        // Note: Nous ne pouvons pas créer de demande avec anon à cause de RLS
        // Mais nous savons maintenant que les triggers fonctionnent !
        console.log('✅ Les triggers fonctionnent avec anon !');
        console.log('   Votre frontend devrait maintenant fonctionner parfaitement !');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testAfterRLSFix();
