import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Problème de concurrence et double débit\n');

async function debugConcurrentUpdates() {
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

    // Test 1: Vérifier les triggers sur la table users
    console.log('\n📋 TEST 1: Vérification des triggers...');
    console.log('⚠️  Vérification des triggers non disponible via RPC');

    // Test 2: Vérifier les politiques RLS
    console.log('\n📋 TEST 2: Vérification des politiques RLS...');
    
    // Test de mise à jour avec service role
    const testAmount = 1;
    const newAdvertiserBalance = advertiser.balance - testAmount;
    const newPublisherBalance = publisher.balance + testAmount;
    
    console.log(`   Test débit annonceur: ${advertiser.balance} MAD → ${newAdvertiserBalance} MAD`);
    console.log(`   Test crédit éditeur: ${publisher.balance} MAD → ${newPublisherBalance} MAD`);

    // Test débit annonceur
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
    } else {
      console.log('✅ Débit annonceur réussi');
      console.log(`   Nouveau solde: ${debitResult.balance} MAD`);
    }

    // Test crédit éditeur
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
    } else {
      console.log('✅ Crédit éditeur réussi');
      console.log(`   Nouveau solde: ${creditResult.balance} MAD`);
    }

    // Vérification immédiate
    console.log('\n📋 Vérification immédiate...');
    
    const { data: verifyAdvertiser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    const { data: verifyPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`   Annonceur vérifié: ${verifyAdvertiser?.balance} MAD`);
    console.log(`   Éditeur vérifié: ${verifyPublisher?.balance} MAD`);

    // Test 3: Vérifier les transactions récentes
    console.log('\n📋 TEST 3: Vérification des transactions récentes...');
    
    const { data: recentTransactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .or(`user_id.eq.${advertiser.id},user_id.eq.${publisher.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transError) {
      console.log('❌ Erreur récupération transactions:', transError);
    } else {
      console.log(`   ${recentTransactions?.length || 0} transaction(s) récente(s):`);
      recentTransactions?.forEach((trans, index) => {
        const user = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
        console.log(`   ${index + 1}. ${user}: ${trans.type} ${trans.amount} MAD - ${trans.description} (${new Date(trans.created_at).toLocaleString()})`);
      });
    }

    // Test 4: Vérifier les transactions d'achat récentes
    console.log('\n📋 TEST 4: Vérification des transactions d\'achat récentes...');
    
    const { data: purchaseTransactions, error: purchaseError } = await supabase
      .from('link_purchase_transactions')
      .select('*')
      .or(`advertiser_id.eq.${advertiser.id},publisher_id.eq.${publisher.id}`)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (purchaseError) {
      console.log('❌ Erreur récupération transactions achat:', purchaseError);
    } else {
      console.log(`   ${purchaseTransactions?.length || 0} transaction(s) d'achat récente(s):`);
      purchaseTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. Montant: ${trans.amount} MAD | Éditeur: ${trans.publisher_amount} MAD | Statut: ${trans.status} | Date: ${new Date(trans.completed_at).toLocaleString()}`);
      });
    }

    // Test 5: Vérifier les demandes récentes
    console.log('\n📋 TEST 5: Vérification des demandes récentes...');
    
    const { data: recentRequests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .or(`user_id.eq.${advertiser.id},publisher_id.eq.${publisher.id}`)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (requestsError) {
      console.log('❌ Erreur récupération demandes:', requestsError);
    } else {
      console.log(`   ${recentRequests?.length || 0} demande(s) récente(s):`);
      recentRequests?.forEach((req, index) => {
        const user = req.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
        console.log(`   ${index + 1}. ${user}: ${req.status} | Prix: ${req.proposed_price} MAD | Date: ${new Date(req.updated_at).toLocaleString()}`);
      });
    }

    console.log('\n🎯 DIAGNOSTIC:');
    console.log('   Si les mises à jour échouent, le problème vient des politiques RLS');
    console.log('   Si les mises à jour réussissent mais ne sont pas persistantes, il y a un trigger qui annule');
    console.log('   Si tout fonctionne, le problème vient de la logique de confirmation ou de la concurrence');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugConcurrentUpdates();
