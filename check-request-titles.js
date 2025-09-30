import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRequestTitles() {
  console.log('🔍 Vérification des titres des demandes d\'achat\n');

  try {
    // 1. Récupérer les demandes récentes avec leurs link_listings
    console.log('1️⃣ Demandes récentes avec leurs link_listings:');
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
          title,
          description
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
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
        console.log(`   - Détection type: ${request.link_listing?.title?.startsWith('Nouvel article') ? '✅ Nouvel article' : '❌ Article existant'}`);
        console.log(`   - Créé: ${request.created_at}`);
        console.log('');
      });
    }

    // 2. Rechercher spécifiquement les demandes avec content_option = 'platform'
    console.log('2️⃣ Demandes avec rédaction par la plateforme:');
    const { data: platformRequests, error: platformError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        anchor_text,
        content_option,
        link_listing:link_listings(
          id,
          title
        )
      `)
      .eq('content_option', 'platform')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (platformError) {
      console.log(`❌ Erreur: ${platformError.message}`);
    } else {
      console.log(`✅ ${platformRequests ? platformRequests.length : 0} demandes avec rédaction par la plateforme`);
      if (platformRequests && platformRequests.length > 0) {
        platformRequests.forEach((request, index) => {
          console.log(`   ${index + 1}. ID: ${request.id.slice(0, 8)}...`);
          console.log(`      Titre: ${request.link_listing?.title || 'N/A'}`);
          console.log(`      Détection: ${request.link_listing?.title?.startsWith('Nouvel article') ? '✅ Nouvel article' : '❌ Article existant'}`);
        });
      }
    }
    console.log('');

    // 3. Vérifier les link_listings avec des titres problématiques
    console.log('3️⃣ Link_listings avec titres qui ne commencent pas par "Nouvel article":');
    const { data: problematicListings, error: listingError } = await supabase
      .from('link_listings')
      .select('id, title, created_at')
      .not('title', 'like', 'Nouvel article%')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (listingError) {
      console.log(`❌ Erreur: ${listingError.message}`);
    } else {
      console.log(`✅ ${problematicListings ? problematicListings.length : 0} listings avec titres problématiques`);
      if (problematicListings && problematicListings.length > 0) {
        problematicListings.forEach((listing, index) => {
          console.log(`   ${index + 1}. ID: ${listing.id.slice(0, 8)}...`);
          console.log(`      Titre: "${listing.title}"`);
          console.log(`      Créé: ${listing.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkRequestTitles();
