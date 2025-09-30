import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('💰 VÉRIFICATION: Solde de ogincema@gmail.com\n');

async function checkOgincemaBalance() {
  try {
    // Récupérer l'éditeur ogincema@gmail.com
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('id, email, balance, created_at')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (publisherError || !publisher) {
      console.log('❌ Impossible de trouver ogincema@gmail.com');
      return;
    }

    console.log(`🎯 Éditeur: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);
    console.log(`   Compte créé: ${new Date(publisher.created_at).toLocaleString()}`);

    // Calculer le total des crédits reçus
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .select('amount, type, description, created_at')
      .eq('user_id', publisher.id)
      .eq('type', 'deposit')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (creditError) {
      console.log('❌ Erreur récupération transactions crédit:', creditError);
      return;
    }

    const totalCredits = creditTransactions?.reduce((sum, trans) => sum + parseFloat(trans.amount), 0) || 0;
    console.log(`\n📊 ANALYSE DES CRÉDITS:`);
    console.log(`   Total des crédits reçus: ${totalCredits} MAD`);
    console.log(`   Nombre de transactions: ${creditTransactions?.length || 0}`);

    if (creditTransactions && creditTransactions.length > 0) {
      console.log(`\n📋 DÉTAIL DES CRÉDITS RÉCENTS:`);
      creditTransactions.slice(0, 10).forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.amount} MAD - ${trans.description} (${new Date(trans.created_at).toLocaleString()})`);
      });
    }

    // Vérifier les transactions d'achat de liens
    const { data: linkTransactions, error: linkError } = await supabase
      .from('link_purchase_transactions')
      .select('amount, publisher_amount, status, completed_at')
      .eq('publisher_id', publisher.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (linkError) {
      console.log('❌ Erreur récupération transactions liens:', linkError);
      return;
    }

    const totalLinkEarnings = linkTransactions?.reduce((sum, trans) => sum + parseFloat(trans.publisher_amount), 0) || 0;
    console.log(`\n🔗 ANALYSE DES VENTES DE LIENS:`);
    console.log(`   Total gagné sur les liens: ${totalLinkEarnings} MAD`);
    console.log(`   Nombre de ventes: ${linkTransactions?.length || 0}`);

    if (linkTransactions && linkTransactions.length > 0) {
      console.log(`\n📋 DÉTAIL DES VENTES RÉCENTES:`);
      linkTransactions.slice(0, 10).forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.publisher_amount} MAD (sur ${trans.amount} MAD total) - ${new Date(trans.completed_at).toLocaleString()}`);
      });
    }

    // Vérifier les demandes confirmées récemment
    const { data: confirmedRequests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id, proposed_price, confirmed_at, status')
      .eq('publisher_id', publisher.id)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(10);

    if (requestsError) {
      console.log('❌ Erreur récupération demandes confirmées:', requestsError);
      return;
    }

    console.log(`\n📋 DEMANDES CONFIRMÉES RÉCEMMENT:`);
    console.log(`   Nombre de demandes confirmées: ${confirmedRequests?.length || 0}`);
    
    if (confirmedRequests && confirmedRequests.length > 0) {
      confirmedRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id.slice(0, 8)}... | Prix: ${req.proposed_price} MAD | Confirmé: ${new Date(req.confirmed_at).toLocaleString()}`);
      });
    }

    console.log(`\n🎯 CONCLUSION:`);
    console.log(`   Solde actuel: ${publisher.balance} MAD`);
    console.log(`   Crédits reçus: ${totalCredits} MAD`);
    console.log(`   Ventes de liens: ${totalLinkEarnings} MAD`);
    console.log(`   Demandes confirmées: ${confirmedRequests?.length || 0}`);

    if (totalLinkEarnings > 0) {
      console.log(`   ✅ L'éditeur a bien reçu de l'argent des ventes de liens !`);
    } else {
      console.log(`   ⚠️  Aucune vente de lien trouvée pour cet éditeur`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkOgincemaBalance();
