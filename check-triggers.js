import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VÉRIFICATION DES TRIGGERS SUR LA TABLE users\n');

async function checkTriggers() {
  try {
    // Vérifier les triggers sur la table users
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_table_triggers', { table_name: 'users' });

    if (triggerError) {
      console.log('❌ Erreur récupération triggers:', triggerError);
      
      // Essayer une autre méthode
      console.log('\n🔍 Tentative alternative...');
      
      // Vérifier s'il y a des triggers en regardant les fonctions
      const { data: functions, error: funcError } = await supabase
        .rpc('get_database_functions');

      if (funcError) {
        console.log('❌ Erreur récupération fonctions:', funcError);
      } else {
        console.log('✅ Fonctions trouvées:');
        functions?.forEach((func, index) => {
          console.log(`   ${index + 1}. ${func.function_name} (${func.function_type})`);
        });
      }
    } else {
      console.log('✅ Triggers trouvés:');
      triggers?.forEach((trigger, index) => {
        console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }

    // Vérifier les triggers sur la table credit_transactions
    console.log('\n🔍 VÉRIFICATION DES TRIGGERS SUR LA TABLE credit_transactions\n');
    
    const { data: creditTriggers, error: creditTriggerError } = await supabase
      .rpc('get_table_triggers', { table_name: 'credit_transactions' });

    if (creditTriggerError) {
      console.log('❌ Erreur récupération triggers credit_transactions:', creditTriggerError);
    } else {
      console.log('✅ Triggers credit_transactions trouvés:');
      creditTriggers?.forEach((trigger, index) => {
        console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }

    // Vérifier les triggers sur la table link_purchase_transactions
    console.log('\n🔍 VÉRIFICATION DES TRIGGERS SUR LA TABLE link_purchase_transactions\n');
    
    const { data: purchaseTriggers, error: purchaseTriggerError } = await supabase
      .rpc('get_table_triggers', { table_name: 'link_purchase_transactions' });

    if (purchaseTriggerError) {
      console.log('❌ Erreur récupération triggers link_purchase_transactions:', purchaseTriggerError);
    } else {
      console.log('✅ Triggers link_purchase_transactions trouvés:');
      purchaseTriggers?.forEach((trigger, index) => {
        console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }

    // Vérifier les migrations récentes
    console.log('\n🔍 VÉRIFICATION DES MIGRATIONS RÉCENTES\n');
    
    const { data: migrations, error: migrationError } = await supabase
      .rpc('get_recent_migrations');

    if (migrationError) {
      console.log('❌ Erreur récupération migrations:', migrationError);
    } else {
      console.log('✅ Migrations récentes:');
      migrations?.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration.version} - ${migration.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkTriggers();
