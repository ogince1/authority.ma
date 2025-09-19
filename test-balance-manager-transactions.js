import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 TEST: Vérification de l\'historique des transactions dans "Mon Solde"\n');

async function testBalanceManagerTransactions() {
  try {
    console.log('📋 ÉTAPE 1: Vérification des transactions pour l\'annonceur...');
    
    // Récupérer l'annonceur
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    if (!advertiser) {
      console.log('❌ Annonceur non trouvé');
      return;
    }

    console.log(`🎯 Annonceur: ${advertiser.email} (Solde: ${advertiser.balance} MAD)`);

    // Récupérer les transactions de l'annonceur (comme le fait BalanceManager)
    const { data: advertiserTransactions, error: advertiserError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', advertiser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (advertiserError) {
      console.log('❌ Erreur récupération transactions annonceur:', advertiserError);
    } else {
      console.log(`📊 Transactions de l'annonceur (${advertiserTransactions?.length || 0}):`)
      advertiserTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.type} ${trans.amount} MAD - ${trans.description}`);
        console.log(`      Balance: ${trans.balance_before} → ${trans.balance_after} MAD`);
        console.log(`      Date: ${new Date(trans.created_at).toLocaleString()}`);
        console.log(`      Status: ${trans.status}`);
      });
    }

    console.log('\n📋 ÉTAPE 2: Vérification des transactions pour l\'éditeur...');
    
    // Récupérer l'éditeur
    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log(`🎯 Éditeur: ${publisher.email} (Solde: ${publisher.balance} MAD)`);

    // Récupérer les transactions de l'éditeur (comme le fait BalanceManager)
    const { data: publisherTransactions, error: publisherError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (publisherError) {
      console.log('❌ Erreur récupération transactions éditeur:', publisherError);
    } else {
      console.log(`📊 Transactions de l'éditeur (${publisherTransactions?.length || 0}):`);
      publisherTransactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.type} ${trans.amount} MAD - ${trans.description}`);
        console.log(`      Balance: ${trans.balance_before} → ${trans.balance_after} MAD`);
        console.log(`      Date: ${new Date(trans.created_at).toLocaleString()}`);
        console.log(`      Status: ${trans.status}`);
      });
    }

    console.log('\n📋 ÉTAPE 3: Vérification des transactions liées aux confirmations de liens...');
    
    // Récupérer les transactions liées aux confirmations de liens récentes
    const { data: linkTransactions, error: linkError } = await supabase
      .from('credit_transactions')
      .select(`
        *,
        link_purchase_requests!related_purchase_request_id(
          id,
          proposed_price,
          status,
          confirmed_at
        )
      `)
      .or(`user_id.eq.${advertiser.id},user_id.eq.${publisher.id}`)
      .not('related_purchase_request_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (linkError) {
      console.log('❌ Erreur récupération transactions de liens:', linkError);
    } else {
      console.log(`📊 Transactions liées aux confirmations de liens (${linkTransactions?.length || 0}):`);
      linkTransactions?.forEach((trans, index) => {
        const userType = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
        const request = trans.link_purchase_requests;
        console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
        console.log(`      Demande: ${request?.id?.slice(0, 8)}... (${request?.proposed_price} MAD)`);
        console.log(`      Confirmée: ${request?.confirmed_at ? new Date(request.confirmed_at).toLocaleString() : 'Non confirmée'}`);
        console.log(`      Balance: ${trans.balance_before} → ${trans.balance_after} MAD`);
        console.log(`      Date: ${new Date(trans.created_at).toLocaleString()}`);
      });
    }

    console.log('\n📋 ÉTAPE 4: Vérification de la cohérence des données...');
    
    // Vérifier que toutes les transactions de confirmation apparaissent bien
    const { data: recentConfirmations, error: confirmError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('status', 'confirmed')
      .or(`user_id.eq.${advertiser.id},publisher_id.eq.${publisher.id}`)
      .order('confirmed_at', { ascending: false })
      .limit(5);

    if (confirmError) {
      console.log('❌ Erreur récupération confirmations:', confirmError);
    } else {
      console.log(`📊 Confirmations récentes (${recentConfirmations?.length || 0}):`);
      recentConfirmations?.forEach((conf, index) => {
        console.log(`   ${index + 1}. Demande ${conf.id.slice(0, 8)}... (${conf.proposed_price} MAD)`);
        console.log(`      Confirmée: ${new Date(conf.confirmed_at).toLocaleString()}`);
        console.log(`      Annonceur: ${conf.user_id === advertiser.id ? 'OUI' : 'NON'}`);
        console.log(`      Éditeur: ${conf.publisher_id === publisher.id ? 'OUI' : 'NON'}`);
        
        // Vérifier si cette confirmation a des transactions de crédit associées
        const relatedTransactions = [
          ...advertiserTransactions?.filter(t => t.related_purchase_request_id === conf.id) || [],
          ...publisherTransactions?.filter(t => t.related_purchase_request_id === conf.id) || []
        ];
        
        console.log(`      Transactions associées: ${relatedTransactions.length}`);
        relatedTransactions.forEach((trans, tIndex) => {
          const userType = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
          console.log(`         ${tIndex + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
        });
      });
    }

    console.log('\n🎯 RÉSUMÉ POUR L\'ONGLET "MON SOLDE":');
    console.log(`   Annonceur - Transactions visibles: ${advertiserTransactions?.length || 0}`);
    console.log(`   Éditeur - Transactions visibles: ${publisherTransactions?.length || 0}`);
    console.log(`   Confirmations avec transactions: ${linkTransactions?.length || 0}`);
    
    if ((advertiserTransactions?.length || 0) > 0 && (publisherTransactions?.length || 0) > 0) {
      console.log('   ✅ L\'historique des transactions est complet dans "Mon Solde"');
    } else {
      console.log('   ❌ L\'historique des transactions est incomplet');
    }

    console.log('\n📋 RECOMMANDATIONS:');
    console.log('   1. L\'onglet "Mon Solde" devrait afficher toutes ces transactions');
    console.log('   2. Les confirmations de liens devraient apparaître comme "Achat de lien" et "Vente de lien"');
    console.log('   3. Les soldes avant/après devraient être cohérents');
    console.log('   4. Les dates devraient correspondre aux confirmations');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testBalanceManagerTransactions();
