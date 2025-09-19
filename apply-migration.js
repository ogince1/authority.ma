import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Application de la migration pour créer les fonctions RPC\n');

async function applyMigration() {
  try {
    // Lire le fichier de migration
    const migrationContent = fs.readFileSync('supabase/migrations/20250121000048_create_trigger_functions.sql', 'utf8');
    
    console.log('📋 Contenu de la migration:');
    console.log(migrationContent.substring(0, 200) + '...\n');
    
    // Diviser le contenu en requêtes individuelles
    const queries = migrationContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    console.log(`📊 Nombre de requêtes à exécuter: ${queries.length}\n`);
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i] + ';';
      
      if (query.trim() === ';') continue;
      
      console.log(`📋 Exécution de la requête ${i + 1}/${queries.length}...`);
      console.log(`   ${query.substring(0, 100)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        } else {
          console.log(`   ✅ Succès`);
        }
      } catch (err) {
        console.log(`   ❌ Erreur: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Migration appliquée !');
    
    // Tester les nouvelles fonctions
    console.log('\n🧪 Test des nouvelles fonctions RPC...');
    
    // Test 1: Vérifier les triggers
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_table_triggers', { table_name: 'credit_transactions' });
    
    if (triggerError) {
      console.log('❌ Erreur test triggers:', triggerError);
    } else {
      console.log('✅ Triggers trouvés:');
      triggers?.forEach((trigger, index) => {
        console.log(`   ${index + 1}. ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }
    
    // Test 2: Vérifier l'état des triggers
    const { data: status, error: statusError } = await supabase
      .rpc('check_trigger_status');
    
    if (statusError) {
      console.log('❌ Erreur test statut:', statusError);
    } else {
      console.log('✅ Statut des triggers:');
      status?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.table_name}.${item.trigger_name} (${item.is_enabled ? 'Actif' : 'Inactif'})`);
      });
    }
    
    // Test 3: Réparer les triggers manquants
    const { data: repair, error: repairError } = await supabase
      .rpc('repair_missing_triggers');
    
    if (repairError) {
      console.log('❌ Erreur réparation:', repairError);
    } else {
      console.log('✅ Réparation:', repair);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la migration
applyMigration();
