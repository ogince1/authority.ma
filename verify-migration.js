// Script pour vérifier que la migration a été appliquée avec succès
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

async function verifyMigration() {
  console.log('🔍 Vérification de la structure des tables après migration\n');

  try {
    // 1. Vérifier la structure de link_purchase_requests
    console.log('📋 1. Structure de link_purchase_requests:');
    
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('link_purchase_requests')
      .select('*')
      .limit(1);
    
    if (requestsError) {
      console.log('❌ Erreur:', requestsError.message);
    } else if (requests && requests.length > 0) {
      const columns = Object.keys(requests[0]);
      console.log('✅ Colonnes disponibles:', columns);
      
      // Vérifier les colonnes importantes
      const importantColumns = ['id', 'link_listing_id', 'user_id', 'publisher_id', 'target_url', 'anchor_text', 'proposed_price', 'status', 'campaign_id'];
      
      console.log('\n🔍 Vérification des colonnes importantes:');
      importantColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`✅ ${col} - Présente`);
        } else {
          console.log(`❌ ${col} - MANQUANTE`);
        }
      });
      
      // Vérifier spécifiquement campaign_id
      if (columns.includes('campaign_id')) {
        console.log('\n🎉 SUCCÈS: La colonne campaign_id a été ajoutée !');
      } else {
        console.log('\n❌ ÉCHEC: La colonne campaign_id est toujours manquante');
      }
    } else {
      console.log('⚠️  Table vide, testons avec un insert...');
      
      // Essayer d'insérer un enregistrement test pour voir les colonnes requises
      const testData = {
        link_listing_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        publisher_id: '00000000-0000-0000-0000-000000000000',
        target_url: 'https://test.com',
        anchor_text: 'test',
        proposed_price: 100,
        proposed_duration: 1,
        status: 'pending',
        campaign_id: null // Tester si la colonne existe
      };
      
      const { error: insertError } = await supabaseAdmin
        .from('link_purchase_requests')
        .insert([testData]);
      
      if (insertError) {
        if (insertError.message.includes('campaign_id')) {
          console.log('❌ La colonne campaign_id n\'existe toujours pas');
        } else {
          console.log('✅ La colonne campaign_id existe (erreur différente)');
          console.log('📝 Erreur:', insertError.message);
        }
      } else {
        console.log('✅ Structure de table valide avec campaign_id');
        // Nettoyer
        await supabaseAdmin
          .from('link_purchase_requests')
          .delete()
          .eq('target_url', 'https://test.com');
      }
    }

    // 2. Vérifier la structure de campaigns
    console.log('\n📋 2. Structure de campaigns:');
    
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .limit(1);
    
    if (campaignsError) {
      console.log('❌ Erreur:', campaignsError.message);
    } else if (campaigns && campaigns.length > 0) {
      const columns = Object.keys(campaigns[0]);
      console.log('✅ Colonnes disponibles:', columns);
      
      if (columns.includes('status')) {
        console.log('✅ Colonne status présente');
      } else {
        console.log('❌ Colonne status MANQUANTE');
      }
    } else {
      console.log('⚠️  Table vide');
    }

    // 3. Test complet de création d'une demande avec campaign_id
    console.log('\n🧪 3. Test complet de création d\'une demande avec campaign_id:');
    
    // Récupérer des données existantes
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(2);
    
    const { data: existingCampaigns } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .limit(1);
    
    const { data: existingListings } = await supabaseAdmin
      .from('link_listings')
      .select('*')
      .limit(1);
    
    if (users && users.length >= 2 && existingCampaigns && existingCampaigns.length > 0 && existingListings && existingListings.length > 0) {
      const advertiser = users.find(u => u.role === 'advertiser') || users[0];
      const publisher = users.find(u => u.role === 'publisher') || users[1];
      const campaign = existingCampaigns[0];
      const listing = existingListings[0];
      
      console.log(`🧪 Test avec:`);
      console.log(`   - Annonceur: ${advertiser.email}`);
      console.log(`   - Éditeur: ${publisher.email}`);
      console.log(`   - Campagne: ${campaign.name}`);
      console.log(`   - Listing: ${listing.title}`);
      
      const testRequestData = {
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: publisher.id,
        target_url: 'https://test-migration.com',
        anchor_text: 'test migration',
        message: 'Test après migration',
        proposed_price: 150,
        proposed_duration: 1,
        status: 'pending',
        campaign_id: campaign.id
      };
      
      const { data: testRequest, error: testRequestError } = await supabaseAdmin
        .from('link_purchase_requests')
        .insert([testRequestData])
        .select()
        .single();
      
      if (testRequestError) {
        console.log('❌ Erreur création demande test:', testRequestError.message);
        console.log('📝 Détails:', testRequestError.details);
      } else {
        console.log('🎉 SUCCÈS COMPLET ! Demande créée avec campaign_id');
        console.log(`   - ID: ${testRequest.id}`);
        console.log(`   - Campaign ID: ${testRequest.campaign_id}`);
        console.log(`   - Status: ${testRequest.status}`);
        
        // Nettoyer
        await supabaseAdmin
          .from('link_purchase_requests')
          .delete()
          .eq('id', testRequest.id);
        console.log('🧹 Demande de test nettoyée');
      }
    } else {
      console.log('⚠️  Données insuffisantes pour le test complet');
    }

    // 4. Résumé final
    console.log('\n📊 4. Résumé de la vérification:');
    console.log('=====================================');
    
    const hasCampaignId = requests && requests.length > 0 && Object.keys(requests[0]).includes('campaign_id');
    const hasStatus = campaigns && campaigns.length > 0 && Object.keys(campaigns[0]).includes('status');
    
    if (hasCampaignId && hasStatus) {
      console.log('🎉 MIGRATION RÉUSSIE !');
      console.log('✅ Colonne campaign_id ajoutée à link_purchase_requests');
      console.log('✅ Colonne status ajoutée à campaigns');
      console.log('✅ Le système de campagnes est maintenant fonctionnel');
    } else {
      console.log('❌ MIGRATION INCOMPLÈTE');
      if (!hasCampaignId) console.log('❌ Colonne campaign_id manquante');
      if (!hasStatus) console.log('❌ Colonne status manquante');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

verifyMigration();
