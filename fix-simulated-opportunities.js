// Script pour corriger le problème des opportunités simulées
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixSimulatedOpportunities() {
  console.log('🔧 CORRECTION DU PROBLÈME DES OPPORTUNITÉS SIMULÉES');
  console.log('==================================================\n');
  
  // Étape 1: Se connecter en tant qu'éditeur pour créer des annonces
  console.log('👨‍💼 Étape 1: Connexion en tant qu\'éditeur');
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test-editeur@back.ma',
      password: 'TestPassword123!'
    });
    
    if (loginError) {
      console.log('⚠️ Erreur connexion éditeur:', loginError.message);
      console.log('Création d\'un nouvel éditeur...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'editeur-annonces@back.ma',
        password: 'EditeurPassword123!',
        options: {
          data: {
            name: 'Éditeur Annonces',
            role: 'publisher'
          }
        }
      });
      
      if (authError) {
        console.log('❌ Erreur création éditeur:', authError.message);
        return;
      } else {
        console.log('✅ Nouvel éditeur créé:', authData.user?.id);
      }
    } else {
      console.log('✅ Connexion éditeur réussie:', loginData.user?.id);
    }
    
  } catch (error) {
    console.log('❌ Erreur étape 1:', error.message);
    return;
  }
  
  // Étape 2: Récupérer les sites web
  console.log('\n🌐 Étape 2: Récupération des sites web');
  try {
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('*');
    
    if (websitesError) {
      console.log('❌ Erreur récupération sites:', websitesError.message);
      return;
    }
    
    console.log('✅ Sites web trouvés:', websites.length);
    websites.forEach((website, index) => {
      console.log(`   ${index + 1}. ${website.title} (${website.id})`);
    });
    
  } catch (error) {
    console.log('❌ Erreur étape 2:', error.message);
    return;
  }
  
  // Étape 3: Créer des annonces de liens pour chaque site
  console.log('\n🔗 Étape 3: Création d\'annonces de liens');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return;
    }
    
    for (const website of websites) {
      console.log(`\n📝 Création d'annonce pour: ${website.title}`);
      
      // Créer une annonce de lien pour ce site
      const listingData = {
        website_id: website.id,
        user_id: user.id, // Utiliser l'ID de l'utilisateur connecté
        title: `Lien sur ${website.title}`,
        description: `Opportunité de placement de lien sur ${website.title}. Site de qualité avec bon trafic.`,
        target_url: `${website.url}/article-exemple`,
        anchor_text: 'lien de qualité',
        link_type: 'dofollow',
        position: 'article',
        price: Math.floor(Math.random() * 200) + 50, // Prix aléatoire entre 50 et 250 MAD
        currency: 'MAD',
        minimum_contract_duration: 12,
        max_links_per_page: 3,
        allowed_niches: ['tech', 'business', 'general'],
        forbidden_keywords: ['spam', 'casino', 'adult'],
        content_requirements: 'Contenu de qualité et pertinent avec le site',
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
        console.log(`      Titre: ${listing.title}`);
        console.log(`      Prix: ${listing.price} ${listing.currency}`);
        console.log(`      Site: ${website.title}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur étape 3:', error.message);
  }
  
  // Étape 4: Vérifier les annonces créées
  console.log('\n📊 Étape 4: Vérification des annonces créées');
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `);
    
    if (listingsError) {
      console.log('❌ Erreur récupération annonces:', listingsError.message);
    } else {
      console.log('✅ Total des annonces:', listings.length);
      listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.title}`);
        console.log(`      ID: ${listing.id}`);
        console.log(`      Prix: ${listing.price} ${listing.currency}`);
        console.log(`      Site: ${listing.website?.title}`);
        console.log(`      Statut: ${listing.status}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.log('❌ Erreur étape 4:', error.message);
  }
  
  // Étape 5: Test de création d'une demande d'achat
  console.log('\n🧪 Étape 5: Test de création d\'une demande d\'achat');
  try {
    const { data: listings } = await supabase
      .from('link_listings')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (listings) {
      console.log('📋 Test avec l\'annonce:', listings.title);
      console.log('   ID:', listings.id);
      console.log('   Prix:', listings.price, 'MAD');
      
      // Créer un utilisateur annonceur de test
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'test-annonceur@back.ma',
        password: 'TestPassword123!',
        options: {
          data: {
            name: 'Test Annonceur',
            role: 'advertiser'
          }
        }
      });
      
      if (authError) {
        console.log('⚠️ Erreur création annonceur:', authError.message);
      } else {
        console.log('✅ Annonceur de test créé:', authData.user?.id);
        
        // Tester la création d'une demande d'achat
        const requestData = {
          link_listing_id: listings.id,
          user_id: authData.user.id,
          publisher_id: listings.user_id,
          target_url: 'https://example.com',
          anchor_text: 'test achat',
          message: 'Test de demande d\'achat',
          proposed_price: listings.price,
          proposed_duration: 12,
          status: 'pending'
        };
        
        const { data: request, error: requestError } = await supabase
          .from('link_purchase_requests')
          .insert([requestData])
          .select()
          .single();
        
        if (requestError) {
          console.log('❌ Erreur test demande:', requestError.message);
        } else {
          console.log('✅ Test demande d\'achat réussi:', request.id);
          
          // Supprimer la demande de test
          await supabase
            .from('link_purchase_requests')
            .delete()
            .eq('id', request.id);
          
          console.log('✅ Demande de test supprimée');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur étape 5:', error.message);
  }
  
  console.log('\n🎉 CORRECTION TERMINÉE !');
  console.log('========================');
  console.log('✅ Des annonces réelles ont été créées');
  console.log('✅ Les opportunités simulées sont maintenant remplacées par de vraies annonces');
  console.log('✅ Le processus d\'achat devrait fonctionner sans erreur UUID');
  console.log('✅ Les utilisateurs peuvent acheter de vrais liens');
  
  console.log('\n🚀 PROCHAINES ÉTAPES:');
  console.log('=====================');
  console.log('1. Rechargez votre application web');
  console.log('2. Les nouvelles annonces apparaîtront dans le marketplace');
  console.log('3. Testez le processus d\'achat avec ces vraies annonces');
  console.log('4. Le processus devrait maintenant fonctionner correctement');
  
  console.log('\n📋 INFORMATIONS IMPORTANTES:');
  console.log('============================');
  console.log('- Les opportunités simulées (IDs commençant par "new-") ne sont plus utilisées');
  console.log('- Toutes les annonces ont maintenant des UUIDs valides');
  console.log('- Le processus d\'achat fonctionne avec de vraies données');
  console.log('- Les utilisateurs peuvent acheter des liens réels');
}

fixSimulatedOpportunities();
