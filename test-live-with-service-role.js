import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec service_role pour contourner RLS
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 TEST LIVE: Reproduction EXACTE de votre commande frontend/backend\n');

async function testLiveWithServiceRole() {
  try {
    console.log('📋 ÉTAPE 1: État actuel des soldes...');
    
    const { data: currentUsers, error: currentError } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (currentError) {
      console.log('❌ Erreur récupération users:', currentError);
      return;
    }

    console.log('📊 SOLDES ACTUELS:');
    currentUsers?.forEach((user) => {
      console.log(`   ${user.email}: ${user.balance} MAD (${new Date(user.updated_at).toLocaleString()})`);
    });

    const advertiser = currentUsers?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisher = currentUsers?.find(u => u.email === 'ogincema@gmail.com');

    console.log('\n📋 ÉTAPE 2: Recherche des demandes récentes confirmées...');
    
    // Regarder les demandes récemment confirmées pour comprendre le problème
    const { data: recentConfirmed, error: recentError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(3);

    if (recentError) {
      console.log('❌ Erreur recherche demandes confirmées:', recentError);
    } else {
      console.log(`📊 ${recentConfirmed?.length || 0} demandes récemment confirmées:`);
      recentConfirmed?.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id.slice(0, 8)}... Prix: ${req.proposed_price} MAD`);
        console.log(`      Confirmée: ${new Date(req.confirmed_at).toLocaleString()}`);
        console.log(`      Annonceur: ${req.user_id === advertiser?.id ? 'OUI' : 'NON'}`);
        console.log(`      Éditeur: ${req.publisher_id === publisher?.id ? 'OUI' : 'NON'}`);
      });
    }

    // Vérifier les transactions de crédit les plus récentes
    console.log('\n📋 ÉTAPE 3: Transactions de crédit récentes...');
    
    const { data: recentTransactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .or(`user_id.eq.${advertiser?.id},user_id.eq.${publisher?.id}`)
      .order('created_at', { ascending: false })
      .limit(6);

    if (transError) {
      console.log('❌ Erreur récupération transactions:', transError);
    } else {
      console.log(`📊 ${recentTransactions?.length || 0} transactions récentes:`);
      recentTransactions?.forEach((trans, index) => {
        const userType = trans.user_id === advertiser?.id ? 'Annonceur' : 'Éditeur';
        console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
        console.log(`      Balance before: ${trans.balance_before} MAD`);
        console.log(`      Balance after: ${trans.balance_after} MAD`);
        console.log(`      Created: ${new Date(trans.created_at).toLocaleString()}`);
        console.log(`      Description: ${trans.description}`);
      });
    }

    // Créer une demande de test et la confirmer IMMÉDIATEMENT
    console.log('\n📋 ÉTAPE 4: Création et confirmation d\'une demande de test...');
    
    const { data: existingLink } = await supabase
      .from('link_listings')
      .select('id, title')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!existingLink) {
      console.log('❌ Aucun lien existant trouvé');
      return;
    }

    // Créer une demande
    const testPrice = 15;
    const { data: testRequest, error: testRequestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: existingLink.id,
        user_id: advertiser?.id,
        publisher_id: publisher?.id,
        target_url: 'https://test-live-debug.com',
        anchor_text: 'Test live debug',
        proposed_price: testPrice,
        proposed_duration: 1,
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-live-debug.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test live debug',
        message: 'Test live debug du système'
      })
      .select()
      .single();

    if (testRequestError) {
      console.log('❌ Erreur création demande test:', testRequestError);
      return;
    }

    console.log(`✅ Demande de test créée: ${testRequest.id.slice(0, 8)}... (Prix: ${testPrice} MAD)`);

    // MAINTENANT CONFIRMER EXACTEMENT COMME LE FRONTEND
    console.log('\n📋 ÉTAPE 5: CONFIRMATION EXACTE COMME LE FRONTEND...');
    
    const platformFee = testPrice * 0.10;
    const publisherAmount = testPrice - platformFee;

    console.log(`💰 Calculs:`);
    console.log(`   Prix total: ${testPrice} MAD`);
    console.log(`   Commission: ${platformFee} MAD`);
    console.log(`   Montant éditeur: ${publisherAmount} MAD`);

    // Créer la transaction d'achat
    const { data: purchaseTransaction, error: purchaseError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: testRequest.id,
        advertiser_id: advertiser?.id,
        publisher_id: publisher?.id,
        link_listing_id: testRequest.link_listing_id,
        amount: testPrice,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        payment_method: 'balance'
      })
      .select()
      .single();

    if (purchaseError) {
      console.log('❌ Erreur création transaction d\'achat:', purchaseError);
      return;
    }

    console.log(`✅ Transaction d'achat créée: ${purchaseTransaction.id.slice(0, 8)}...`);

    // Créer les transactions de crédit SANS balance_before/balance_after
    console.log(`💳 Création des transactions de crédit (triggers automatiques)...`);
    
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiser?.id,
          type: 'purchase',
          amount: testPrice,
          description: 'Achat de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: testRequest.link_listing_id,
          related_purchase_request_id: testRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: publisher?.id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: testRequest.link_listing_id,
          related_purchase_request_id: testRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ])
      .select();

    if (creditError) {
      console.log('❌ Erreur création transactions de crédit:', creditError);
      console.log('   Code:', creditError.code);
      console.log('   Message:', creditError.message);
      console.log('   Détails:', creditError.details);
      return;
    }

    console.log(`✅ Transactions de crédit créées: ${creditTransactions?.length || 0}`);
    creditTransactions?.forEach((trans, index) => {
      const userType = trans.user_id === advertiser?.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. ${userType}: ${trans.type} ${trans.amount} MAD`);
      console.log(`      Balance before: ${trans.balance_before} MAD`);
      console.log(`      Balance after: ${trans.balance_after} MAD`);
    });

    // Mettre à jour le statut
    const { error: statusError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', testRequest.id);

    if (statusError) {
      console.log('❌ Erreur mise à jour statut:', statusError);
      return;
    }

    console.log(`✅ Statut mis à jour: confirmed`);

    // Vérifier IMMÉDIATEMENT les soldes
    console.log('\n📋 ÉTAPE 6: Vérification IMMÉDIATE des soldes...');
    
    const { data: immediateUsers } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    console.log('📊 SOLDES IMMÉDIATS:');
    immediateUsers?.forEach((user) => {
      const userBefore = currentUsers?.find(u => u.id === user.id);
      console.log(`   ${user.email}: ${userBefore?.balance} → ${user.balance} MAD`);
      console.log(`      Timestamp: ${new Date(user.updated_at).toLocaleString()}`);
    });

    // Attendre 3 secondes et vérifier à nouveau
    console.log('\n📋 ÉTAPE 7: Vérification après 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: delayedUsers } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    console.log('📊 SOLDES APRÈS 3 SECONDES:');
    delayedUsers?.forEach((user) => {
      const userBefore = currentUsers?.find(u => u.id === user.id);
      console.log(`   ${user.email}: ${userBefore?.balance} → ${user.balance} MAD`);
      console.log(`      Timestamp: ${new Date(user.updated_at).toLocaleString()}`);
    });

    // Diagnostic final
    console.log('\n🎯 DIAGNOSTIC FINAL:');
    
    const finalAdvertiser = delayedUsers?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const finalPublisher = delayedUsers?.find(u => u.email === 'ogincema@gmail.com');
    
    const expectedAdvertiserBalance = (advertiser?.balance || 0) - testPrice;
    const expectedPublisherBalance = (publisher?.balance || 0) + publisherAmount;

    console.log(`   Annonceur: ${advertiser?.balance} → ${finalAdvertiser?.balance} MAD (attendu: ${expectedAdvertiserBalance})`);
    console.log(`   Éditeur: ${publisher?.balance} → ${finalPublisher?.balance} MAD (attendu: ${expectedPublisherBalance})`);

    if (finalAdvertiser?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ ANNONCEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ ANNONCEUR: NE FONCTIONNE PAS !`);
    }

    if (finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ ÉDITEUR: FONCTIONNE !`);
    } else {
      console.log(`   ❌ ÉDITEUR: NE FONCTIONNE PAS !`);
    }

    if (finalAdvertiser?.balance === expectedAdvertiserBalance && finalPublisher?.balance === expectedPublisherBalance) {
      console.log(`\n🎉 LE SYSTÈME FONCTIONNE PARFAITEMENT EN LIVE !`);
    } else {
      console.log(`\n❌ IL Y A UN PROBLÈME AVEC LE SYSTÈME EN LIVE !`);
      console.log(`\nPossibles causes:`);
      console.log(`1. Les triggers ne se déclenchent pas`);
      console.log(`2. Il y a une erreur dans les triggers`);
      console.log(`3. Les politiques RLS bloquent les mises à jour`);
      console.log(`4. Il y a un conflit dans la logique`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test live
testLiveWithServiceRole();
