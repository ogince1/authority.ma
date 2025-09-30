// Script pour vérifier les tables existantes dans Supabase Cloud
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Vérification des tables existantes dans Supabase Cloud...\n');

    // Tables email à vérifier
    const emailTables = [
      'email_preferences',
      'email_history', 
      'user_journey_events',
      'email_templates'
    ];

    // Vérifier chaque table
    for (const tableName of emailTables) {
      try {
        console.log(`📋 Vérification de la table: ${tableName}`);
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`   ❌ Table '${tableName}' n'existe pas`);
          } else {
            console.log(`   ⚠️  Erreur lors de la vérification: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table '${tableName}' existe (${count} enregistrements)`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${tableName}' n'existe pas ou erreur: ${err.message}`);
      }
    }

    // Vérifier les tables principales existantes
    console.log('\n📊 Vérification des tables principales...');
    const mainTables = ['users', 'websites', 'link_listings', 'link_purchase_requests'];
    
    for (const tableName of mainTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ Table '${tableName}': ${error.message}`);
        } else {
          console.log(`   ✅ Table '${tableName}': ${count} enregistrements`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${tableName}': ${err.message}`);
      }
    }

    // Vérifier les colonnes custom_content dans link_purchase_requests
    console.log('\n🔧 Vérification des colonnes custom_content...');
    try {
      const { data, error } = await supabase
        .from('link_purchase_requests')
        .select('custom_content, content_option')
        .limit(1);

      if (error) {
        console.log(`   ❌ Colonnes custom_content manquantes: ${error.message}`);
      } else {
        console.log(`   ✅ Colonnes custom_content existantes`);
      }
    } catch (err) {
      console.log(`   ❌ Erreur vérification colonnes: ${err.message}`);
    }

    console.log('\n✅ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTables();