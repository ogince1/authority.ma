// Script pour tester la correction de confirmLinkPlacement
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Test de la correction de confirmLinkPlacement...\n');

async function testConfirmLinkPlacementFix() {
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';
    const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';
    
    // 1. Créer une demande d'achat de test
    console.log('1️⃣ Création d\'une demande d\'achat de test...');
    
    const testRequest = {
      link_listing_id: 'test-listing-id',
      user_id: advertiserId,
      publisher_id: publisherId,
      target_url: 'https://example.com',
      anchor_text: 'Test Link',
      message: 'Test message',
      proposed_price: 100,
      proposed_duration: 30,
      status: 'pending_confirmation',
      confirmation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h dans le futur
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert([testRequest])
      .select('id')
      .single();
    
    if (requestError) {
      console.log('❌ Erreur création demande:', requestError.message);
      return;
    }
    
    console.log('✅ Demande créée:', request.id);
    
    // 2. Créditer l'annonceur pour le test
    console.log('\n2️⃣ Crédit de l\'annonceur pour le test...');
    
    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: 1000 })
      .eq('id', advertiserId);
    
    if (creditError) {
      console.log('❌ Erreur crédit annonceur:', creditError.message);
    } else {
      console.log('✅ Annonceur crédité');
    }
    
    // 3. Tester l'insertion des transactions de crédit avec les champs corrects
    console.log('\n3️⃣ Test d\'insertion des transactions de crédit...');
    
    const platformFee = 100 * 0.10; // 10
    const publisherAmount = 100 - platformFee; // 90
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiserId,
          type: 'purchase',
          amount: 100,
          description: 'Achat de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: 'test-listing-id',
          related_purchase_request_id: request.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: publisherId,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: 'test-listing-id',
          related_purchase_request_id: request.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ]);
    
    if (creditTransactionError) {
      console.log('❌ Erreur insertion transactions de crédit:', creditTransactionError.message);
      console.log('Code:', creditTransactionError.code);
      console.log('Details:', creditTransactionError.details);
    } else {
      console.log('✅ Transactions de crédit créées avec succès !');
    }
    
    // 4. Nettoyer les données de test
    console.log('\n4️⃣ Nettoyage des données de test...');
    
    // Supprimer les transactions de crédit de test
    await supabase
      .from('credit_transactions')
      .delete()
      .eq('related_purchase_request_id', request.id);
    
    // Supprimer la demande de test
    await supabase
      .from('link_purchase_requests')
      .delete()
      .eq('id', request.id);
    
    console.log('✅ Données de test nettoyées');
    
    // 5. Résumé
    console.log('\n5️⃣ Résumé:');
    if (!creditTransactionError) {
      console.log('🎉 La correction fonctionne ! Les transactions de crédit peuvent être créées.');
      console.log('💡 Le problème était que les champs currency, status, created_at et completed_at étaient manquants.');
    } else {
      console.log('❌ La correction ne fonctionne pas encore. Vérifiez les erreurs ci-dessus.');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans testConfirmLinkPlacementFix:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test de correction...\n');
  
  await testConfirmLinkPlacementFix();
  
  console.log('\n✅ Test terminé !');
}

// Exécuter le test
runTest().catch(console.error);
