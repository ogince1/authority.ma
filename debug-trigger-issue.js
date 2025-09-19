import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Vérification du trigger de mise à jour des soldes\n');

async function debugTriggerIssue() {
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

    console.log(`🎯 Annonceur: ${advertiser.email}`);
    console.log(`   Solde actuel: ${advertiser.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(advertiser.updated_at).toLocaleString()}`);

    console.log(`🎯 Éditeur: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(publisher.updated_at).toLocaleString()}`);

    // TEST 1: Créer une transaction de crédit et voir si le trigger fonctionne
    console.log('\n📋 TEST 1: Création d\'une transaction de crédit...');
    
    const testAmount = 10;
    const { data: creditTransaction, error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test trigger debug',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (creditError) {
      console.log('❌ Erreur création transaction de crédit:', creditError);
      console.log('   Code:', creditError.code);
      console.log('   Message:', creditError.message);
      console.log('   Détails:', creditError.details);
      return;
    }

    console.log(`✅ Transaction de crédit créée: ${creditTransaction.id.slice(0, 8)}...`);
    console.log(`   Type: ${creditTransaction.type}`);
    console.log(`   Montant: ${creditTransaction.amount} MAD`);
    console.log(`   Solde avant: ${creditTransaction.balance_before} MAD`);
    console.log(`   Solde après: ${creditTransaction.balance_after} MAD`);

    // Attendre un peu pour que le trigger se déclenche
    console.log('\n⏳ Attente de 3 secondes pour que le trigger se déclenche...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier si le solde a été mis à jour
    console.log('\n📋 VÉRIFICATION DU SOLDE APRÈS LE TRIGGER:');
    
    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`   Solde éditeur avant: ${publisher.balance} MAD`);
    console.log(`   Solde éditeur après: ${updatedPublisher?.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(updatedPublisher?.updated_at).toLocaleString()}`);

    // Vérifier si le trigger a fonctionné
    const expectedBalance = publisher.balance + testAmount;
    if (updatedPublisher?.balance === expectedBalance) {
      console.log(`   ✅ TRIGGER FONCTIONNE ! Solde mis à jour correctement`);
    } else {
      console.log(`   ❌ TRIGGER NE FONCTIONNE PAS !`);
      console.log(`   Solde attendu: ${expectedBalance} MAD`);
      console.log(`   Solde réel: ${updatedPublisher?.balance} MAD`);
      console.log(`   Différence: ${Math.abs((updatedPublisher?.balance || 0) - expectedBalance)} MAD`);
    }

    // TEST 2: Vérifier les triggers existants
    console.log('\n📋 TEST 2: Vérification des triggers existants...');
    
    // Essayer de voir les triggers via une requête SQL directe
    const { data: triggerInfo, error: triggerError } = await supabase
      .rpc('get_trigger_info', { table_name: 'credit_transactions' });

    if (triggerError) {
      console.log('❌ Erreur récupération info triggers:', triggerError);
      console.log('   La fonction get_trigger_info n\'existe peut-être pas');
    } else {
      console.log('✅ Info triggers récupérée:', triggerInfo);
    }

    // TEST 3: Vérifier la structure de la table credit_transactions
    console.log('\n📋 TEST 3: Vérification de la structure de la table credit_transactions...');
    
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('id', creditTransaction.id)
      .single();

    if (transError) {
      console.log('❌ Erreur récupération transaction:', transError);
    } else {
      console.log('✅ Transaction récupérée:');
      console.log(`   ID: ${transactions.id}`);
      console.log(`   User ID: ${transactions.user_id}`);
      console.log(`   Type: ${transactions.type}`);
      console.log(`   Amount: ${transactions.amount}`);
      console.log(`   Balance Before: ${transactions.balance_before}`);
      console.log(`   Balance After: ${transactions.balance_after}`);
      console.log(`   Status: ${transactions.status}`);
      console.log(`   Created At: ${new Date(transactions.created_at).toLocaleString()}`);
    }

    // TEST 4: Vérifier si les fonctions de trigger existent
    console.log('\n📋 TEST 4: Vérification des fonctions de trigger...');
    
    // Essayer d'appeler directement la fonction de trigger
    const { data: triggerTest, error: triggerTestError } = await supabase
      .rpc('update_user_balance_after_transaction');

    if (triggerTestError) {
      console.log('❌ Erreur test fonction trigger:', triggerTestError);
      console.log('   La fonction update_user_balance_after_transaction n\'existe peut-être pas');
    } else {
      console.log('✅ Fonction trigger testée:', triggerTest);
    }

    console.log('\n🎯 DIAGNOSTIC FINAL:');
    console.log('   Si le trigger ne fonctionne pas, il faut:');
    console.log('   1. Vérifier que la fonction update_user_balance_after_transaction existe');
    console.log('   2. Vérifier que le trigger trigger_update_user_balance_after_transaction existe');
    console.log('   3. Vérifier que le trigger est actif');
    console.log('   4. Recréer le trigger si nécessaire');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugTriggerIssue();
