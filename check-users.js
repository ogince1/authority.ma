import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('👥 Vérification des utilisateurs dans la base de données\n');

  try {
    // 1. Rechercher tous les utilisateurs
    console.log('1️⃣ Tous les utilisateurs:');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allUsersError) {
      console.log(`❌ Erreur: ${allUsersError.message}`);
    } else {
      console.log(`✅ ${allUsers ? allUsers.length : 0} utilisateurs trouvés`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'Sans nom'}) - ${user.id}`);
      });
    }
    console.log('');

    // 2. Rechercher spécifiquement abderrahimmloatefpro@gmail.com
    console.log('2️⃣ Recherche de abderrahimmloatefpro@gmail.com:');
    const { data: advertiserUsers, error: advertiserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'abderrahimmloatefpro@gmail.com');
    
    if (advertiserError) {
      console.log(`❌ Erreur: ${advertiserError.message}`);
    } else {
      console.log(`✅ ${advertiserUsers ? advertiserUsers.length : 0} utilisateur(s) trouvé(s)`);
      if (advertiserUsers && advertiserUsers.length > 0) {
        advertiserUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Nom: ${user.name || 'N/A'}`);
        });
      }
    }
    console.log('');

    // 3. Rechercher spécifiquement ogincema@gmail.com
    console.log('3️⃣ Recherche de ogincema@gmail.com:');
    const { data: publisherUsers, error: publisherError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ogincema@gmail.com');
    
    if (publisherError) {
      console.log(`❌ Erreur: ${publisherError.message}`);
    } else {
      console.log(`✅ ${publisherUsers ? publisherUsers.length : 0} utilisateur(s) trouvé(s)`);
      if (publisherUsers && publisherUsers.length > 0) {
        publisherUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Nom: ${user.name || 'N/A'}`);
        });
      }
    }
    console.log('');

    // 4. Rechercher des utilisateurs avec des emails similaires
    console.log('4️⃣ Recherche d\'emails similaires:');
    
    // Rechercher des emails contenant "abderrahim"
    const { data: similarAdvertiser, error: similarAdvertiserError } = await supabase
      .from('users')
      .select('id, email, name')
      .ilike('email', '%abderrahim%');
    
    if (similarAdvertiserError) {
      console.log(`❌ Erreur recherche similaire annonceur: ${similarAdvertiserError.message}`);
    } else {
      console.log(`✅ Emails contenant "abderrahim": ${similarAdvertiser ? similarAdvertiser.length : 0}`);
      if (similarAdvertiser && similarAdvertiser.length > 0) {
        similarAdvertiser.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'Sans nom'}) - ${user.id}`);
        });
      }
    }
    console.log('');

    // Rechercher des emails contenant "ogincema"
    const { data: similarPublisher, error: similarPublisherError } = await supabase
      .from('users')
      .select('id, email, name')
      .ilike('email', '%ogincema%');
    
    if (similarPublisherError) {
      console.log(`❌ Erreur recherche similaire éditeur: ${similarPublisherError.message}`);
    } else {
      console.log(`✅ Emails contenant "ogincema": ${similarPublisher ? similarPublisher.length : 0}`);
      if (similarPublisher && similarPublisher.length > 0) {
        similarPublisher.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'Sans nom'}) - ${user.id}`);
        });
      }
    }
    console.log('');

    // 5. Afficher les 5 derniers utilisateurs créés
    console.log('5️⃣ 5 derniers utilisateurs créés:');
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentUsersError) {
      console.log(`❌ Erreur: ${recentUsersError.message}`);
    } else {
      recentUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'Sans nom'}) - Créé: ${user.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkUsers();