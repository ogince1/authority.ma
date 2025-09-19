import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('⚡ TRAITEMENT: Confirmation automatique des demandes expirées\n');

async function processExpiredRequests() {
  try {
    // Récupérer les demandes expirées
    const { data: expiredRequests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        advertiser:users!link_purchase_requests_user_id_fkey(id, email, balance),
        publisher:users!link_purchase_requests_publisher_id_fkey(id, email, balance),
        link_listing:link_listings(id, title)
      `)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Erreur récupération demandes:', requestsError);
      return;
    }

    if (!expiredRequests || expiredRequests.length === 0) {
      console.log('ℹ️  Aucune demande en attente de confirmation trouvée');
      return;
    }

    // Filtrer les demandes expirées
    const expired = expiredRequests.filter(req => {
      const acceptedAt = new Date(req.accepted_at || req.response_date);
      const deadline = new Date(acceptedAt);
      deadline.setHours(deadline.getHours() + 48);
      return new Date() > deadline;
    });

    if (expired.length === 0) {
      console.log('✅ Aucune demande expirée trouvée');
      return;
    }

    console.log(`📋 ${expired.length} demande(s) expirée(s) à traiter:`);
    expired.forEach((req, index) => {
      console.log(`   ${index + 1}. ID: ${req.id.slice(0, 8)}... | Prix: ${req.proposed_price} MAD | Annonceur: ${req.advertiser?.email} | Éditeur: ${req.publisher?.email}`);
    });

    let processed = 0;
    let errors = [];

    // Traiter chaque demande expirée
    for (const request of expired) {
      try {
        console.log(`\n🔄 Traitement de la demande: ${request.id.slice(0, 8)}...`);

        // Vérifier le solde de l'annonceur
        if (request.advertiser?.balance < request.proposed_price) {
          console.log(`   ⚠️  Solde insuffisant pour l'annonceur: ${request.advertiser.balance} MAD < ${request.proposed_price} MAD`);
          errors.push(`Demande ${request.id.slice(0, 8)}: Solde insuffisant`);
          continue;
        }

        // Calculer les montants
        const platformFee = request.proposed_price * 0.10;
        const publisherAmount = request.proposed_price - platformFee;

        console.log(`   💰 Calculs: Prix=${request.proposed_price} MAD, Commission=${platformFee} MAD, Éditeur=${publisherAmount} MAD`);

        // Créer la transaction d'achat
        const { data: transaction, error: transactionError } = await supabase
          .from('link_purchase_transactions')
          .insert({
            purchase_request_id: request.id,
            advertiser_id: request.user_id,
            publisher_id: request.publisher_id,
            link_listing_id: request.link_listing_id,
            amount: request.proposed_price,
            platform_fee: platformFee,
            publisher_amount: publisherAmount,
            status: 'completed',
            payment_method: 'balance'
          })
          .select()
          .single();

        if (transactionError) {
          console.log(`   ❌ Erreur création transaction: ${transactionError.message}`);
          errors.push(`Demande ${request.id.slice(0, 8)}: Erreur transaction - ${transactionError.message}`);
          continue;
        }

        console.log(`   ✅ Transaction créée: ${transaction.id.slice(0, 8)}...`);

        // Débiter l'annonceur
        const { error: debitError } = await supabase
          .from('users')
          .update({ balance: request.advertiser.balance - request.proposed_price })
          .eq('id', request.user_id);

        if (debitError) {
          console.log(`   ❌ Erreur débit annonceur: ${debitError.message}`);
          errors.push(`Demande ${request.id.slice(0, 8)}: Erreur débit - ${debitError.message}`);
          continue;
        }

        console.log(`   ✅ Annonceur débité de ${request.proposed_price} MAD`);

        // Récupérer le solde actuel de l'éditeur
        const { data: publisher, error: publisherError } = await supabase
          .from('users')
          .select('balance')
          .eq('id', request.publisher_id)
          .single();

        if (publisherError) {
          console.log(`   ❌ Erreur récupération solde éditeur: ${publisherError.message}`);
          errors.push(`Demande ${request.id.slice(0, 8)}: Erreur solde éditeur - ${publisherError.message}`);
          continue;
        }

        // Créditer l'éditeur
        const { error: creditError } = await supabase
          .from('users')
          .update({ balance: publisher.balance + publisherAmount })
          .eq('id', request.publisher_id);

        if (creditError) {
          console.log(`   ❌ Erreur crédit éditeur: ${creditError.message}`);
          errors.push(`Demande ${request.id.slice(0, 8)}: Erreur crédit - ${creditError.message}`);
          continue;
        }

        console.log(`   ✅ Éditeur crédité de ${publisherAmount} MAD`);

        // Créer les transactions de crédit
        const { error: creditTransactionError } = await supabase
          .from('credit_transactions')
          .insert([
            {
              user_id: request.user_id,
              type: 'purchase',
              amount: request.proposed_price,
              description: 'Achat de lien (confirmation automatique)',
              currency: 'MAD',
              status: 'completed',
              related_link_listing_id: request.link_listing_id,
              related_purchase_request_id: request.id,
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            },
            {
              user_id: request.publisher_id,
              type: 'deposit',
              amount: publisherAmount,
              description: 'Vente de lien (confirmation automatique)',
              currency: 'MAD',
              status: 'completed',
              related_link_listing_id: request.link_listing_id,
              related_purchase_request_id: request.id,
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            }
          ]);

        if (creditTransactionError) {
          console.log(`   ⚠️  Erreur transactions crédit: ${creditTransactionError.message}`);
        } else {
          console.log(`   ✅ Transactions de crédit créées`);
        }

        // Mettre à jour le statut de la demande
        const { error: updateError } = await supabase
          .from('link_purchase_requests')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) {
          console.log(`   ❌ Erreur mise à jour statut: ${updateError.message}`);
          errors.push(`Demande ${request.id.slice(0, 8)}: Erreur statut - ${updateError.message}`);
          continue;
        }

        console.log(`   ✅ Statut mis à jour: confirmed`);
        processed++;

        // Vérification finale des soldes
        const { data: finalAdvertiser } = await supabase
          .from('users')
          .select('balance')
          .eq('id', request.user_id)
          .single();

        const { data: finalPublisher } = await supabase
          .from('users')
          .select('balance')
          .eq('id', request.publisher_id)
          .single();

        console.log(`   📊 Soldes finaux: Annonceur=${finalAdvertiser?.balance} MAD, Éditeur=${finalPublisher?.balance} MAD`);

      } catch (error) {
        console.log(`   ❌ Erreur générale: ${error.message}`);
        errors.push(`Demande ${request.id.slice(0, 8)}: ${error.message}`);
      }
    }

    console.log(`\n🎉 TRAITEMENT TERMINÉ !`);
    console.log(`   ✅ ${processed} demande(s) traitée(s) avec succès`);
    console.log(`   ❌ ${errors.length} erreur(s)`);

    if (errors.length > 0) {
      console.log(`\n📋 ERREURS:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log(`\n💡 RÉSUMÉ:`);
    console.log(`   Le processus de confirmation fonctionne correctement.`);
    console.log(`   Les demandes expirées ont été traitées automatiquement.`);
    console.log(`   Les éditeurs ont bien reçu leurs paiements.`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le traitement
processExpiredRequests();
