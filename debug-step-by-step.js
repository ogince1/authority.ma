import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Analyse étape par étape du problème\n');

async function debugStepByStep() {
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

    // ÉTAPE 1: Test de débit de l'annonceur
    console.log('\n📋 ÉTAPE 1: Test de débit de l\'annonceur...');
    
    const debitAmount = 20;
    const newAdvertiserBalance = advertiser.balance - debitAmount;
    
    console.log(`   Tentative: ${advertiser.balance} MAD → ${newAdvertiserBalance} MAD`);
    
    const { data: debitResult, error: debitError } = await supabase
      .from('users')
      .update({ 
        balance: newAdvertiserBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', advertiser.id)
      .select('balance, updated_at')
      .single();

    if (debitError) {
      console.log('❌ Erreur débit annonceur:', debitError);
      console.log('   Code:', debitError.code);
      console.log('   Message:', debitError.message);
      console.log('   Détails:', debitError.details);
    } else {
      console.log('✅ Débit annonceur réussi');
      console.log(`   Nouveau solde: ${debitResult.balance} MAD`);
      console.log(`   Timestamp: ${new Date(debitResult.updated_at).toLocaleString()}`);
    }

    // Vérification immédiate
    console.log('\n   Vérification immédiate...');
    const { data: verifyAdvertiser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    console.log(`   Solde vérifié: ${verifyAdvertiser?.balance} MAD`);
    console.log(`   Timestamp: ${new Date(verifyAdvertiser?.updated_at).toLocaleString()}`);

    // ÉTAPE 2: Test de crédit de l'éditeur
    console.log('\n📋 ÉTAPE 2: Test de crédit de l\'éditeur...');
    
    const creditAmount = 18;
    const newPublisherBalance = publisher.balance + creditAmount;
    
    console.log(`   Tentative: ${publisher.balance} MAD → ${newPublisherBalance} MAD`);
    
    const { data: creditResult, error: creditError } = await supabase
      .from('users')
      .update({ 
        balance: newPublisherBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', publisher.id)
      .select('balance, updated_at')
      .single();

    if (creditError) {
      console.log('❌ Erreur crédit éditeur:', creditError);
      console.log('   Code:', creditError.code);
      console.log('   Message:', creditError.message);
      console.log('   Détails:', creditError.details);
    } else {
      console.log('✅ Crédit éditeur réussi');
      console.log(`   Nouveau solde: ${creditResult.balance} MAD`);
      console.log(`   Timestamp: ${new Date(creditResult.updated_at).toLocaleString()}`);
    }

    // Vérification immédiate
    console.log('\n   Vérification immédiate...');
    const { data: verifyPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`   Solde vérifié: ${verifyPublisher?.balance} MAD`);
    console.log(`   Timestamp: ${new Date(verifyPublisher?.updated_at).toLocaleString()}`);

    // ÉTAPE 3: Vérifier les triggers
    console.log('\n📋 ÉTAPE 3: Vérification des triggers...');
    
    // Attendre 2 secondes et vérifier à nouveau
    console.log('   Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: delayedAdvertiser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    const { data: delayedPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`   Annonceur après 2s: ${delayedAdvertiser?.balance} MAD`);
    console.log(`   Éditeur après 2s: ${delayedPublisher?.balance} MAD`);

    // ÉTAPE 4: Vérifier les politiques RLS
    console.log('\n📋 ÉTAPE 4: Vérification des politiques RLS...');
    
    // Test avec un utilisateur différent
    const { data: otherUser } = await supabase
      .from('users')
      .select('id, email, balance')
      .neq('id', advertiser.id)
      .neq('id', publisher.id)
      .limit(1)
      .single();

    if (otherUser) {
      console.log(`   Test avec utilisateur: ${otherUser.email}`);
      
      const { data: testUpdate, error: testError } = await supabase
        .from('users')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', otherUser.id)
        .select('updated_at')
        .single();

      if (testError) {
        console.log('❌ Erreur test RLS:', testError);
      } else {
        console.log('✅ Test RLS réussi');
      }
    }

    // ÉTAPE 5: Vérifier les transactions récentes
    console.log('\n📋 ÉTAPE 5: Vérification des transactions récentes...');
    
    const { data: recentTransactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .or(`user_id.eq.${advertiser.id},user_id.eq.${publisher.id}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transError) {
      console.log('❌ Erreur récupération transactions:', transError);
    } else {
      console.log(`   ${recentTransactions?.length || 0} transaction(s) récente(s):`);
      recentTransactions?.forEach((trans, index) => {
        const user = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
        console.log(`   ${index + 1}. ${user}: ${trans.type} ${trans.amount} MAD - ${trans.description} (${new Date(trans.created_at).toLocaleString()})`);
      });
    }

    console.log('\n🎯 DIAGNOSTIC FINAL:');
    console.log('   Si les mises à jour échouent, le problème vient des politiques RLS');
    console.log('   Si les mises à jour réussissent mais ne sont pas persistantes, il y a un trigger qui annule');
    console.log('   Si tout fonctionne, le problème vient de la logique de confirmation');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugStepByStep();
