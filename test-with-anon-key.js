// Test avec la clé anon pour simuler l'application
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, anonKey);

const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';

console.log('🔍 Test avec la clé anon (comme dans l\'application)...\n');

async function testWithAnonKey() {
  try {
    // 1. Tester la récupération du solde de l'éditeur
    console.log('1️⃣ Test de la récupération du solde avec la clé anon...');
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', publisherId)
      .maybeSingle();
    
    if (publisherError) {
      console.error('❌ Erreur avec la clé anon:', publisherError);
      console.log('   Code:', publisherError.code);
      console.log('   Message:', publisherError.message);
      console.log('   Details:', publisherError.details);
      console.log('   Hint:', publisherError.hint);
      
      if (publisherError.code === 'PGRST301') {
        console.log('\n💡 Erreur PGRST301: Problème de permissions RLS');
        console.log('   L\'utilisateur anon n\'a pas accès à cette table');
        console.log('   Solution: Vérifier les politiques RLS sur la table users');
      }
      
      return false;
    }
    
    if (!publisher) {
      console.log('❌ Aucune donnée trouvée avec la clé anon');
      return false;
    }
    
    console.log('✅ Solde récupéré avec succès:', publisher.balance, 'MAD');
    
    // 2. Tester l'authentification
    console.log('\n2️⃣ Test de l\'authentification...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  Erreur d\'authentification:', authError.message);
      console.log('   C\'est normal car nous ne sommes pas connectés');
    } else if (user) {
      console.log('✅ Utilisateur connecté:', user.email);
    } else {
      console.log('ℹ️  Aucun utilisateur connecté (normal)');
    }
    
    // 3. Tester la récupération des demandes
    console.log('\n3️⃣ Test de la récupération des demandes...');
    
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id, status, proposed_price')
      .eq('publisher_id', publisherId)
      .limit(1);
    
    if (requestsError) {
      console.error('❌ Erreur lors de la récupération des demandes:', requestsError);
    } else {
      console.log('✅ Demandes récupérées avec succès:', requests.length);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur dans testWithAnonKey:', error);
    return false;
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test avec la clé anon...\n');
  
  const success = await testWithAnonKey();
  
  console.log('\n✅ Test terminé !');
  
  if (!success) {
    console.log('\n💡 Problème identifié:');
    console.log('   - La clé anon n\'a pas accès à la table users');
    console.log('   - Problème de permissions RLS');
    console.log('   - Solution: Modifier les politiques RLS ou utiliser une approche différente');
    
    console.log('\n🔧 Solutions possibles:');
    console.log('   1. Modifier les politiques RLS pour permettre l\'accès');
    console.log('   2. Utiliser une fonction RPC pour récupérer le solde');
    console.log('   3. Modifier la logique pour éviter de récupérer le solde de l\'éditeur');
  } else {
    console.log('\n✅ Tout fonctionne avec la clé anon');
  }
}

// Exécuter le test
runTest().catch(console.error);
