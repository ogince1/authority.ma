// Script pour tester la correction des politiques RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Test de la correction des politiques RLS...\n');

async function testRLSFix() {
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';
    const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';
    
    // 1. Tester l'insertion d'une transaction de crédit
    console.log('1️⃣ Test d\'insertion d\'une transaction de crédit...');
    
    const testTransaction = {
      user_id: publisherId,
      type: 'deposit',
      amount: 10,
      description: 'Test RLS Fix',
      currency: 'MAD',
      status: 'completed',
      balance_before: 0,
      balance_after: 10,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    const { data: insertedTransaction, error: insertError } = await supabase
      .from('credit_transactions')
      .insert([testTransaction])
      .select('id')
      .single();
    
    if (insertError) {
      console.log('❌ Erreur insertion transaction de crédit:', insertError);
      console.log('   Code:', insertError.code);
      console.log('   Message:', insertError.message);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
      
      if (insertError.code === '42501') {
        console.log('\n💡 Erreur 42501: Politique RLS bloque l\'insertion');
        console.log('   Solution: Appliquer le script SQL de correction');
        return;
      }
    } else {
      console.log('✅ Transaction de crédit insérée avec succès:', insertedTransaction.id);
      
      // Supprimer la transaction de test
      const { error: deleteError } = await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', insertedTransaction.id);
      
      if (deleteError) {
        console.log('⚠️  Erreur suppression transaction test:', deleteError);
      } else {
        console.log('✅ Transaction de test supprimée');
      }
    }
    
    // 2. Tester la fonction confirmLinkPlacement complète
    console.log('\n2️⃣ Test de la fonction confirmLinkPlacement complète...');
    
    // Créer une demande de test
    const { data: linkListing, error: listingError } = await supabase
      .from('link_listings')
      .select('id, title, price')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (listingError) {
      console.log('❌ Erreur récupération link_listing:', listingError);
      return;
    }
    
    const { data: testRequest, error: testRequestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: linkListing.id,
        user_id: advertiserId,
        publisher_id: publisherId,
        target_url: 'https://test-rls.com',
        anchor_text: 'Test RLS Link',
        proposed_price: 25,
        proposed_duration: 1,
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        confirmation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        placed_url: 'https://test-rls.com/placed-link'
      })
      .select('id')
      .single();
    
    if (testRequestError) {
      console.log('❌ Erreur création demande test:', testRequestError);
      return;
    }
    
    console.log(`✅ Demande de test créée: ${testRequest.id}`);
    
    // 3. Simuler la confirmation (comme dans le frontend)
    console.log('\n3️⃣ Simulation de la confirmation...');
    
    const requestId = testRequest.id;
    const amount = 25;
    const platformFee = amount * 0.10;
    const publisherAmount = amount - platformFee;
    
    // Récupérer les détails de la demande
    const { data: request, error: requestDetailsError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestDetailsError) {
      console.log('❌ Erreur récupération détails demande:', requestDetailsError);
      return;
    }
    
    // Vérifier le solde de l'annonceur
    const { data: advertiserBalance, error: advertiserBalanceError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();
    
    if (advertiserBalanceError) {
      console.log('❌ Erreur récupération solde annonceur:', advertiserBalanceError);
      return;
    }
    
    // Créer la transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: requestId,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: amount,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (transactionError) {
      console.log('❌ Erreur création transaction:', transactionError);
      return;
    }
    
    console.log(`✅ Transaction créée: ${transaction.id}`);
    
    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiserBalance.balance - amount })
      .eq('id', request.user_id);
    
    if (debitError) {
      console.log('❌ Erreur débit annonceur:', debitError);
      return;
    }
    
    // Récupérer le solde actuel de l'éditeur
    const { data: publisherBalance, error: publisherBalanceError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();
    
    if (publisherBalanceError) {
      console.log('❌ Erreur récupération solde éditeur:', publisherBalanceError);
      return;
    }
    
    // Créditer l'éditeur
    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisherBalance.balance + publisherAmount })
      .eq('id', request.publisher_id);
    
    if (creditError) {
      console.log('❌ Erreur crédit éditeur:', creditError);
      return;
    }
    
    console.log(`✅ Éditeur crédité de ${publisherAmount} MAD`);
    
    // 4. Tester la création des transactions de crédit (le point problématique)
    console.log('\n4️⃣ Test de la création des transactions de crédit...');
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: request.user_id,
          type: 'purchase',
          amount: request.proposed_price,
          description: 'Achat de lien',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId
        },
        {
          user_id: request.publisher_id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId
        }
      ]);
    
    if (creditTransactionError) {
      console.log('❌ Erreur création transactions de crédit:', creditTransactionError);
      console.log('   Code:', creditTransactionError.code);
      console.log('   Message:', creditTransactionError.message);
      
      if (creditTransactionError.code === '42501') {
        console.log('\n💡 Erreur 42501: Politique RLS bloque encore l\'insertion');
        console.log('   Solution: Vérifier que le script SQL a été appliqué');
      }
    } else {
      console.log('✅ Transactions de crédit créées avec succès !');
    }
    
    // 5. Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (updateError) {
      console.log('❌ Erreur mise à jour statut:', updateError);
      return;
    }
    
    console.log(`✅ Demande confirmée`);
    
    // 6. Nettoyer les données de test
    console.log('\n6️⃣ Nettoyage des données de test...');
    
    // Supprimer les transactions de crédit liées
    const { error: deleteTransactionsError } = await supabase
      .from('credit_transactions')
      .delete()
      .eq('related_purchase_request_id', requestId);
    
    if (deleteTransactionsError) {
      console.log('⚠️  Erreur suppression transactions:', deleteTransactionsError);
    }
    
    // Supprimer la transaction
    const { error: deleteTransactionError } = await supabase
      .from('link_purchase_transactions')
      .delete()
      .eq('id', transaction.id);
    
    if (deleteTransactionError) {
      console.log('⚠️  Erreur suppression transaction:', deleteTransactionError);
    }
    
    // Supprimer la demande
    const { error: deleteRequestError } = await supabase
      .from('link_purchase_requests')
      .delete()
      .eq('id', requestId);
    
    if (deleteRequestError) {
      console.log('⚠️  Erreur suppression demande:', deleteRequestError);
    } else {
      console.log('✅ Données de test supprimées');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans testRLSFix:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test de correction RLS...\n');
  
  await testRLSFix();
  
  console.log('\n✅ Test terminé !');
  console.log('\n💡 Instructions:');
  console.log('   1. Si vous voyez l\'erreur 42501, appliquez le script SQL');
  console.log('   2. Allez sur https://supabase.com/dashboard');
  console.log('   3. Ouvrez "SQL Editor"');
  console.log('   4. Copiez et exécutez le contenu de fix-rls-credit-transactions.sql');
  console.log('   5. Relancez ce test pour vérifier la correction');
}

// Exécuter le test
runTest().catch(console.error);
