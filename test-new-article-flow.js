// Script pour tester l'ajout d'un nouveau article au panier et le processus de paiement
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testNewArticleFlow() {
  console.log('🧪 Test complet d\'ajout d\'un nouveau article\n');

  try {
    // 1. Se connecter avec le compte annonceur
    console.log('🔐 1. Connexion avec abderrahimmolatefpro@gmail.com...');
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: 'abderrahimmolatefpro@gmail.com',
      password: 'password123'
    });

    if (authError) {
      throw new Error(`Erreur connexion: ${authError.message}`);
    }

    console.log(`✅ Connexion réussie: ${authData.user.email}`);
    console.log(`   - ID: ${authData.user.id}`);

    // 2. Récupérer un website existant pour créer un nouveau article
    console.log(`\n📊 2. Récupération d'un website pour nouveau article...`);
    
    const { data: websites, error: websitesError } = await supabaseAdmin
      .from('websites')
      .select('id, url, title, description, category')
      .limit(5);

    if (websitesError) {
      throw new Error(`Erreur récupération websites: ${websitesError.message}`);
    }

    if (websites.length === 0) {
      throw new Error('Aucun website trouvé');
    }

    const testWebsite = websites[0];
    console.log(`✅ Website sélectionné: ${testWebsite.title} (${testWebsite.url})`);
    console.log(`   - ID: ${testWebsite.id}`);
    console.log(`   - Catégorie: ${testWebsite.category}`);

    // 3. Simuler l'ajout d'un nouveau article au panier
    console.log(`\n🛒 3. Simulation d'ajout au panier...`);
    
    const newArticleData = {
      id: testWebsite.id, // Utiliser l'ID du website
      title: `${testWebsite.title} (Nouveau)`,
      description: `Nouveau article sur ${testWebsite.url}`,
      price: 75,
      currency: 'MAD',
      category: testWebsite.category || 'General',
      user_id: 'db521baa-5713-496f-84f2-4a635b9e54a4', // Éditeur par défaut
      isVirtual: true
    };

    console.log(`📝 Données du nouvel article:`);
    console.log(`   - ID: ${newArticleData.id}`);
    console.log(`   - Titre: ${newArticleData.title}`);
    console.log(`   - Prix: ${newArticleData.price} MAD`);
    console.log(`   - Éditeur: ${newArticleData.user_id}`);

    // 4. Vérifier si un link_listing existe déjà pour ce website
    console.log(`\n🔍 4. Vérification de l'existence du listing...`);
    
    const { data: existingListing, error: existingError } = await supabaseClient
      .from('link_listings')
      .select('*')
      .eq('id', testWebsite.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.log(`❌ Erreur vérification listing: ${existingError.message}`);
    } else if (existingListing) {
      console.log(`✅ Listing existant trouvé: ${existingListing.title}`);
      console.log(`   - User ID: ${existingListing.user_id}`);
      console.log(`   - Prix: ${existingListing.price} MAD`);
      console.log(`   - Statut: ${existingListing.status}`);
    } else {
      console.log(`ℹ️ Aucun listing existant, création nécessaire`);
    }

    // 5. Simuler la création du link_listing (si nécessaire)
    console.log(`\n📝 5. Création du link_listing...`);
    
    let listingToUse;
    
    if (existingListing) {
      listingToUse = existingListing;
      console.log(`✅ Utilisation du listing existant: ${listingToUse.id}`);
    } else {
      console.log(`🆕 Création d'un nouveau listing...`);
      
      const { data: newListing, error: listingError } = await supabaseClient
        .from('link_listings')
        .insert([{
          id: testWebsite.id,
          title: newArticleData.title,
          description: newArticleData.description,
          target_url: `${testWebsite.url}/nouveau-article`,
          price: newArticleData.price,
          currency: newArticleData.currency,
          link_type: 'dofollow',
          position: 'content',
          minimum_contract_duration: 1,
          max_links_per_page: 1,
          allowed_niches: [newArticleData.category],
          forbidden_keywords: [],
          content_requirements: '',
          status: 'active',
          user_id: newArticleData.user_id,
          website_id: testWebsite.id,
          anchor_text: 'nouveau article',
          meta_title: newArticleData.title,
          meta_description: newArticleData.description,
          slug: testWebsite.id,
          images: [],
          tags: [newArticleData.category],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (listingError) {
        console.log(`❌ Erreur création listing: ${listingError.message}`);
        throw new Error('Erreur lors de la création du listing');
      }

      console.log(`✅ Listing créé: ${newListing.id}`);
      listingToUse = newListing;
    }

    // 6. Vérifier s'il existe déjà une demande d'achat pour ce lien
    console.log(`\n🔍 6. Vérification des demandes existantes...`);
    
    const { data: existingRequest, error: checkError } = await supabaseClient
      .from('link_purchase_requests')
      .select('id')
      .eq('link_listing_id', listingToUse.id)
      .eq('user_id', authData.user.id)
      .eq('target_url', `${testWebsite.url}/nouveau-article`)
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log(`❌ Erreur vérification demande: ${checkError.message}`);
    } else if (existingRequest) {
      console.log(`⚠️ Demande existante trouvée: ${existingRequest.id}`);
      console.log(`   - Aucune nouvelle demande ne sera créée (évite la duplication)`);
    } else {
      console.log(`✅ Aucune demande existante, création possible`);
    }

    // 7. Créer la demande d'achat (si pas de doublon)
    console.log(`\n💳 7. Création de la demande d'achat...`);
    
    if (existingRequest) {
      console.log(`⏭️ Demande existante, passage à l'étape suivante`);
    } else {
      const purchaseRequestData = {
        link_listing_id: listingToUse.id,
        user_id: authData.user.id,
        publisher_id: listingToUse.user_id,
        target_url: `${testWebsite.url}/nouveau-article`,
        anchor_text: 'nouveau article',
        message: 'Test de demande pour nouveau article',
        proposed_price: listingToUse.price,
        proposed_duration: 1,
        status: 'pending'
      };

      console.log(`📝 Données de la demande:`);
      console.log(`   - Link Listing ID: ${purchaseRequestData.link_listing_id}`);
      console.log(`   - Publisher ID: ${purchaseRequestData.publisher_id}`);
      console.log(`   - Target URL: ${purchaseRequestData.target_url}`);
      console.log(`   - Prix: ${purchaseRequestData.proposed_price} MAD`);

      const { data: request, error: requestError } = await supabaseClient
        .from('link_purchase_requests')
        .insert([purchaseRequestData])
        .select()
        .single();

      if (requestError) {
        console.log(`❌ Erreur création demande: ${requestError.message}`);
        console.log('📝 Code:', requestError.code);
        console.log('📝 Détails:', requestError.details);
      } else {
        console.log(`✅ Demande créée avec succès !`);
        console.log(`   - ID: ${request.id}`);
        console.log(`   - Statut: ${request.status}`);
        
        // 8. Créer la notification pour l'éditeur
        console.log(`\n📬 8. Création de la notification...`);
        
        const { data: notificationId, error: notifError } = await supabaseClient.rpc('create_notification', {
          p_user_id: listingToUse.user_id,
          p_title: 'Nouvelle demande de lien reçue',
          p_message: `Vous avez reçu une nouvelle demande d'achat de lien pour "${listingToUse.title}" de la part d'un annonceur.`,
          p_type: 'info',
          p_action_url: '/dashboard/purchase-requests',
          p_action_type: 'link_purchase'
        });

        if (notifError) {
          console.log(`❌ Erreur création notification: ${notifError.message}`);
        } else {
          console.log(`✅ Notification créée: ${notificationId}`);
        }

        // 9. Créer la transaction de crédit
        console.log(`\n💰 9. Création de la transaction de crédit...`);
        
        const { data: creditTransaction, error: creditError } = await supabaseClient
          .from('credit_transactions')
          .insert([{
            user_id: authData.user.id,
            type: 'purchase',
            amount: listingToUse.price,
            description: `Achat de nouveau lien: ${listingToUse.title}`,
            payment_method: 'manual',
            related_purchase_request_id: request.id
          }])
          .select()
          .single();

        if (creditError) {
          console.log(`❌ Erreur création transaction crédit: ${creditError.message}`);
        } else {
          console.log(`✅ Transaction de crédit créée: ${creditTransaction.id}`);
        }

        // 10. Vérification finale
        console.log(`\n🔍 10. Vérification finale...`);
        
        // Vérifier que l'éditeur peut voir la notification
        const { data: editorNotifications, error: editorNotifError } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', listingToUse.user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (editorNotifError) {
          console.log(`❌ Erreur vérification notifications éditeur: ${editorNotifError.message}`);
        } else if (editorNotifications.length > 0) {
          const latestNotif = editorNotifications[0];
          console.log(`✅ Dernière notification éditeur: ${latestNotif.title}`);
          console.log(`   - Lu: ${latestNotif.read ? 'Oui' : 'Non'}`);
          console.log(`   - Créée: ${new Date(latestNotif.created_at).toLocaleString()}`);
        }

        console.log(`\n🎉 Test terminé avec succès !`);
        console.log(`   - Demande d'achat créée: ${request.id}`);
        console.log(`   - Notification envoyée à l'éditeur`);
        console.log(`   - Transaction de crédit créée`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testNewArticleFlow();
