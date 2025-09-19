// Test complet du processus d'achat de liens avec migration automatique
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Fonction pour appliquer la migration manquante
async function applyMissingMigration() {
  console.log('🔧 Application de la migration manquante...');
  
  try {
    // Ajouter la colonne campaign_id si elle n'existe pas
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'link_purchase_requests' 
            AND column_name = 'campaign_id'
          ) THEN
            ALTER TABLE link_purchase_requests 
            ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_campaign_id 
            ON link_purchase_requests(campaign_id);
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.log('⚠️  Erreur lors de l\'ajout de la colonne:', alterError.message);
      // Essayer une approche alternative
      const { error: directError } = await supabaseAdmin
        .from('link_purchase_requests')
        .select('campaign_id')
        .limit(1);
      
      if (directError && directError.message.includes('campaign_id')) {
        console.log('❌ La colonne campaign_id n\'existe toujours pas');
        return false;
      }
    }
    
    console.log('✅ Migration appliquée avec succès');
    return true;
  } catch (error) {
    console.log('❌ Erreur lors de l\'application de la migration:', error.message);
    return false;
  }
}

// Fonction pour créer des comptes de test
async function createTestAccounts() {
  console.log('👥 Création des comptes de test...');
  
  const uniqueId = Date.now();
  
  // Créer l'annonceur
  const { data: advertiserAuth, error: advertiserError } = await supabaseAdmin.auth.signUp({
    email: `advertiser-${uniqueId}@test.com`,
    password: 'password123',
    options: {
      data: {
        full_name: `Annonceur Test ${uniqueId}`,
        role: 'advertiser'
      }
    }
  });

  if (advertiserError) {
    throw new Error(`Erreur création annonceur: ${advertiserError.message}`);
  }

  // Créer l'éditeur
  const { data: publisherAuth, error: publisherError } = await supabaseAdmin.auth.signUp({
    email: `publisher-${uniqueId}@test.com`,
    password: 'password123',
    options: {
      data: {
        full_name: `Éditeur Test ${uniqueId}`,
        role: 'publisher'
      }
    }
  });

  if (publisherError) {
    throw new Error(`Erreur création éditeur: ${publisherError.message}`);
  }

  // Créer les profils utilisateur
  const { error: advertiserProfileError } = await supabaseAdmin
    .from('users')
    .insert([{
      id: advertiserAuth.user.id,
      email: `advertiser-${uniqueId}@test.com`,
      full_name: `Annonceur Test ${uniqueId}`,
      role: 'advertiser',
      credits: 1000
    }]);

  if (advertiserProfileError) {
    throw new Error(`Erreur profil annonceur: ${advertiserProfileError.message}`);
  }

  const { error: publisherProfileError } = await supabaseAdmin
    .from('users')
    .insert([{
      id: publisherAuth.user.id,
      email: `publisher-${uniqueId}@test.com`,
      full_name: `Éditeur Test ${uniqueId}`,
      role: 'publisher',
      credits: 0
    }]);

  if (publisherProfileError) {
    throw new Error(`Erreur profil éditeur: ${publisherProfileError.message}`);
  }

  console.log('✅ Comptes créés avec succès');
  return {
    advertiser: advertiserAuth.user,
    publisher: publisherAuth.user,
    uniqueId
  };
}

