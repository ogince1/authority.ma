// Script pour tester la connexion à Supabase Cloud
import { createClient } from '@supabase/supabase-js';

// Configuration directe avec vos clés
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

console.log('🔗 Test de connexion à Supabase Cloud...');
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
      console.error('Détails:', error);
      return;
    }
    
    console.log('✅ Connexion réussie !');
    
    // Lister les tables disponibles
    console.log('\n📋 Test des tables principales:');
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
    const mainTables = ['users', 'websites', 'link_listings', 'blog_posts', 'success_stories'];
    
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
    
    // Test d'authentification
    console.log('\n🔐 Test d\'authentification...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (!authError) {
      console.log('✅ Service d\'authentification accessible');
    } else {
      console.log('❌ Erreur d\'authentification:', authError.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testConnection();
