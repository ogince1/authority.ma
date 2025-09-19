import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec la clé ANON (comme le vrai frontend)
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 TEST: Avec la clé ANON (comme le vrai frontend)\n');

async function testWithAnonKey() {
  try {
    console.log('📋 ÉTAPE 1: Authentification comme utilisateur normal...');
    
    // Simuler l'authentification de l'annonceur
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'abderrahimmolatefpro@gmail.com',
      password: 'password123' // Remplacez par le vrai mot de passe si nécessaire
    });

    if (authError) {
      console.log('❌ Erreur authentification:', authError.message);
      console.log('   Continuons sans authentification...');
    } else {
      console.log('✅ Authentifié comme:', authData.user?.email);
    }

    console.log('\n📋 ÉTAPE 2: Test avec la clé anon...');
    
    // Récupérer les utilisateurs avec la clé anon
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com']);

    if (usersError) {
      console.log('❌ Erreur récupération users avec anon:', usersError);
      console.log('   Code:', usersError.code);
      console.log('   Message:', usersError.message);
      return;
    }

    console.log('✅ Utilisateurs récupérés avec clé anon:');
    users?.forEach((user) => {
      console.log(`   ${user.email}: ${user.balance} MAD`);
    });

    const publisher = users?.find(u => u.email === 'ogincema@gmail.com');
    if (!publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log('\n📋 ÉTAPE 3: Création de transaction avec clé anon...');
    
    // Essayer de créer une transaction avec la clé anon
    const testAmount = 1;
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test avec clé anon',
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
      
      if (testError.code === '42501') {
        console.log('   🔍 PROBLÈME RLS: Les politiques de sécurité bloquent les transactions');
      }
      
      return;
    }

    console.log(`✅ Transaction créée avec anon: ${testTransaction.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction.balance_after} MAD`);

    // Vérifier si les triggers ont fonctionné avec anon
    if (testTransaction.balance_before === null || testTransaction.balance_after === null) {
      console.log(`❌ TRIGGERS BEFORE avec ANON: NE FONCTIONNENT PAS !`);
    } else {
      console.log(`✅ TRIGGERS BEFORE avec ANON: FONCTIONNENT !`);
    }

    // Attendre et vérifier la mise à jour
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

    if (updatedPublisher.balance === publisher.balance + testAmount) {
      console.log(`   ✅ TRIGGERS AFTER avec ANON: FONCTIONNENT !`);
    } else {
      console.log(`   ❌ TRIGGERS AFTER avec ANON: NE FONCTIONNENT PAS !`);
    }

    console.log('\n🎯 CONCLUSION:');
    if (testTransaction.balance_before !== null && testTransaction.balance_after !== null && 
        updatedPublisher.balance === publisher.balance + testAmount) {
      console.log('   ✅ LES TRIGGERS FONCTIONNENT AVEC LA CLÉ ANON !');
      console.log('   Le problème doit être ailleurs dans le frontend');
    } else {
      console.log('   ❌ LES TRIGGERS NE FONCTIONNENT PAS AVEC LA CLÉ ANON !');
      console.log('   C\'est ça le problème ! RLS bloque les triggers pour anon');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testWithAnonKey();