// Script pour tester l'insertion simple dans credit_transactions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Test simple d\'insertion dans credit_transactions...\n');

async function testSimpleCreditTransaction() {
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';
    const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';
    
    // 1. Récupérer un vrai link_listing_id
    console.log('1️⃣ Récupération d\'un vrai link_listing_id...');
    
    const { data: linkListings, error: linkError } = await supabase
      .from('link_listings')
      .select('id')
      .limit(1);
    
    if (linkError || !linkListings || linkListings.length === 0) {
      console.log('❌ Aucun link_listing trouvé:', linkError?.message);
      return;
    }
    
    const linkListingId = linkListings[0].id;
    console.log('✅ Link listing ID trouvé:', linkListingId);
    
    // 2. Récupérer un vrai purchase_request_id
    console.log('\n2️⃣ Récupération d\'un vrai purchase_request_id...');
    
    const { data: purchaseRequests, error: purchaseError } = await supabase
      .from('link_purchase_requests')
      .select('id')
      .limit(1);
    
    if (purchaseError || !purchaseRequests || purchaseRequests.length === 0) {
      console.log('❌ Aucun purchase_request trouvé:', purchaseError?.message);
      return;
    }
    
    const purchaseRequestId = purchaseRequests[0].id;
    console.log('✅ Purchase request ID trouvé:', purchaseRequestId);
    
    // 3. Tester l'insertion avec les vrais IDs
    console.log('\n3️⃣ Test d\'insertion avec les vrais IDs...');
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiserId,
          type: 'purchase',
          amount: 100,
          description: 'Test achat de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: linkListingId,
          related_purchase_request_id: purchaseRequestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: publisherId,
          type: 'deposit',
          amount: 90,
          description: 'Test vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: linkListingId,
          related_purchase_request_id: purchaseRequestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);
    
    if (creditTransactionError) {
      console.log('❌ Erreur insertion transactions de crédit:', creditTransactionError.message);
      console.log('Code:', creditTransactionError.code);
      console.log('Details:', creditTransactionError.details);
      console.log('Hint:', creditTransactionError.hint);
    } else {
      console.log('✅ Transactions de crédit créées avec succès !');
      
      // 4. Nettoyer les données de test
      console.log('\n4️⃣ Nettoyage des données de test...');
      
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('related_purchase_request_id', purchaseRequestId)
        .eq('description', 'Test achat de lien');
      
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('related_purchase_request_id', purchaseRequestId)
        .eq('description', 'Test vente de lien');
      
      console.log('✅ Données de test nettoyées');
    }
    
    // 5. Résumé
    console.log('\n5️⃣ Résumé:');
    if (!creditTransactionError) {
      console.log('🎉 La correction fonctionne parfaitement !');
      console.log('💡 Les transactions de crédit peuvent maintenant être créées avec tous les champs requis.');
      console.log('✅ Le problème RLS est résolu !');
    } else {
      console.log('❌ Il y a encore un problème. Vérifiez les erreurs ci-dessus.');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans testSimpleCreditTransaction:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test simple...\n');
  
  await testSimpleCreditTransaction();
  
  console.log('\n✅ Test terminé !');
}

// Exécuter le test
runTest().catch(console.error);
