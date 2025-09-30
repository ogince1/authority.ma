import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLinkListingsStructure() {
  console.log('🔍 Vérification de la structure de la table link_listings\n');

  try {
    // 1. Récupérer un exemple de link_listing pour voir la structure
    console.log('1️⃣ Structure d\'un link_listing existant:');
    const { data: existingListing, error: existingError } = await supabase
      .from('link_listings')
      .select('*')
      .limit(1)
      .single();
    
    if (existingError) {
      console.log(`❌ Erreur: ${existingError.message}`);
    } else {
      console.log('✅ Link_listing trouvé:');
      console.log('📋 Colonnes disponibles:', Object.keys(existingListing));
      console.log('📋 Valeurs:', existingListing);
    }
    console.log('');

    // 2. Essayer de créer un link_listing minimal
    console.log('2️⃣ Test de création d\'un link_listing minimal...');
    
    // D'abord, récupérer un website existant
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id, user_id')
      .limit(1)
      .single();
    
    if (websiteError) {
      console.log(`❌ Erreur récupération website: ${websiteError.message}`);
      return;
    }
    
    console.log('✅ Website trouvé:', website);
    
    // Essayer de créer un link_listing avec les colonnes minimales
    const { data: testListing, error: testError } = await supabase
      .from('link_listings')
      .insert({
        website_id: website.id,
        user_id: website.user_id,
        title: 'Test Link Listing',
        description: 'Test description',
        price: 50,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (testError) {
      console.log(`❌ Erreur création test: ${testError.message}`);
    } else {
      console.log('✅ Link_listing de test créé:', testListing);
      
      // Nettoyer le test
      await supabase
        .from('link_listings')
        .delete()
        .eq('id', testListing.id);
      console.log('🧹 Test nettoyé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkLinkListingsStructure();
