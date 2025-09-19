import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST: Système de demandes de balance corrigé\n');

async function testBalanceSystemCorrected() {
  try {
    console.log('📋 ÉTAPE 1: Vérification que les fonctions existent...');
    
    // Tester chaque fonction RPC
    const functions = [
      'create_add_funds_request',
      'create_withdraw_request', 
      'get_balance_requests',
      'process_balance_request'
    ];

    for (const funcName of functions) {
      try {
        if (funcName === 'create_add_funds_request') {
          const { data, error } = await supabase.rpc(funcName, {
            p_amount: 1.0,
            p_payment_method: 'bank_transfer',
            p_description: 'Test fonction'
          });
          
          if (error) {
            console.log(`❌ ${funcName}: ${error.message}`);
          } else {
            console.log(`✅ ${funcName}: Fonction existe (résultat: ${data?.success})`);
          }
        } else if (funcName === 'create_withdraw_request') {
          const { data, error } = await supabase.rpc(funcName, {
            p_amount: 1.0,
            p_payment_method: 'bank_transfer',
            p_description: 'Test fonction'
          });
          
          if (error) {
            console.log(`❌ ${funcName}: ${error.message}`);
          } else {
            console.log(`✅ ${funcName}: Fonction existe (résultat: ${data?.success})`);
          }
        } else if (funcName === 'get_balance_requests') {
          const { data, error } = await supabase.rpc(funcName);
          
          if (error) {
            console.log(`❌ ${funcName}: ${error.message}`);
          } else {
            console.log(`✅ ${funcName}: Fonction existe (${data?.length || 0} demandes)`);
          }
        } else if (funcName === 'process_balance_request') {
          // Ne pas tester cette fonction car elle nécessite une demande existante
          console.log(`⏭️  ${funcName}: Nécessite une demande existante`);
        }
      } catch (err) {
        console.log(`❌ ${funcName}: ${err.message}`);
      }
    }

    console.log('\n📋 ÉTAPE 2: Vérification de la table balance_requests...');
    
    // Vérifier que la table existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('balance_requests')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erreur table balance_requests:', tableError);
    } else {
      console.log('✅ Table balance_requests existe');
    }

    console.log('\n📋 ÉTAPE 3: Test des notifications...');
    
    // Vérifier les notifications récentes
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('action_type', 'payment')
      .order('created_at', { ascending: false })
      .limit(3);

    if (notifError) {
      console.log('❌ Erreur notifications:', notifError);
    } else {
      console.log(`✅ Notifications récentes: ${notifications?.length || 0}`);
      notifications?.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.message}`);
      });
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log('   Si toutes les fonctions existent:');
    console.log('   ✅ Le système est prêt à être utilisé');
    console.log('   ✅ Annonceurs peuvent demander ajout de fonds (virement)');
    console.log('   ✅ Éditeurs peuvent demander retrait');
    console.log('   ✅ Admin peut traiter les demandes');
    console.log('   ✅ Notifications automatiques');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testBalanceSystemCorrected();
