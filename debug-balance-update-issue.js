import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Problème de mise à jour des soldes\n');

async function debugBalanceUpdateIssue() {
  try {
    // Récupérer l'éditeur ogincema@gmail.com
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (publisherError || !publisher) {
      console.log('❌ Impossible de trouver l\'éditeur');
      return;
    }

    console.log(`🎯 Éditeur: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);
    console.log(`   Dernière mise à jour: ${new Date(publisher.updated_at).toLocaleString()}`);

    // Test 1: Vérifier les permissions RLS
    console.log('\n📋 TEST 1: Vérification des permissions RLS...');
    
    const testAmount = 5;
    const newBalance = publisher.balance + testAmount;
    
    console.log(`   Tentative de mise à jour: ${publisher.balance} MAD → ${newBalance} MAD`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', publisher.id)
      .select('balance, updated_at')
      .single();

    if (updateError) {
      console.log('❌ Erreur mise à jour:', updateError);
      console.log('   Code:', updateError.code);
      console.log('   Message:', updateError.message);
      console.log('   Détails:', updateError.details);
    } else {
      console.log('✅ Mise à jour réussie');
      console.log(`   Nouveau solde: ${updateResult.balance} MAD`);
      console.log(`   Timestamp: ${new Date(updateResult.updated_at).toLocaleString()}`);
      
      // Vérifier immédiatement après
      console.log('\n   Vérification immédiate...');
      const { data: verifyResult, error: verifyError } = await supabase
        .from('users')
        .select('balance, updated_at')
        .eq('id', publisher.id)
        .single();

      if (verifyError) {
        console.log('❌ Erreur vérification:', verifyError);
      } else {
        console.log(`   Solde vérifié: ${verifyResult.balance} MAD`);
        console.log(`   Timestamp: ${new Date(verifyResult.updated_at).toLocaleString()}`);
        
        if (verifyResult.balance === newBalance) {
          console.log('✅ Le crédit est persistant');
        } else {
          console.log('❌ Le crédit n\'est pas persistant !');
          console.log(`   Attendu: ${newBalance} MAD, Reçu: ${verifyResult.balance} MAD`);
        }
      }
    }

    // Test 2: Vérifier les triggers
    console.log('\n📋 TEST 2: Vérification des triggers...');
    
    // Attendre 1 seconde et vérifier à nouveau
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: delayedVerify, error: delayedError } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    if (delayedError) {
      console.log('❌ Erreur vérification différée:', delayedError);
    } else {
      console.log(`   Solde après 1 seconde: ${delayedVerify.balance} MAD`);
      console.log(`   Timestamp: ${new Date(delayedVerify.updated_at).toLocaleString()}`);
    }

    // Test 3: Vérifier les transactions récentes
    console.log('\n📋 TEST 3: Vérification des transactions récentes...');
    
    const { data: recentTransactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (transError) {
      console.log('❌ Erreur récupération transactions:', transError);
    } else {
      console.log(`   ${recentTransactions?.length || 0} transaction(s) récente(s):`);
      recentTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. Type: ${trans.type} | Montant: ${trans.amount} MAD | Statut: ${trans.status} | Date: ${new Date(trans.created_at).toLocaleString()}`);
      });
    }

    // Test 4: Vérifier les politiques RLS
    console.log('\n📋 TEST 4: Vérification des politiques RLS...');
    
    // Test de lecture
    const { data: readTest, error: readError } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('id', publisher.id)
      .single();

    if (readError) {
      console.log('❌ Erreur lecture:', readError);
    } else {
      console.log('✅ Lecture OK');
    }

    // Test d'écriture avec service role
    console.log('\n📋 TEST 5: Test d\'écriture avec service role...');
    
    const { data: writeTest, error: writeError } = await supabase
      .from('users')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', publisher.id)
      .select('id, updated_at')
      .single();

    if (writeError) {
      console.log('❌ Erreur écriture:', writeError);
      console.log('   Code:', writeError.code);
      console.log('   Message:', writeError.message);
    } else {
      console.log('✅ Écriture OK');
      console.log(`   Timestamp mis à jour: ${new Date(writeTest.updated_at).toLocaleString()}`);
    }

    console.log('\n🎯 DIAGNOSTIC:');
    console.log('   Si la mise à jour échoue, le problème vient des politiques RLS');
    console.log('   Si la mise à jour réussit mais n\'est pas persistante, il y a un trigger qui annule');
    console.log('   Si tout fonctionne, le problème vient de la logique de confirmation');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugBalanceUpdateIssue();