// Fonction pour créer un site web
async function createWebsite(publisherId, uniqueId) {
  console.log('🌐 Création du site web...');
  
  const { data: website, error } = await supabaseAdmin
    .from('websites')
    .insert([{
      user_id: publisherId,
      name: `Site Tech ${uniqueId}`,
      url: `https://site-tech-${uniqueId}.com`,
      slug: `site-tech-${uniqueId}`,
      description: `Site technologique de test ${uniqueId}`,
      category: 'technology',
      domain_authority: 45,
      monthly_traffic: 15000,
      price_per_link: 200,
      currency: 'MAD',
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création site: ${error.message}`);
  }

  console.log('✅ Site web créé');
  return website;
}

// Fonction pour créer un listing de lien
async function createLinkListing(websiteId, uniqueId) {
  console.log('🔗 Création du listing de lien...');
  
  const { data: linkListing, error } = await supabaseAdmin
    .from('link_listings')
    .insert([{
      website_id: websiteId,
      title: `Article Tech ${uniqueId}`,
      url: `https://site-tech-${uniqueId}.com/article-tech-${uniqueId}`,
      slug: `article-tech-${uniqueId}`,
      description: `Article sur les technologies innovantes ${uniqueId}`,
      category: 'technology',
      price: 250,
      currency: 'MAD',
      is_available: true
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création listing: ${error.message}`);
  }

  console.log('✅ Listing de lien créé');
  return linkListing;
}

// Fonction pour créer une campagne
async function createCampaign(advertiserId, uniqueId) {
  console.log('📊 Création de la campagne...');
  
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .insert([{
      user_id: advertiserId,
      name: `Campagne Tech ${uniqueId}`,
      description: `Campagne de test pour les technologies ${uniqueId}`,
      target_url: `https://site-annonceur-${uniqueId}.com`,
      budget: 1000,
      currency: 'MAD',
      status: 'draft'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création campagne: ${error.message}`);
  }

  console.log('✅ Campagne créée');
  return campaign;
}

// Fonction pour créer une demande d'achat
async function createPurchaseRequest(advertiserId, publisherId, linkListingId, campaignId, uniqueId) {
  console.log('💳 Création de la demande d\'achat...');
  
  const { data: purchaseRequest, error } = await supabaseAdmin
    .from('link_purchase_requests')
    .insert([{
      link_listing_id: linkListingId,
      user_id: advertiserId,
      publisher_id: publisherId,
      target_url: `https://site-annonceur-${uniqueId}.com`,
      anchor_text: 'technologie innovante',
      message: `Demande d'achat de lien pour notre site tech ${uniqueId}`,
      proposed_price: 300,
      proposed_duration: 12,
      campaign_id: campaignId,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création demande: ${error.message}`);
  }

  console.log('✅ Demande d\'achat créée');
  return purchaseRequest;
}

// Fonction pour accepter la demande
async function acceptPurchaseRequest(purchaseRequestId) {
  console.log('✅ Acceptation de la demande...');
  
  const { error } = await supabaseAdmin
    .from('link_purchase_requests')
    .update({
      status: 'accepted',
      editor_response: 'Demande acceptée avec plaisir !',
      response_date: new Date().toISOString()
    })
    .eq('id', purchaseRequestId);

  if (error) {
    throw new Error(`Erreur acceptation: ${error.message}`);
  }

  console.log('✅ Demande acceptée');
}

// Fonction pour traiter le paiement
async function processPayment(purchaseRequestId) {
  console.log('💰 Traitement du paiement...');
  
  const { error } = await supabaseAdmin.rpc('process_link_purchase', {
    p_purchase_request_id: purchaseRequestId
  });

  if (error) {
    throw new Error(`Erreur traitement paiement: ${error.message}`);
  }

  console.log('✅ Paiement traité');
}

// Fonction pour vérifier les soldes
async function checkBalances(advertiserId, publisherId) {
  console.log('💳 Vérification des soldes...');
  
  const { data: advertiser, error: advertiserError } = await supabaseAdmin
    .from('users')
    .select('credits')
    .eq('id', advertiserId)
    .single();

  if (advertiserError) {
    throw new Error(`Erreur récupération solde annonceur: ${advertiserError.message}`);
  }

  const { data: publisher, error: publisherError } = await supabaseAdmin
    .from('users')
    .select('credits')
    .eq('id', publisherId)
    .single();

  if (publisherError) {
    throw new Error(`Erreur récupération solde éditeur: ${publisherError.message}`);
  }

  console.log(`💰 Solde annonceur: ${advertiser.credits} MAD`);
  console.log(`💰 Solde éditeur: ${publisher.credits} MAD`);
  
  return { advertiser: advertiser.credits, publisher: publisher.credits };
}

// Test principal
async function testCompleteProcess() {
  console.log('🚀 Début du test complet du processus d\'achat de liens\n');
  
  try {
    // Étape 1: Appliquer la migration
    const migrationApplied = await applyMissingMigration();
    if (!migrationApplied) {
      console.log('⚠️  Migration non appliquée, continuation sans campaign_id...');
    }

    // Étape 2: Créer les comptes
    const { advertiser, publisher, uniqueId } = await createTestAccounts();

    // Étape 3: Créer le site web
    const website = await createWebsite(publisher.id, uniqueId);

    // Étape 4: Créer le listing de lien
    const linkListing = await createLinkListing(website.id, uniqueId);

    // Étape 5: Créer la campagne
    const campaign = await createCampaign(advertiser.id, uniqueId);

    // Étape 6: Créer la demande d'achat
    const purchaseRequest = await createPurchaseRequest(
      advertiser.id, 
      publisher.id, 
      linkListing.id, 
      campaign.id, 
      uniqueId
    );

    // Étape 7: Accepter la demande
    await acceptPurchaseRequest(purchaseRequest.id);

    // Étape 8: Traiter le paiement
    await processPayment(purchaseRequest.id);

    // Étape 9: Vérifier les soldes
    const balances = await checkBalances(advertiser.id, publisher.id);

    console.log('\n🎉 Test complet réussi !');
    console.log(`📊 Résultats:`);
    console.log(`   - Annonceur: ${balances.advertiser} MAD`);
    console.log(`   - Éditeur: ${balances.publisher} MAD`);
    console.log(`   - Demande ID: ${purchaseRequest.id}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('📝 Détails:', error);
  }
}

// Exécuter le test
testCompleteProcess();
