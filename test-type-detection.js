import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTypeDetection() {
  console.log('🧪 Test de la détection du type d\'article après correction\n');

  try {
    // 1. Récupérer les demandes avec content_option
    console.log('1️⃣ Demandes avec content_option:');
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        anchor_text,
        content_option,
        status,
        extended_status,
        created_at,
        link_listing:link_listings(
          id,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (requestsError) {
      console.log(`❌ Erreur: ${requestsError.message}`);
      return;
    }
    
    console.log(`✅ ${requests ? requests.length : 0} demandes trouvées\n`);
    
    if (requests && requests.length > 0) {
      requests.forEach((request, index) => {
        console.log(`${index + 1}. Demande ID: ${request.id.slice(0, 8)}...`);
        console.log(`   - Texte d'ancrage: ${request.anchor_text}`);
        console.log(`   - Option de contenu: ${request.content_option || 'N/A'}`);
        console.log(`   - Statut: ${request.status}/${request.extended_status}`);
        console.log(`   - Titre du listing: ${request.link_listing?.title || 'N/A'}`);
        
        // Nouvelle logique de détection
        let detectedType;
        if (request.content_option === 'platform' || request.content_option === 'custom') {
          detectedType = '✅ Nouvel article à créer';
        } else if (request.link_listing?.title) {
          detectedType = '❌ Article existant';
        } else {
          detectedType = '❓ Type inconnu';
        }
        
        console.log(`   - Détection (NOUVELLE): ${detectedType}`);
        console.log('');
      });
    }

    // 2. Tester spécifiquement les demandes avec content_option = 'platform'
    console.log('2️⃣ Test des demandes avec rédaction par la plateforme:');
    const { data: platformRequests, error: platformError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        anchor_text,
        content_option,
        link_listing:link_listings(
          title
        )
      `)
      .eq('content_option', 'platform')
      .limit(3);
    
    if (platformError) {
      console.log(`❌ Erreur: ${platformError.message}`);
    } else {
      console.log(`✅ ${platformRequests ? platformRequests.length : 0} demandes avec rédaction par la plateforme`);
      if (platformRequests && platformRequests.length > 0) {
        platformRequests.forEach((request, index) => {
          console.log(`   ${index + 1}. ID: ${request.id.slice(0, 8)}...`);
          console.log(`      Titre: ${request.link_listing?.title || 'N/A'}`);
          console.log(`      Content Option: ${request.content_option}`);
          console.log(`      Détection: ${request.content_option === 'platform' ? '✅ Nouvel article' : '❌ Article existant'}`);
        });
      }
    }
    console.log('');

    // 3. Tester les demandes avec content_option = 'custom'
    console.log('3️⃣ Test des demandes avec contenu personnalisé:');
    const { data: customRequests, error: customError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        anchor_text,
        content_option,
        link_listing:link_listings(
          title
        )
      `)
      .eq('content_option', 'custom')
      .limit(3);
    
    if (customError) {
      console.log(`❌ Erreur: ${customError.message}`);
    } else {
      console.log(`✅ ${customRequests ? customRequests.length : 0} demandes avec contenu personnalisé`);
      if (customRequests && customRequests.length > 0) {
        customRequests.forEach((request, index) => {
          console.log(`   ${index + 1}. ID: ${request.id.slice(0, 8)}...`);
          console.log(`      Titre: ${request.link_listing?.title || 'N/A'}`);
          console.log(`      Content Option: ${request.content_option}`);
          console.log(`      Détection: ${request.content_option === 'custom' ? '✅ Nouvel article' : '❌ Article existant'}`);
        });
      }
    }
    console.log('');

    // 4. Tester les demandes sans content_option (articles existants)
    console.log('4️⃣ Test des demandes sans content_option (articles existants):');
    const { data: existingRequests, error: existingError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        anchor_text,
        content_option,
        link_listing:link_listings(
          title
        )
      `)
      .is('content_option', null)
      .limit(3);
    
    if (existingError) {
      console.log(`❌ Erreur: ${existingError.message}`);
    } else {
      console.log(`✅ ${existingRequests ? existingRequests.length : 0} demandes sans content_option`);
      if (existingRequests && existingRequests.length > 0) {
        existingRequests.forEach((request, index) => {
          console.log(`   ${index + 1}. ID: ${request.id.slice(0, 8)}...`);
          console.log(`      Titre: ${request.link_listing?.title || 'N/A'}`);
          console.log(`      Content Option: ${request.content_option || 'N/A'}`);
          console.log(`      Détection: ${!request.content_option ? '❌ Article existant' : '✅ Nouvel article'}`);
        });
      }
    }

    console.log('\n🎯 RÉSUMÉ DE LA CORRECTION:');
    console.log('✅ La détection se base maintenant sur content_option au lieu du titre');
    console.log('✅ content_option = "platform" → Nouvel article à créer');
    console.log('✅ content_option = "custom" → Nouvel article à créer');
    console.log('✅ content_option = null → Article existant');
    console.log('\n💡 Cette correction devrait résoudre le problème d\'affichage !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testTypeDetection();
