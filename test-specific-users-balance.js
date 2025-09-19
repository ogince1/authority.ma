// Script pour diagnostiquer le problème de solde avec les utilisateurs spécifiques
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Diagnostic des soldes pour les utilisateurs spécifiques...\n');

async function diagnoseSpecificUsersBalance() {
  try {
    const advertiserEmail = 'abderrahimmolatefpro@gmail.com';
    const publisherEmail = 'ogincema@gmail.com';
    
    // 1. Récupérer les IDs des utilisateurs
    console.log('1️⃣ Récupération des IDs des utilisateurs...');
    
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('id, name, email, balance, role')
      .eq('email', advertiserEmail)
      .single();
    
    if (advertiserError) {
      console.log('❌ Erreur récupération annonceur:', advertiserError.message);
      return;
    }
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('id, name, email, balance, role')
      .eq('email', publisherEmail)
      .single();
    
    if (publisherError) {
      console.log('❌ Erreur récupération éditeur:', publisherError.message);
      return;
    }
    
    console.log('✅ Annonceur trouvé:', {
      id: advertiser.id,
      name: advertiser.name,
      email: advertiser.email,
      balance: advertiser.balance,
      role: advertiser.role
    });
    
    console.log('✅ Éditeur trouvé:', {
      id: publisher.id,
      name: publisher.name,
      email: publisher.email,
      balance: publisher.balance,
      role: publisher.role
    });
    
    // 2. Vérifier les demandes d'achat récentes entre ces utilisateurs
    console.log('\n2️⃣ Vérification des demandes d\'achat récentes...');
    
    const { data: recentRequests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        status,
        proposed_price,
        created_at,
        confirmed_at,
        link_listings!inner(title)
      `)
      .eq('user_id', advertiser.id)
      .eq('publisher_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (requestsError) {
      console.log('❌ Erreur récupération demandes:', requestsError.message);
    } else {
      console.log(`📋 ${recentRequests.length} demande(s) récente(s) trouvée(s):`);
      recentRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id}`);
        console.log(`      Statut: ${req.status}`);
        console.log(`      Prix: ${req.proposed_price} MAD`);
        console.log(`      Lien: ${req.link_listings?.title}`);
        console.log(`      Créé: ${req.created_at}`);
        console.log(`      Confirmé: ${req.confirmed_at || 'Non confirmé'}`);
        console.log('');
      });
    }
    
    // 3. Vérifier les transactions de crédit récentes
    console.log('3️⃣ Vérification des transactions de crédit récentes...');
    
    const { data: advertiserTransactions, error: advertiserTxError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', advertiser.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (advertiserTxError) {
      console.log('❌ Erreur récupération transactions annonceur:', advertiserTxError.message);
    } else {
      console.log(`📋 ${advertiserTransactions.length} transaction(s) récente(s) pour l'annonceur:`);
      advertiserTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. Type: ${tx.type}`);
        console.log(`      Montant: ${tx.amount} MAD`);
        console.log(`      Description: ${tx.description}`);
        console.log(`      Statut: ${tx.status}`);
        console.log(`      Créé: ${tx.created_at}`);
        console.log('');
      });
    }
    
    const { data: publisherTransactions, error: publisherTxError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (publisherTxError) {
      console.log('❌ Erreur récupération transactions éditeur:', publisherTxError.message);
    } else {
      console.log(`📋 ${publisherTransactions.length} transaction(s) récente(s) pour l'éditeur:`);
      publisherTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. Type: ${tx.type}`);
        console.log(`      Montant: ${tx.amount} MAD`);
        console.log(`      Description: ${tx.description}`);
        console.log(`      Statut: ${tx.status}`);
        console.log(`      Créé: ${tx.created_at}`);
        console.log('');
      });
    }
    
    // 4. Vérifier les transactions de lien
    console.log('4️⃣ Vérification des transactions de lien...');
    
    const { data: linkTransactions, error: linkTxError } = await supabase
      .from('link_purchase_transactions')
      .select(`
        *,
        purchase_request:link_purchase_requests(
          id,
          status,
          proposed_price,
          link_listings!inner(title)
        )
      `)
      .or(`advertiser_id.eq.${advertiser.id},publisher_id.eq.${publisher.id}`)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (linkTxError) {
      console.log('❌ Erreur récupération transactions de lien:', linkTxError.message);
    } else {
      console.log(`📋 ${linkTransactions.length} transaction(s) de lien trouvée(s):`);
      linkTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ID: ${tx.id}`);
        console.log(`      Annonceur: ${tx.advertiser_id}`);
        console.log(`      Éditeur: ${tx.publisher_id}`);
        console.log(`      Montant: ${tx.amount} MAD`);
        console.log(`      Montant éditeur: ${tx.publisher_amount} MAD`);
        console.log(`      Statut: ${tx.status}`);
        console.log(`      Lien: ${tx.purchase_request?.link_listings?.title}`);
        console.log(`      Créé: ${tx.created_at}`);
        console.log('');
      });
    }
    
    // 5. Test de mise à jour du solde de l'éditeur
    console.log('5️⃣ Test de mise à jour du solde de l\'éditeur...');
    
    const currentPublisherBalance = publisher.balance;
    const testAmount = 50;
    const newBalance = currentPublisherBalance + testAmount;
    
    console.log(`   Solde actuel éditeur: ${currentPublisherBalance} MAD`);
    console.log(`   Test: ajouter ${testAmount} MAD`);
    console.log(`   Nouveau solde attendu: ${newBalance} MAD`);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', publisher.id);
    
    if (updateError) {
      console.log('❌ Erreur mise à jour solde éditeur:', updateError.message);
    } else {
      console.log('✅ Solde éditeur mis à jour avec succès');
      
      // Vérifier le nouveau solde
      const { data: updatedPublisher, error: verifyError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', publisher.id)
        .single();
      
      if (verifyError) {
        console.log('❌ Erreur vérification nouveau solde:', verifyError.message);
      } else {
        console.log(`✅ Nouveau solde vérifié: ${updatedPublisher.balance} MAD`);
        
        // Restaurer le solde original
        await supabase
          .from('users')
          .update({ balance: currentPublisherBalance })
          .eq('id', publisher.id);
        
        console.log(`✅ Solde restauré à: ${currentPublisherBalance} MAD`);
      }
    }
    
    // 6. Résumé et recommandations
    console.log('\n6️⃣ Résumé et recommandations:');
    console.log(`📊 Solde actuel annonceur: ${advertiser.balance} MAD`);
    console.log(`📊 Solde actuel éditeur: ${publisher.balance} MAD`);
    
    if (recentRequests && recentRequests.length > 0) {
      const confirmedRequests = recentRequests.filter(req => req.status === 'confirmed');
      if (confirmedRequests.length > 0) {
        console.log(`⚠️  ${confirmedRequests.length} demande(s) confirmée(s) trouvée(s) mais l'éditeur n'a peut-être pas reçu le paiement.`);
        console.log('💡 Vérifiez si les transactions de crédit ont été créées pour ces demandes.');
      }
    }
    
    console.log('\n🔧 Actions recommandées:');
    console.log('   1. Vérifier que les demandes sont bien en statut "confirmed"');
    console.log('   2. Vérifier que les transactions de crédit ont été créées');
    console.log('   3. Vérifier que les soldes ont été mis à jour');
    console.log('   4. Tester manuellement la confirmation d\'un lien');
    
  } catch (error) {
    console.error('❌ Erreur dans diagnoseSpecificUsersBalance:', error);
  }
}

// Fonction principale
async function runDiagnosis() {
  console.log('🚀 Démarrage du diagnostic...\n');
  
  await diagnoseSpecificUsersBalance();
  
  console.log('\n✅ Diagnostic terminé !');
}

// Exécuter le diagnostic
runDiagnosis().catch(console.error);
