import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Problème spécifique à l\'éditeur\n');

async function debugPublisherBalance() {
  try {
    // Récupérer l'annonceur et l'éditeur
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!advertiser || !publisher) {
      console.log('❌ Impossible de trouver les utilisateurs');
      return;
    }

    console.log(`🎯 Annonceur: ${advertiser.email} (ID: ${advertiser.id.slice(0, 8)}...)`);
    console.log(`   Solde actuel: ${advertiser.balance} MAD`);

    console.log(`🎯 Éditeur: ${publisher.email} (ID: ${publisher.id.slice(0, 8)}...)`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);

    // TEST 1: Transaction de débit pour l'annonceur (qui fonctionne)
    console.log('\n📋 TEST 1: Transaction de débit pour l\'annonceur...');
    
    const debitAmount = 10;
    const { data: advertiserTransaction, error: advertiserError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: advertiser.id,
        type: 'purchase',
        amount: debitAmount,
        description: 'Test débit annonceur',
        currency: 'MAD',
        status: 'completed',
        balance_before: advertiser.balance,
        balance_after: advertiser.balance - debitAmount,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (advertiserError) {
      console.log('❌ Erreur transaction annonceur:', advertiserError);
    } else {
      console.log(`✅ Transaction annonceur créée: ${advertiserTransaction.id.slice(0, 8)}...`);
      console.log(`   Balance before: ${advertiserTransaction.balance_before} MAD`);
      console.log(`   Balance after: ${advertiserTransaction.balance_after} MAD`);
    }

    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: updatedAdvertiser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    console.log(`   Solde annonceur après: ${updatedAdvertiser?.balance} MAD`);
    console.log(`   Attendu: ${advertiser.balance - debitAmount} MAD`);
    
    if (updatedAdvertiser?.balance === advertiser.balance - debitAmount) {
      console.log(`   ✅ TRIGGER ANNONCEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER ANNONCEUR: NE FONCTIONNE PAS !`);
    }

    // TEST 2: Transaction de crédit pour l'éditeur (qui ne fonctionne pas)
    console.log('\n📋 TEST 2: Transaction de crédit pour l\'éditeur...');
    
    const creditAmount = 15;
    const { data: publisherTransaction, error: publisherError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: creditAmount,
        description: 'Test crédit éditeur',
        currency: 'MAD',
        status: 'completed',
        balance_before: publisher.balance,
        balance_after: publisher.balance + creditAmount,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (publisherError) {
      console.log('❌ Erreur transaction éditeur:', publisherError);
      console.log('   Code:', publisherError.code);
      console.log('   Message:', publisherError.message);
      console.log('   Détails:', publisherError.details);
    } else {
      console.log(`✅ Transaction éditeur créée: ${publisherTransaction.id.slice(0, 8)}...`);
      console.log(`   Balance before: ${publisherTransaction.balance_before} MAD`);
      console.log(`   Balance after: ${publisherTransaction.balance_after} MAD`);
    }

    // Attendre et vérifier
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`   Solde éditeur après: ${updatedPublisher?.balance} MAD`);
    console.log(`   Attendu: ${publisher.balance + creditAmount} MAD`);
    
    if (updatedPublisher?.balance === publisher.balance + creditAmount) {
      console.log(`   ✅ TRIGGER ÉDITEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ TRIGGER ÉDITEUR: NE FONCTIONNE PAS !`);
      console.log(`   Différence: ${Math.abs((updatedPublisher?.balance || 0) - (publisher.balance + creditAmount))} MAD`);
    }

    // TEST 3: Vérifier les transactions créées
    console.log('\n📋 TEST 3: Vérification des transactions créées...');
    
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .or(`user_id.eq.${advertiser.id},user_id.eq.${publisher.id}`)
      .order('created_at', { ascending: false })
      .limit(4);

    console.log(`   Transactions récentes:`);
    recentTransactions?.forEach((trans, index) => {
      const userType = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
      console.log(`      Balance before: ${trans.balance_before} MAD`);
      console.log(`      Balance after: ${trans.balance_after} MAD`);
      console.log(`      Created: ${new Date(trans.created_at).toLocaleString()}`);
    });

    // TEST 4: Vérifier les triggers spécifiquement pour les deux types
    console.log('\n📋 TEST 4: Analyse des différences entre purchase et deposit...');
    
    // Vérifier si le trigger traite différemment les types 'purchase' et 'deposit'
    const { data: purchaseTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(2);

    const { data: depositTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(2);

    console.log(`   Transactions 'purchase' récentes: ${purchaseTransactions?.length || 0}`);
    console.log(`   Transactions 'deposit' récentes: ${depositTransactions?.length || 0}`);

    // TEST 5: Vérifier si c'est un problème d'ID utilisateur
    console.log('\n📋 TEST 5: Vérification des IDs utilisateur...');
    
    console.log(`   ID Annonceur: ${advertiser.id}`);
    console.log(`   ID Éditeur: ${publisher.id}`);
    
    // Vérifier si l'ID de l'éditeur existe bien dans la table users
    const { data: publisherCheck, error: publisherCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', publisher.id)
      .single();

    if (publisherCheckError) {
      console.log(`   ❌ Problème avec l'ID éditeur: ${publisherCheckError.message}`);
    } else {
      console.log(`   ✅ ID éditeur valide: ${publisherCheck.email}`);
    }

    console.log('\n🎯 DIAGNOSTIC:');
    console.log('   Si l\'annonceur fonctionne mais pas l\'éditeur:');
    console.log('   1. Problème avec les transactions de type "deposit"');
    console.log('   2. Problème avec l\'ID de l\'éditeur');
    console.log('   3. Trigger qui traite différemment purchase vs deposit');
    console.log('   4. Politique RLS différente pour l\'éditeur');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugPublisherBalance();
