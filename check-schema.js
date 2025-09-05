// Script pour vérifier le schéma des tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableSchema(tableName) {
  console.log(`\n🔍 Structure de la table: ${tableName}`);
  console.log('='.repeat(50));
  
  try {
    // Essayer de récupérer un enregistrement pour voir la structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('📋 Colonnes disponibles:');
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]}`);
      });
    } else {
      console.log('📋 Table vide, vérification avec une insertion de test...');
      
      // Essayer d'insérer un enregistrement de test pour voir les colonnes requises
      const testData = {};
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([testData]);
      
      if (insertError) {
        console.log(`❌ Erreur insertion: ${insertError.message}`);
      }
    }
    
  } catch (err) {
    console.log(`❌ Erreur générale: ${err.message}`);
  }
}

async function checkAllTables() {
  console.log('🔍 VÉRIFICATION DU SCHÉMA DES TABLES');
  console.log('====================================');
  
  const tables = [
    'campaigns',
    'link_orders', 
    'link_purchase_requests',
    'link_purchase_transactions',
    'users',
    'websites',
    'link_listings'
  ];
  
  for (const table of tables) {
    await checkTableSchema(table);
  }
}

checkAllTables();
