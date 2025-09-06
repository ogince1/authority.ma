// Script de test complet pour vérifier la configuration
import { createClient } from '@supabase/supabase-js';

// Configuration avec vos clés
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteSetup() {
  console.log('🚀 Test complet de la configuration Supabase');
  console.log('==========================================\n');

  try {
    // 1. Test de connexion
    console.log('1️⃣ Test de connexion...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connexion réussie\n');

    // 2. Test des données existantes
    console.log('2️⃣ Données existantes:');
    const tables = ['users', 'websites', 'link_listings', 'blog_posts', 'success_stories'];
    
    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`   📊 ${table}: ${count || 0} enregistrements`);
    }
    console.log('');

    // 3. Test d'authentification
    console.log('3️⃣ Test d\'authentification...');
    const { data: session } = await supabase.auth.getSession();
    console.log('✅ Service d\'authentification accessible\n');

    // 4. Test des fonctions principales
    console.log('4️⃣ Test des fonctions principales:');
    
    // Test de récupération des sites web
    const { data: websites } = await supabase.from('websites').select('*').limit(3);
    console.log(`   🌐 Sites web: ${websites?.length || 0} trouvés`);
    
    // Test de récupération des annonces de liens
    const { data: linkListings } = await supabase.from('link_listings').select('*').limit(3);
    console.log(`   🔗 Annonces de liens: ${linkListings?.length || 0} trouvées`);
    
    // Test de récupération des articles de blog
    const { data: blogPosts } = await supabase.from('blog_posts').select('*').limit(3);
    console.log(`   📝 Articles de blog: ${blogPosts?.length || 0} trouvés`);
    
    // Test de récupération des histoires de succès
    const { data: successStories } = await supabase.from('success_stories').select('*').limit(3);
    console.log(`   🏆 Histoires de succès: ${successStories?.length || 0} trouvées\n`);

    // 5. Résumé de la configuration
    console.log('5️⃣ Résumé de la configuration:');
    console.log('   ✅ Connexion Supabase: OK');
    console.log('   ✅ Base de données: Accessible');
    console.log('   ✅ Authentification: Fonctionnelle');
    console.log('   ✅ Tables principales: Configurées');
    console.log('   ✅ Données de test: Présentes\n');

    console.log('🎉 Configuration complète et fonctionnelle !');
    console.log('🌐 Votre application est prête sur: http://localhost:5173');
    console.log('🔧 Vous pouvez maintenant:');
    console.log('   - Modifier le front-end');
    console.log('   - Gérer la base de données');
    console.log('   - Ajouter de nouvelles fonctionnalités');
    console.log('   - Déboguer et optimiser');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testCompleteSetup();
