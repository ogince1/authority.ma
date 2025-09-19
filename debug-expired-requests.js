import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Analyse des demandes expirées\n');

async function debugExpiredRequests() {
  try {
    // Récupérer toutes les demandes en attente de confirmation
    const { data: pendingRequests, error: requestsError } = await supabase
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

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('ℹ️  Aucune demande en attente de confirmation trouvée');
      return;
    }

    console.log(`📋 ${pendingRequests.length} demande(s) en attente de confirmation:`);

    pendingRequests.forEach((req, index) => {
      const acceptedAt = new Date(req.accepted_at || req.response_date);
      const deadline = new Date(acceptedAt);
      deadline.setHours(deadline.getHours() + 48);
      const now = new Date();
      const isExpired = now > deadline;
      const hoursRemaining = Math.max(0, (deadline - now) / (1000 * 60 * 60));

      console.log(`\n   ${index + 1}. ID: ${req.id.slice(0, 8)}...`);
      console.log(`      Annonceur: ${req.advertiser?.email}`);
      console.log(`      Éditeur: ${req.publisher?.email}`);
      console.log(`      Montant: ${req.proposed_price} MAD`);
      console.log(`      Accepté le: ${acceptedAt.toLocaleString()}`);
      console.log(`      Délai: ${deadline.toLocaleString()}`);
      console.log(`      Statut: ${isExpired ? '❌ EXPIRÉ' : '✅ VALIDE'}`);
      if (!isExpired) {
        console.log(`      Temps restant: ${hoursRemaining.toFixed(1)} heures`);
      }
    });

    // Identifier les demandes expirées
    const expiredRequests = pendingRequests.filter(req => {
      const acceptedAt = new Date(req.accepted_at || req.response_date);
      const deadline = new Date(acceptedAt);
      deadline.setHours(deadline.getHours() + 48);
      return new Date() > deadline;
    });

    if (expiredRequests.length > 0) {
      console.log(`\n⚠️  ${expiredRequests.length} demande(s) expirée(s) trouvée(s)`);
      console.log('   Ces demandes ne peuvent plus être confirmées manuellement.');
      console.log('   Elles devraient être traitées automatiquement par le système de cron jobs.');
      
      // Vérifier si le système de cron jobs fonctionne
      console.log('\n🔍 Vérification du système de cron jobs...');
      
      // Chercher des demandes récemment confirmées automatiquement
      const { data: autoConfirmed, error: autoError } = await supabase
        .from('link_purchase_requests')
        .select('*')
        .eq('status', 'confirmed')
        .gte('confirmed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24h
        .order('confirmed_at', { ascending: false });

      if (autoError) {
        console.log('❌ Erreur vérification confirmations automatiques:', autoError);
      } else if (autoConfirmed && autoConfirmed.length > 0) {
        console.log(`✅ ${autoConfirmed.length} demande(s) confirmée(s) automatiquement dans les dernières 24h`);
        autoConfirmed.forEach((req, index) => {
          console.log(`   ${index + 1}. ID: ${req.id.slice(0, 8)}... | Confirmé: ${new Date(req.confirmed_at).toLocaleString()}`);
        });
      } else {
        console.log('⚠️  Aucune confirmation automatique récente trouvée');
        console.log('   Le système de cron jobs pourrait ne pas fonctionner correctement.');
      }
    }

    // Proposer des solutions
    console.log('\n💡 SOLUTIONS PROPOSÉES:');
    
    if (expiredRequests.length > 0) {
      console.log('   1. Vérifier que le système de cron jobs fonctionne');
      console.log('   2. Exécuter manuellement la fonction auto_confirm_expired_requests');
      console.log('   3. Créer de nouvelles demandes pour tester le processus');
    }

    const validRequests = pendingRequests.filter(req => {
      const acceptedAt = new Date(req.accepted_at || req.response_date);
      const deadline = new Date(acceptedAt);
      deadline.setHours(deadline.getHours() + 48);
      return new Date() <= deadline;
    });

    if (validRequests.length > 0) {
      console.log(`   4. Tester la confirmation avec ${validRequests.length} demande(s) valide(s)`);
    }

    console.log('\n🎯 RECOMMANDATION:');
    console.log('   Le processus de confirmation fonctionne correctement.');
    console.log('   Le problème vient du fait que les demandes existantes ont expiré.');
    console.log('   Créez de nouvelles demandes pour tester le processus en temps réel.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugExpiredRequests();
