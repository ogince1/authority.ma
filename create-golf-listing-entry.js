import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 CRÉATION - Entrée link_listings pour golftradition.fr');
console.log('='.repeat(80));

async function createGolfListingEntry() {
  try {
    // Récupérer golftradition.fr
    const { data: golfSite } = await supabase
      .from('websites')
      .select('*')
      .ilike('url', '%golftradition%')
      .single();

    console.log('\n🏌️ Site golftradition.fr:');
    console.log(`   ID: ${golfSite.id}`);
    console.log(`   Titre: ${golfSite.title}`);
    console.log(`   user_id: ${golfSite.user_id}`);
    console.log(`   Catégorie: ${golfSite.category}`);
    console.log(`   Prix nouveau article: ${golfSite.new_article_price} MAD`);

    // Créer une entrée dans link_listings avec le MÊME ID que le website
    console.log('\n🔨 Création de l\'entrée dans link_listings...');
    console.log('   Utilisation du MÊME ID que le website (comme les autres sites)');

    const listingData = {
      id: golfSite.id,  // ← MÊME ID que le website !
      website_id: golfSite.id,
      user_id: golfSite.user_id,  // MAXIME
      title: `${golfSite.title} (Nouveau)`,
      description: 'Nouvel article personnalisé pour votre lien',
      target_url: golfSite.url,
      anchor_text: 'Lien personnalisé',
      link_type: 'dofollow',
      position: 'content',
      price: golfSite.new_article_price,
      currency: 'MAD',
      minimum_contract_duration: 1,
      status: 'inactive', // Comme les autres sites
      category: golfSite.category,
      images: [],
      tags: ['nouveau-article'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('\nDonnées à insérer:');
    console.log(`   id: ${listingData.id} (= website_id)`);
    console.log(`   title: ${listingData.title}`);
    console.log(`   user_id: ${listingData.user_id}`);
    console.log(`   status: ${listingData.status}`);

    const { data: createdListing, error: listingError } = await supabase
      .from('link_listings')
      .insert([listingData])
      .select()
      .single();

    if (listingError) {
      console.error('\n❌ Erreur:', listingError.message);
      console.error('   Code:', listingError.code);
      return;
    }

    console.log('\n✅ Entrée créée avec succès !');
    console.log(`   ID créé: ${createdListing.id}`);
    console.log(`   Titre: ${createdListing.title}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    
    const { data: check } = await supabase
      .from('link_listings')
      .select('id, title')
      .eq('id', golfSite.id)
      .single();

    if (check) {
      console.log(`   ✅ L'ID ${golfSite.id} existe maintenant dans link_listings`);
      console.log(`   ✅ golftradition.fr devrait fonctionner maintenant !`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ CORRECTION APPLIQUÉE');
    console.log('='.repeat(80));
    console.log('\n💡 TESTEZ MAINTENANT:');
    console.log('1. Rafraîchissez votre page panier');
    console.log('2. Ajoutez golftradition.fr au panier');
    console.log('3. Validez la commande');
    console.log('4. ✅ Ça devrait fonctionner !');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

createGolfListingEntry();

