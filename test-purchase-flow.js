import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPurchaseFlow() {
  try {
    console.log('=== Test du flux d\'achat de backlinks ===\n');
    
    // 1. Récupérer un utilisateur de test (annonceur)
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'advertiser@test.com')
      .single();
    
    if (advertiserError || !advertiser) {
      console.error('Erreur: Utilisateur annonceur non trouvé');
      return;
    }
    
    console.log('✅ Annonceur trouvé:', advertiser.email);
    
    // 2. Récupérer un éditeur de test
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'publisher@test.com')
      .single();
    
    if (publisherError || !publisher) {
      console.error('Erreur: Utilisateur éditeur non trouvé');
      return;
    }
    
    console.log('✅ Éditeur trouvé:', publisher.email);
    
    // 3. Récupérer un lien de test
    const { data: linkListing, error: linkError } = await supabase
      .from('link_listings')
      .select('*')
      .eq('user_id', publisher.id)
      .limit(1)
      .single();
    
    if (linkError || !linkListing) {
      console.error('Erreur: Aucun lien trouvé pour l\'éditeur');
      return;
    }
    
    console.log('✅ Lien trouvé:', linkListing.title);
    
    // 4. Créer une demande d'achat
    console.log('\n--- Création d\'une demande d\'achat ---');
    const purchaseRequestData = {
      link_listing_id: linkListing.id,
      user_id: advertiser.id,
      publisher_id: publisher.id,
      target_url: 'https://test-example.com',
      anchor_text: 'Test Link',
      message: 'Test d\'achat de lien',
      proposed_price: 1000.00,
      proposed_duration: 12
    };
    
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('link_purchase_requests')
      .insert([purchaseRequestData])
      .select()
      .single();
    
    if (requestError) {
      console.error('❌ Erreur lors de la création de la demande:', requestError);
      return;
    }
    
    console.log('✅ Demande d\'achat créée:', purchaseRequest.id);
    
    // 5. Vérifier le solde de l'annonceur
    console.log('\n--- Vérification du solde ---');
    console.log('Solde actuel de l\'annonceur:', advertiser.balance);
    console.log('Montant requis:', purchaseRequestData.proposed_price);
    
    if (advertiser.balance < purchaseRequestData.proposed_price) {
      console.log('⚠️  Solde insuffisant, rechargement automatique...');
      
      const requiredAmount = purchaseRequestData.proposed_price - advertiser.balance;
      const { error: creditError } = await supabase
        .from('users')
        .update({ balance: advertiser.balance + requiredAmount })
        .eq('id', advertiser.id);
      
      if (creditError) {
        console.error('❌ Erreur lors du rechargement:', creditError);
        return;
      }
      
      console.log('✅ Compte rechargé de', requiredAmount, 'MAD');
    }
    
    // 6. Traiter l'achat avec la fonction SQL
    console.log('\n--- Traitement de l\'achat ---');
    const { data: processResult, error: processError } = await supabase.rpc('process_link_purchase', {
      p_purchase_request_id: purchaseRequest.id,
      p_advertiser_id: advertiser.id,
      p_publisher_id: publisher.id,
      p_amount: purchaseRequestData.proposed_price
    });
    
    if (processError) {
      console.error('❌ Erreur lors du traitement:', processError);
      
      // Essayer le fallback TypeScript
      console.log('\n--- Tentative avec le fallback TypeScript ---');
      await testTypeScriptFallback(purchaseRequest.id);
      return;
    }
    
    console.log('✅ Achat traité avec succès:', processResult);
    
    // 7. Vérifier les résultats
    console.log('\n--- Vérification des résultats ---');
    
    // Vérifier la transaction créée
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .select('*')
      .eq('purchase_request_id', purchaseRequest.id)
      .single();
    
    if (transactionError) {
      console.error('❌ Transaction non trouvée:', transactionError);
    } else {
      console.log('✅ Transaction créée:', transaction.id);
    }
    
    // Vérifier les soldes mis à jour
    const { data: updatedAdvertiser } = await supabase
      .from('users')
      .select('balance')
      .eq('id', advertiser.id)
      .single();
    
    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance')
      .eq('id', publisher.id)
      .single();
    
    console.log('Nouveau solde annonceur:', updatedAdvertiser?.balance);
    console.log('Nouveau solde éditeur:', updatedPublisher?.balance);
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

async function testTypeScriptFallback(purchaseRequestId) {
  try {
    console.log('Test du fallback TypeScript...');
    
    // Récupérer les détails de la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', purchaseRequestId)
      .single();

    if (requestError || !request) {
      console.error('Demande non trouvée');
      return;
    }

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError || !advertiser) {
      console.error('Utilisateur non trouvé');
      return;
    }

    if (advertiser.balance < request.proposed_price) {
      console.error('Solde insuffisant');
      return;
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    // Créer la transaction d'achat
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: purchaseRequestId,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: request.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        payment_method: 'manual'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Erreur lors de la création de la transaction:', transactionError);
      return;
    }

    console.log('✅ Transaction créée avec le fallback:', transaction.id);

    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) {
      console.error('Erreur lors du débit:', debitError);
      return;
    }

    // Créditer l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError || !publisher) {
      console.error('Éditeur non trouvé');
      return;
    }

    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) {
      console.error('Erreur lors du crédit:', creditError);
      return;
    }

    console.log('✅ Achat traité avec succès via le fallback TypeScript');

  } catch (error) {
    console.error('Erreur dans le fallback:', error);
  }
}

testPurchaseFlow();
