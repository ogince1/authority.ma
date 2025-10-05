import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 TEST - Comparaison comptes qui fonctionnent vs golftradition.fr');
console.log('='.repeat(80));

async function testWorkingFlow() {
  try {
    // 1. Analyser l'éditeur ogincema@gmail.com (fonctionne)
    console.log('\n👤 1. ÉDITEUR QUI FONCTIONNE: ogincema@gmail.com');
    console.log('-'.repeat(80));
    
    const { data: editor, error: editorError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (editorError || !editor) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log(`✅ Éditeur: ${editor.name}`);
    console.log(`   ID: ${editor.id}`);
    console.log(`   Rôle: ${editor.role}`);

    // Récupérer ses sites
    const { data: editorWebsites, error: websitesError } = await supabase
      .from('websites')
      .select('id, title, url, status, new_article_price, is_new_article, user_id')
      .eq('user_id', editor.id);

    console.log(`\n🌐 Sites de ogincema@gmail.com: ${editorWebsites?.length || 0}`);
    editorWebsites?.forEach((site, index) => {
      console.log(`\n   ${index + 1}. ${site.title}`);
      console.log(`      ID: ${site.id}`);
      console.log(`      URL: ${site.url}`);
      console.log(`      Status: ${site.status}`);
      console.log(`      Prix nouvel article: ${site.new_article_price} MAD`);
      console.log(`      Accepte nouveaux articles: ${site.is_new_article ? 'Oui' : 'Non'}`);
      console.log(`      user_id: ${site.user_id}`);
      console.log(`      ✅ user_id correspond au propriétaire: ${site.user_id === editor.id ? 'OUI' : 'NON'}`);
    });

    // Récupérer ses annonces de liens (articles existants)
    const { data: editorListings, error: listingsError } = await supabase
      .from('link_listings')
      .select('id, title, status, price, website_id, user_id')
      .eq('user_id', editor.id);

    console.log(`\n🔗 Annonces de liens (articles existants): ${editorListings?.length || 0}`);
    editorListings?.forEach((listing, index) => {
      console.log(`\n   ${index + 1}. ${listing.title}`);
      console.log(`      ID: ${listing.id}`);
      console.log(`      Status: ${listing.status}`);
      console.log(`      Prix: ${listing.price} MAD`);
      console.log(`      user_id: ${listing.user_id}`);
      console.log(`      ✅ user_id correspond: ${listing.user_id === editor.id ? 'OUI' : 'NON'}`);
    });

    // 2. Analyser golftradition.fr (ne fonctionne pas)
    console.log('\n\n🏌️ 2. SITE QUI NE FONCTIONNE PAS: golftradition.fr');
    console.log('-'.repeat(80));

    const { data: golfWebsite, error: golfWebError } = await supabase
      .from('websites')
      .select('id, title, url, status, new_article_price, is_new_article, user_id')
      .ilike('url', '%golftradition%')
      .single();

    if (golfWebError || !golfWebsite) {
      console.log('❌ Site golftradition.fr non trouvé');
      return;
    }

    console.log(`✅ Site: ${golfWebsite.title}`);
    console.log(`   ID: ${golfWebsite.id}`);
    console.log(`   URL: ${golfWebsite.url}`);
    console.log(`   Status: ${golfWebsite.status}`);
    console.log(`   Prix nouvel article: ${golfWebsite.new_article_price} MAD`);
    console.log(`   Accepte nouveaux articles: ${golfWebsite.is_new_article ? 'Oui' : 'Non'}`);
    console.log(`   user_id: ${golfWebsite.user_id}`);

    // Récupérer le propriétaire
    const { data: golfOwner, error: ownerError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', golfWebsite.user_id)
      .single();

    if (golfOwner) {
      console.log(`\n   👤 Propriétaire: ${golfOwner.name} (${golfOwner.email})`);
      console.log(`      Rôle: ${golfOwner.role}`);
    }

    // Ses annonces
    const { data: golfListings, error: golfListError } = await supabase
      .from('link_listings')
      .select('id, title, status, price, website_id, user_id')
      .eq('website_id', golfWebsite.id);

    console.log(`\n🔗 Annonces pour golftradition.fr: ${golfListings?.length || 0}`);
    golfListings?.forEach((listing, index) => {
      console.log(`\n   ${index + 1}. ${listing.title}`);
      console.log(`      ID: ${listing.id}`);
      console.log(`      Status: ${listing.status}`);
      console.log(`      Prix: ${listing.price} MAD`);
      console.log(`      user_id listing: ${listing.user_id}`);
      console.log(`      user_id site: ${golfWebsite.user_id}`);
      console.log(`      ⚠️ Incohérence: ${listing.user_id !== golfWebsite.user_id ? 'OUI - PROBLÈME ICI !' : 'NON'}`);
    });

    // 3. COMPARAISON
    console.log('\n\n📊 3. COMPARAISON DES STRUCTURES');
    console.log('='.repeat(80));

    console.log('\n✅ SITES QUI FONCTIONNENT (ogincema@gmail.com):');
    if (editorWebsites && editorWebsites.length > 0) {
      const workingSite = editorWebsites[0];
      console.log(`   Site: ${workingSite.title}`);
      console.log(`   └─ user_id site: ${workingSite.user_id}`);
      console.log(`   └─ Propriétaire: ${editor.id}`);
      console.log(`   └─ ✅ Match: ${workingSite.user_id === editor.id}`);
      
      // Vérifier les annonces de ce site
      const workingListings = editorListings?.filter(l => l.website_id === workingSite.id);
      if (workingListings && workingListings.length > 0) {
        console.log(`\n   Annonces du site:`);
        workingListings.forEach((listing) => {
          console.log(`   └─ ${listing.title}`);
          console.log(`      └─ user_id annonce: ${listing.user_id}`);
          console.log(`      └─ ✅ Match: ${listing.user_id === editor.id}`);
        });
      }
    }

    console.log('\n\n❌ SITE QUI NE FONCTIONNE PAS (golftradition.fr):');
    console.log(`   Site: ${golfWebsite.title}`);
    console.log(`   └─ user_id site: ${golfWebsite.user_id}`);
    console.log(`   └─ Propriétaire: ${golfOwner?.name || 'Inconnu'}`);
    console.log(`   └─ ✅ Match: ${golfWebsite.user_id === golfOwner?.id}`);
    
    if (golfListings && golfListings.length > 0) {
      console.log(`\n   Annonces du site:`);
      golfListings.forEach((listing) => {
        console.log(`   └─ ${listing.title}`);
        console.log(`      └─ user_id annonce: ${listing.user_id}`);
        console.log(`      └─ Status: ${listing.status}`);
        console.log(`      └─ ❌ Match avec site: ${listing.user_id === golfWebsite.user_id ? 'OUI' : 'NON - PROBLÈME !'}`);
        console.log(`      └─ ❌ Status: ${listing.status === 'active' ? 'Actif' : 'INACTIF - PROBLÈME !'}`);
      });
    }

    // 4. DIAGNOSTIC FINAL
    console.log('\n\n🎯 4. DIAGNOSTIC FINAL');
    console.log('='.repeat(80));

    console.log('\n💡 POURQUOI golftradition.fr NE FONCTIONNE PAS:');
    console.log('\nSCÉNARIO POUR NOUVEAU ARTICLE (isVirtual=true):');
    console.log('   1. L\'utilisateur commande golftradition.fr (nouveau article)');
    console.log('   2. Système devrait utiliser website_id directement');
    console.log('   3. MAIS il y a une annonce dans link_listings qui interfère:');
    
    if (golfListings && golfListings.length > 0) {
      const problematicListing = golfListings[0];
      console.log(`\n   ⚠️ Annonce problématique:`);
      console.log(`      - Titre: ${problematicListing.title}`);
      console.log(`      - Status: ${problematicListing.status} ${problematicListing.status === 'inactive' ? '← INACTIF !' : ''}`);
      console.log(`      - user_id: ${problematicListing.user_id}`);
      console.log(`      - user_id site: ${golfWebsite.user_id}`);
      
      if (problematicListing.user_id !== golfWebsite.user_id) {
        console.log(`\n   ❌ PROBLÈME 1: user_id de l'annonce ≠ user_id du site`);
        console.log(`      Cette annonce appartient à un autre utilisateur !`);
      }
      
      if (problematicListing.status === 'inactive') {
        console.log(`\n   ❌ PROBLÈME 2: L'annonce est INACTIVE`);
        console.log(`      Elle ne devrait pas bloquer les nouveaux articles !`);
      }
    }

    console.log('\n\n📋 SOLUTION PROPOSÉE:');
    console.log('-'.repeat(80));
    console.log('Option 1: Supprimer l\'annonce problématique (elle bloque le système)');
    console.log('Option 2: Activer l\'annonce ET corriger son user_id');
    console.log('Option 3: Modifier le code pour ignorer les annonces inactives');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

testWorkingFlow();

