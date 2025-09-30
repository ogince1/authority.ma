import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Problème de crédit éditeur\n');

async function debugCreditIssue() {
  try {
    // Récupérer un éditeur pour tester
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('role', 'publisher')
      .limit(1)
      .single();

    if (publisherError || !publisher) {
      console.log('❌ Impossible de trouver un éditeur');
      return;
    }

    console.log(`🎯 Test avec l'éditeur: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);

    // Test 1: Vérifier les permissions RLS pour la mise à jour
    console.log('\n📋 TEST 1: Vérification des permissions RLS...');
    
    const testAmount = 50;
    const newBalance = publisher.balance + testAmount;
    
    console.log(`   Tentative de mise à jour: ${publisher.balance} MAD → ${newBalance} MAD`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', publisher.id)
      .select('balance')
      .single();

    if (updateError) {
      console.log('❌ Erreur mise à jour:', updateError);
      console.log('   Code:', updateError.code);
      console.log('   Message:', updateError.message);
      console.log('   Détails:', updateError.details);
    } else {
      console.log('✅ Mise à jour réussie');
      console.log(`   Nouveau solde: ${updateResult.balance} MAD`);
      
      // Vérifier immédiatement après
      const { data: verifyResult, error: verifyError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', publisher.id)
        .single();

      if (verifyError) {
        console.log('❌ Erreur vérification:', verifyError);
      } else {
        console.log(`   Vérification: ${verifyResult.balance} MAD`);
        
        if (verifyResult.balance === newBalance) {
          console.log('✅ Le crédit est persistant');
        } else {
          console.log('❌ Le crédit n\'est pas persistant !');
          console.log(`   Attendu: ${newBalance} MAD, Reçu: ${verifyResult.balance} MAD`);
        }
      }
    }

    // Test 2: Vérifier les triggers ou contraintes
    console.log('\n📋 TEST 2: Vérification des triggers...');
    
    // Récupérer le solde actuel
    const { data: currentBalance, error: currentError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', publisher.id)
      .single();

    if (currentError) {
      console.log('❌ Erreur récupération solde actuel:', currentError);
    } else {
      console.log(`   Solde actuel: ${currentBalance.balance} MAD`);
    }

    // Test 3: Vérifier les transactions de crédit
    console.log('\n📋 TEST 3: Vérification des transactions de crédit...');
    
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (creditError) {
      console.log('❌ Erreur récupération transactions:', creditError);
    } else {
      console.log(`   ${creditTransactions?.length || 0} transaction(s) de crédit trouvée(s):`);
      creditTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. Type: ${trans.type} | Montant: ${trans.amount} MAD | Statut: ${trans.status} | Date: ${new Date(trans.created_at).toLocaleString()}`);
      });
    }

    // Test 4: Vérifier les transactions d'achat
    console.log('\n📋 TEST 4: Vérification des transactions d\'achat...');
    
    const { data: purchaseTransactions, error: purchaseError } = await supabase
      .from('link_purchase_transactions')
      .select('*')
      .eq('publisher_id', publisher.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (purchaseError) {
      console.log('❌ Erreur récupération transactions achat:', purchaseError);
    } else {
      console.log(`   ${purchaseTransactions?.length || 0} transaction(s) d'achat trouvée(s):`);
      purchaseTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. Montant: ${trans.amount} MAD | Éditeur: ${trans.publisher_amount} MAD | Statut: ${trans.status} | Date: ${new Date(trans.completed_at).toLocaleString()}`);
      });
    }

    // Test 5: Vérifier les politiques RLS
    console.log('\n📋 TEST 5: Vérification des politiques RLS...');
    
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

    // Test d'écriture
    const { data: writeTest, error: writeError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', publisher.id)
      .select('id')
      .single();

    if (writeError) {
      console.log('❌ Erreur écriture:', writeError);
    } else {
      console.log('✅ Écriture OK');
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
debugCreditIssue();
