// Test du flux complet de paiement éditeur
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, serviceKey);

async function testPaiementEditeur() {
  console.log('🧪 TEST DU FLUX DE PAIEMENT ÉDITEUR\n');
  console.log('====================================\n');

  try {
    // 1. Vérifier le trigger
    console.log('1️⃣ Vérification du trigger...');
    const { data: triggerCheck } = await supabase.rpc('exec', {
      query: `
        SELECT trigger_name, event_manipulation 
        FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_check_balance_before_transaction';
      `
    }).catch(() => ({ data: null }));
    
    if (triggerCheck) {
      console.log('✅ Trigger présent\n');
    } else {
      console.log('⚠️  Vérification manuelle recommandée\n');
    }

    // 2. Trouver un annonceur avec solde suffisant
    console.log('2️⃣ Recherche d\'un annonceur avec solde...');
    const { data: advertisers } = await supabase
      .from('users')
      .select('id, email, name, balance, role')
      .eq('role', 'advertiser')
      .gte('balance', 100)
      .limit(1);

    if (!advertisers || advertisers.length === 0) {
      console.log('❌ Aucun annonceur avec solde suffisant trouvé');
      console.log('💡 Ajoutez du solde à un annonceur pour tester\n');
      return;
    }

    const advertiser = advertisers[0];
    console.log(`✅ Annonceur trouvé: ${advertiser.email}`);
    console.log(`   Solde actuel: ${advertiser.balance} MAD\n`);

    // 3. Trouver un éditeur
    console.log('3️⃣ Recherche d\'un éditeur...');
    const { data: publishers } = await supabase
      .from('users')
      .select('id, email, name, balance, role')
      .eq('role', 'publisher')
      .limit(1);

    if (!publishers || publishers.length === 0) {
      console.log('❌ Aucun éditeur trouvé\n');
      return;
    }

    const publisher = publishers[0];
    console.log(`✅ Éditeur trouvé: ${publisher.email}`);
    console.log(`   Solde actuel: ${publisher.balance} MAD\n`);

    // 4. Vérifier qu'il y a des demandes en attente
    console.log('4️⃣ Recherche de demandes en attente...');
    const { data: pendingRequests } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('status', 'pending')
      .eq('publisher_id', publisher.id)
      .limit(1);

    if (pendingRequests && pendingRequests.length > 0) {
      const request = pendingRequests[0];
      console.log(`✅ Demande trouvée: ${request.id.slice(0, 8)}...`);
      console.log(`   Prix: ${request.proposed_price} MAD`);
      console.log(`   Annonceur: ${request.user_id === advertiser.id ? advertiser.email : 'Autre'}\n`);
      
      console.log('📊 RÉSUMÉ DU TEST:');
      console.log('==================');
      console.log(`Annonceur: ${advertiser.email} (${advertiser.balance} MAD)`);
      console.log(`Éditeur: ${publisher.email} (${publisher.balance} MAD)`);
      console.log(`Prix demande: ${request.proposed_price} MAD`);
      console.log('');
      console.log('✅ Tout est prêt pour tester !');
      console.log('');
      console.log('💡 PROCHAINES ÉTAPES:');
      console.log('1. Va sur le dashboard éditeur');
      console.log('2. Accepte la demande');
      console.log('3. Vérifie que:');
      console.log(`   - Annonceur débité de ${request.proposed_price} MAD`);
      console.log(`   - Éditeur crédité (montant après commission)`);
      console.log('   - Aucune erreur "Solde insuffisant"');
      console.log('');
    } else {
      console.log('⚠️  Aucune demande en attente trouvée');
      console.log('💡 Créez une demande depuis le dashboard annonceur\n');
    }

    // 5. Afficher les dernières transactions
    console.log('5️⃣ Dernières transactions:');
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('user_id, type, amount, description, created_at, users(email)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentTransactions && recentTransactions.length > 0) {
      console.log('');
      recentTransactions.forEach(tx => {
        const sign = ['deposit', 'refund', 'commission'].includes(tx.type) ? '+' : '-';
        console.log(`   ${sign}${tx.amount} MAD - ${tx.type} - ${tx.users?.email || 'Unknown'}`);
      });
    }

    console.log('');
    console.log('====================================');
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('====================================\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testPaiementEditeur();
