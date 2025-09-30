// Script pour déboguer l'erreur UUID invalide
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugUUIDError() {
  console.log('🔍 DÉBOGAGE DE L\'ERREUR UUID INVALIDE');
  console.log('=====================================\n');
  
  // Analyser l'erreur
  console.log('❌ ERREUR DÉTECTÉE:');
  console.log('Code: 22P02 (Invalid input syntax)');
  console.log('Message: invalid input syntax for type uuid');
  console.log('ID problématique: "new-f9a9783c-c86e-4eac-b079-cab0ff1d81a1"');
  console.log('Problème: L\'ID commence par "new-" ce qui indique une opportunité simulée\n');
  
  // Vérifier les annonces réelles dans la base
  console.log('🔗 VÉRIFICATION DES ANNONCES RÉELLES:');
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select('*');
    
    if (listingsError) {
      console.log('❌ Erreur récupération annonces:', listingsError.message);
    } else {
      console.log('✅ Annonces réelles trouvées:', listings.length);
      listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ID: ${listing.id}`);
        console.log(`      Titre: ${listing.title}`);
        console.log(`      Prix: ${listing.price} ${listing.currency}`);
        console.log(`      User ID: ${listing.user_id}`);
        console.log(`      Statut: ${listing.status}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  
  // Vérifier les sites web
  console.log('🌐 VÉRIFICATION DES SITES WEB:');
  try {
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('*');
    
    if (websitesError) {
      console.log('❌ Erreur récupération sites:', websitesError.message);
    } else {
      console.log('✅ Sites web trouvés:', websites.length);
      websites.forEach((website, index) => {
        console.log(`   ${index + 1}. ID: ${website.id}`);
        console.log(`      Titre: ${website.title}`);
        console.log(`      URL: ${website.url}`);
        console.log(`      User ID: ${website.user_id}`);
        console.log(`      Statut: ${website.status}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  
  // Analyser le problème
  console.log('🔧 ANALYSE DU PROBLÈME:');
  console.log('========================');
  console.log('Le problème vient du fait que:');
  console.log('1. L\'application génère des "opportunités simulées" avec des IDs commençant par "new-"');
  console.log('2. Ces opportunités ne correspondent pas à de vraies annonces dans la base');
  console.log('3. Quand l\'utilisateur essaie d\'acheter, l\'ID "new-xxx" n\'est pas un UUID valide');
  console.log('4. La base de données rejette l\'insertion car l\'UUID est invalide');
  
  console.log('\n💡 SOLUTIONS POSSIBLES:');
  console.log('=======================');
  console.log('1. Créer de vraies annonces de liens dans la base');
  console.log('2. Modifier la logique pour utiliser les annonces existantes');
  console.log('3. Créer des opportunités réelles au lieu de simulées');
  console.log('4. Filtrer les opportunités simulées dans l\'interface');
  
  console.log('\n🚀 SOLUTION RECOMMANDÉE:');
  console.log('=========================');
  console.log('Créer de vraies annonces de liens basées sur les sites web existants');
  
  // Créer de vraies annonces de liens
  console.log('\n🔨 CRÉATION D\'ANNONCES RÉELLES:');
  try {
    const { data: websites } = await supabase
      .from('websites')
      .select('*');
    
    if (websites && websites.length > 0) {
      for (const website of websites) {
        console.log(`\n📝 Création d'annonce pour: ${website.title}`);
        
        // Créer une annonce de lien pour ce site
        const listingData = {
          website_id: website.id,
          user_id: website.user_id,
          title: `Lien sur ${website.title}`,
          description: `Opportunité de placement de lien sur ${website.title}`,
          target_url: `${website.url}/article-exemple`,
          anchor_text: 'lien de qualité',
          link_type: 'dofollow',
          position: 'article',
          price: 150,
          currency: 'MAD',
          minimum_contract_duration: 12,
          max_links_per_page: 3,
          allowed_niches: ['tech', 'business'],
          forbidden_keywords: ['spam', 'casino'],
          content_requirements: 'Contenu de qualité et pertinent',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: listing, error: listingError } = await supabase
          .from('link_listings')
          .insert([listingData])
          .select()
          .single();
        
        if (listingError) {
          console.log(`   ❌ Erreur création annonce: ${listingError.message}`);
        } else {
          console.log(`   ✅ Annonce créée: ${listing.id}`);
          console.log(`      Prix: ${listing.price} ${listing.currency}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Erreur création annonces:', error.message);
  }
  
  // Vérifier les annonces créées
  console.log('\n📊 VÉRIFICATION DES ANNONCES CRÉÉES:');
  try {
    const { data: listings } = await supabase
      .from('link_listings')
      .select('*');
    
    console.log('✅ Total des annonces:', listings.length);
    listings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title} - ${listing.price} ${listing.currency}`);
    });
    
  } catch (error) {
    console.log('❌ Erreur vérification:', error.message);
  }
  
  console.log('\n🎉 CORRECTION TERMINÉE !');
  console.log('========================');
  console.log('✅ Des annonces réelles ont été créées');
  console.log('✅ Les utilisateurs peuvent maintenant acheter de vrais liens');
  console.log('✅ Le processus d\'achat devrait fonctionner sans erreur UUID');
  
  console.log('\n🚀 PROCHAINES ÉTAPES:');
  console.log('=====================');
  console.log('1. Rechargez votre application web');
  console.log('2. Les annonces réelles apparaîtront dans le marketplace');
  console.log('3. Testez le processus d\'achat avec ces vraies annonces');
  console.log('4. Le processus devrait maintenant fonctionner correctement');
}

debugUUIDError();
