import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Problème spécifique de l\'éditeur\n');

async function debugPublisherProblem() {
  try {
    // Récupérer les utilisateurs
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

    console.log(`📊 SOLDES ACTUELS:`);
    console.log(`   Annonceur: ${advertiser?.balance} MAD (${new Date(advertiser?.updated_at).toLocaleString()})`);
    console.log(`   Éditeur: ${publisher?.balance} MAD (${new Date(publisher?.updated_at).toLocaleString()})`);

    // Vérifier les transactions récentes de crédit
    console.log('\n📋 TRANSACTIONS DE CRÉDIT RÉCENTES:');
    
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .or(`user_id.eq.${advertiser?.id},user_id.eq.${publisher?.id}`)
      .order('created_at', { ascending: false })
      .limit(6);

    console.log(`   ${recentTransactions?.length || 0} transactions trouvées:`);
    recentTransactions?.forEach((trans, index) => {
      const userType = trans.user_id === advertiser?.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
      console.log(`      Balance before: ${trans.balance_before} MAD`);
      console.log(`      Balance after: ${trans.balance_after} MAD`);
      console.log(`      Created: ${new Date(trans.created_at).toLocaleString()}`);
      console.log(`      Description: ${trans.description}`);
    });

    // Analyser la dernière transaction de l'éditeur
    const publisherTransactions = recentTransactions?.filter(t => t.user_id === publisher?.id);
    
    if (publisherTransactions && publisherTransactions.length > 0) {
      const lastPublisherTransaction = publisherTransactions[0];
      
      console.log(`\n🔍 ANALYSE DE LA DERNIÈRE TRANSACTION ÉDITEUR:`);
      console.log(`   Transaction ID: ${lastPublisherTransaction.id}`);
      console.log(`   Type: ${lastPublisherTransaction.type}`);
      console.log(`   Montant: ${lastPublisherTransaction.amount} MAD`);
      console.log(`   Balance before: ${lastPublisherTransaction.balance_before} MAD`);
      console.log(`   Balance after: ${lastPublisherTransaction.balance_after} MAD`);
      console.log(`   Balance actuelle dans users: ${publisher?.balance} MAD`);
      
      if (publisher?.balance === lastPublisherTransaction.balance_after) {
        console.log(`   ✅ COHÉRENT: Balance users = Balance_after transaction`);
      } else {
        console.log(`   ❌ INCOHÉRENT: Balance users ≠ Balance_after transaction`);
        console.log(`   Différence: ${Math.abs((publisher?.balance || 0) - lastPublisherTransaction.balance_after)} MAD`);
      }
    }

    // Vérifier s'il y a une transaction de 20 MAD récente
    console.log(`\n🔍 RECHERCHE DE LA TRANSACTION DE 20 MAD:`);
    
    const { data: recentPurchases } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('proposed_price', 20)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(3);

    console.log(`   ${recentPurchases?.length || 0} demandes de 20 MAD confirmées:`);
    recentPurchases?.forEach((req, index) => {
      console.log(`   ${index + 1}. Demande ID: ${req.id.slice(0, 8)}...`);
      console.log(`      Prix: ${req.proposed_price} MAD`);
      console.log(`      Confirmée: ${new Date(req.confirmed_at).toLocaleString()}`);
      console.log(`      Annonceur: ${req.user_id === advertiser?.id ? 'OUI' : 'NON'}`);
      console.log(`      Éditeur: ${req.publisher_id === publisher?.id ? 'OUI' : 'NON'}`);
    });

    // Vérifier les transactions de crédit liées à cette demande
    if (recentPurchases && recentPurchases.length > 0) {
      const lastPurchase = recentPurchases[0];
      
      console.log(`\n🔍 TRANSACTIONS DE CRÉDIT LIÉES À LA DEMANDE ${lastPurchase.id.slice(0, 8)}...:`);
      
      const { data: relatedTransactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('related_purchase_request_id', lastPurchase.id)
        .order('created_at', { ascending: false });

      console.log(`   ${relatedTransactions?.length || 0} transactions liées:`);
      relatedTransactions?.forEach((trans, index) => {
        const userType = trans.user_id === advertiser?.id ? 'Annonceur' : 'Éditeur';
        console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
        console.log(`      Balance before: ${trans.balance_before} MAD`);
        console.log(`      Balance after: ${trans.balance_after} MAD`);
        console.log(`      Created: ${new Date(trans.created_at).toLocaleString()}`);
      });

      // Vérifier si la transaction de l'éditeur existe
      const publisherCreditTransaction = relatedTransactions?.find(t => 
        t.user_id === publisher?.id && t.type === 'deposit'
      );

      if (publisherCreditTransaction) {
        console.log(`\n✅ TRANSACTION ÉDITEUR TROUVÉE:`);
        console.log(`   Montant: ${publisherCreditTransaction.amount} MAD`);
        console.log(`   Balance after: ${publisherCreditTransaction.balance_after} MAD`);
        console.log(`   Balance actuelle: ${publisher?.balance} MAD`);
        
        if (publisher?.balance !== publisherCreditTransaction.balance_after) {
          console.log(`   ❌ PROBLÈME: Le trigger n'a pas mis à jour la table users !`);
        } else {
          console.log(`   ✅ OK: Le trigger a fonctionné`);
        }
      } else {
        console.log(`\n❌ TRANSACTION ÉDITEUR NON TROUVÉE !`);
        console.log(`   La transaction de crédit pour l'éditeur n'existe pas !`);
      }
    }

    console.log(`\n🎯 DIAGNOSTIC:`);
    console.log(`   Si l'annonceur est débité mais l'éditeur pas crédité:`);
    console.log(`   1. La transaction de crédit de l'éditeur n'est pas créée`);
    console.log(`   2. La transaction est créée mais le trigger ne fonctionne pas`);
    console.log(`   3. Il y a une erreur dans la logique de confirmation`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugPublisherProblem();
