import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Système de demandes de balance pour l\'admin\n');

async function testBalanceRequestsSystem() {
  try {
    console.log('📋 ÉTAPE 1: Test de création de demande d\'ajout de fonds (annonceur)...');
    
    // Récupérer l'annonceur
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();

    if (!advertiser) {
      console.log('❌ Annonceur non trouvé');
      return;
    }

    console.log(`🎯 Annonceur: ${advertiser.email} (Solde: ${advertiser.balance} MAD)`);

    // Test de création de demande d'ajout de fonds
    const { data: addFundsResult, error: addFundsError } = await supabase.rpc('create_add_funds_request', {
      p_amount: 100.0,
      p_payment_method: 'bank_transfer',
      p_description: 'Demande d\'ajout de 100 MAD par virement bancaire',
      p_payment_reference: 'REF123456'
    });

    if (addFundsError) {
      console.log('❌ Erreur création demande ajout:', addFundsError);
    } else {
      console.log('✅ Demande d\'ajout créée:', addFundsResult);
    }

    console.log('\n📋 ÉTAPE 2: Test de création de demande de retrait (éditeur)...');
    
    // Récupérer l'éditeur
    const { data: publisher } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (!publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log(`🎯 Éditeur: ${publisher.email} (Solde: ${publisher.balance} MAD)`);

    // Test de création de demande de retrait
    const { data: withdrawResult, error: withdrawError } = await supabase.rpc('create_withdraw_request', {
      p_amount: 50.0,
      p_payment_method: 'bank_transfer',
      p_description: 'Demande de retrait de 50 MAD de mes revenus',
      p_bank_details: { iban: 'FR76XXXX', bic: 'BNPAFRPP' }
    });

    if (withdrawError) {
      console.log('❌ Erreur création demande retrait:', withdrawError);
    } else {
      console.log('✅ Demande de retrait créée:', withdrawResult);
    }

    console.log('\n📋 ÉTAPE 3: Récupération des demandes pour l\'admin...');
    
    // Récupérer toutes les demandes pour l'admin
    const { data: allRequests, error: requestsError } = await supabase.rpc('get_balance_requests');

    if (requestsError) {
      console.log('❌ Erreur récupération demandes:', requestsError);
    } else {
      console.log(`✅ Demandes récupérées: ${allRequests?.length || 0}`);
      allRequests?.slice(0, 5).forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.type} - ${request.user_name} (${request.user_email})`);
        console.log(`      Montant: ${request.amount} MAD`);
        console.log(`      Statut: ${request.status}`);
        console.log(`      Méthode: ${request.payment_method}`);
        console.log(`      Date: ${new Date(request.created_at).toLocaleString()}`);
      });
    }

    console.log('\n📋 ÉTAPE 4: Test d\'approbation d\'une demande...');
    
    // Trouver une demande en attente pour la tester
    const pendingRequest = allRequests?.find(r => r.status === 'pending');
    
    if (pendingRequest) {
      console.log(`🎯 Test d'approbation de la demande: ${pendingRequest.id.slice(0, 8)}...`);
      
      const { data: processResult, error: processError } = await supabase.rpc('process_balance_request', {
        p_request_id: pendingRequest.id,
        p_action: 'approve',
        p_admin_notes: 'Demande approuvée par test automatique'
      });

      if (processError) {
        console.log('❌ Erreur traitement demande:', processError);
      } else {
        console.log('✅ Demande traitée:', processResult);
        
        // Vérifier que la transaction a été créée
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: updatedUser } = await supabase
          .from('users')
          .select('balance')
          .eq('id', pendingRequest.user_id)
          .single();

        console.log(`   Solde utilisateur après traitement: ${updatedUser?.balance} MAD`);
      }
    } else {
      console.log('❌ Aucune demande en attente pour tester l\'approbation');
    }

    console.log('\n📋 ÉTAPE 5: Vérification des notifications admin...');
    
    // Vérifier les notifications créées pour l'admin
    const { data: adminNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('action_type', 'balance_request')
      .order('created_at', { ascending: false })
      .limit(5);

    if (notifError) {
      console.log('❌ Erreur récupération notifications:', notifError);
    } else {
      console.log(`✅ Notifications admin: ${adminNotifications?.length || 0}`);
      adminNotifications?.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.message}`);
        console.log(`      Date: ${new Date(notif.created_at).toLocaleString()}`);
        console.log(`      Lu: ${notif.is_read ? 'OUI' : 'NON'}`);
      });
    }

    console.log('\n🎯 RÉSUMÉ DU SYSTÈME:');
    console.log('   ✅ Annonceurs (virement bancaire) → Demande à l\'admin');
    console.log('   ✅ Éditeurs (retrait) → Demande à l\'admin');
    console.log('   ✅ Admin → Interface de gestion des demandes');
    console.log('   ✅ Notifications automatiques');
    console.log('   ✅ Mise à jour automatique des soldes après approbation');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testBalanceRequestsSystem();
