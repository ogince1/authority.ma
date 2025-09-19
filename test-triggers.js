import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Vérification des triggers automatiques\n');

async function testTriggers() {
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

    // Créer une demande de test
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

    // Créer une demande d'achat
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert({
        link_listing_id: existingLink.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-triggers.com',
        anchor_text: 'Test triggers',
        proposed_price: 25,
        proposed_duration: 1,
        status: 'pending',
        message: 'Test des triggers automatiques'
      })
      .select()
      .single();

    if (requestError) {
      console.log('❌ Erreur création demande:', requestError);
      return;
    }

    // Accepter la demande
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        accepted_at: new Date().toISOString(),
        response_date: new Date().toISOString(),
        placed_url: 'https://test-placement-triggers.com',
        placed_at: new Date().toISOString(),
        editor_response: 'Demande acceptée pour test triggers'
      })
      .eq('id', purchaseRequest.id);

    if (acceptError) {
      console.log('❌ Erreur acceptation demande:', acceptError);
      return;
    }

    console.log(`\n✅ Demande de test créée: ${purchaseRequest.id.slice(0, 8)}...`);

    // TEST 1: Créer les transactions de crédit et voir si les triggers mettent à jour les soldes
    console.log('\n📋 TEST 1: Création des transactions de crédit...');
    
    const platformFee = purchaseRequest.proposed_price * 0.10;
    const publisherAmount = purchaseRequest.proposed_price - platformFee;

    console.log(`   Prix total: ${purchaseRequest.proposed_price} MAD`);
    console.log(`   Commission plateforme (10%): ${platformFee} MAD`);
    console.log(`   Montant éditeur: ${publisherAmount} MAD`);

    // Créer les transactions de crédit
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: advertiser.id,
          type: 'purchase',
          amount: purchaseRequest.proposed_price,
          description: 'Achat de lien (test triggers)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: existingLink.id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        },
        {
          user_id: publisher.id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien (test triggers)',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: existingLink.id,
          related_purchase_request_id: purchaseRequest.id,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ])
      .select();

    if (creditError) {
      console.log('❌ Erreur création transactions de crédit:', creditError);
      return;
    }

    console.log(`✅ Transactions de crédit créées: ${creditTransactions.length}`);

    // Attendre un peu pour que les triggers se déclenchent
    console.log('\n⏳ Attente de 2 secondes pour que les triggers se déclenchent...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier les soldes après les triggers
    console.log('\n📋 VÉRIFICATION DES SOLDES APRÈS LES TRIGGERS:');
    
    const { data: updatedAdvertiser } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', advertiser.id)
      .single();

    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`\n🎯 RÉSULTATS:`);
    console.log(`   Annonceur: ${advertiser.balance} MAD → ${updatedAdvertiser?.balance} MAD`);
    console.log(`   Éditeur: ${publisher.balance} MAD → ${updatedPublisher?.balance} MAD`);

    // Vérifier si les triggers ont fonctionné
    const expectedAdvertiserBalance = advertiser.balance - purchaseRequest.proposed_price;
    const expectedPublisherBalance = publisher.balance + publisherAmount;

    console.log(`\n🔍 VÉRIFICATION:`);
    console.log(`   Annonceur attendu: ${expectedAdvertiserBalance} MAD`);
    console.log(`   Annonceur réel: ${updatedAdvertiser?.balance} MAD`);
    console.log(`   Éditeur attendu: ${expectedPublisherBalance} MAD`);
    console.log(`   Éditeur réel: ${updatedPublisher?.balance} MAD`);

    if (updatedAdvertiser?.balance === expectedAdvertiserBalance) {
      console.log(`   ✅ Trigger annonceur: FONCTIONNE`);
    } else {
      console.log(`   ❌ Trigger annonceur: NE FONCTIONNE PAS`);
    }

    if (updatedPublisher?.balance === expectedPublisherBalance) {
      console.log(`   ✅ Trigger éditeur: FONCTIONNE`);
    } else {
      console.log(`   ❌ Trigger éditeur: NE FONCTIONNE PAS`);
    }

    // Vérifier les transactions créées
    console.log(`\n📋 VÉRIFICATION DES TRANSACTIONS CRÉÉES:`);
    
    const { data: createdTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .in('id', creditTransactions.map(t => t.id))
      .order('created_at', { ascending: false });

    createdTransactions?.forEach((trans, index) => {
      const user = trans.user_id === advertiser.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. ${user}: ${trans.type} ${trans.amount} MAD - ${trans.description}`);
      console.log(`      Solde avant: ${trans.balance_before} MAD`);
      console.log(`      Solde après: ${trans.balance_after} MAD`);
    });

    console.log('\n🎉 TEST TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testTriggers();
