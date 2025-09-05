// Script pour tester la connexion à la base de données Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

console.log('🔗 Connexion à Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Test de connexion à la base de données...');
    
    // Test de connexion basique
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return;
    }
    
    console.log('✅ Connexion réussie !');
    
    // Lister les tables disponibles
    console.log('\n📋 Tables disponibles:');
    const tables = [
      'users', 'websites', 'link_listings', 'link_purchase_requests',
      'transactions', 'notifications', 'messages', 'reviews',
      'blog_posts', 'success_stories', 'campaigns', 'link_orders',
      'credit_transactions', 'link_purchase_transactions', 'conversations',
      'conversation_messages', 'url_analyses'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${table} - accessible`);
        } else {
          console.log(`❌ ${table} - erreur: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table} - erreur: ${err.message}`);
      }
    }
    
    // Compter les enregistrements dans les tables principales
    console.log('\n📈 Statistiques des tables:');
    const mainTables = ['users', 'websites', 'link_listings', 'blog_posts'];
    
    for (const table of mainTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`📊 ${table}: ${count || 0} enregistrements`);
        }
      } catch (err) {
        console.log(`❌ ${table}: erreur lors du comptage`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testConnection();
