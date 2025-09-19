// Script pour vérifier la structure exacte de la table link_purchase_requests
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

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure exacte de link_purchase_requests\n');

  try {
    // 1. Vérifier la structure de la table
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
      
      // Vérifier spécifiquement campaign_id
      if (columns.includes('campaign_id')) {
        console.log('✅ Colonne campaign_id présente');
        console.log('📊 Valeur campaign_id dans l\'enregistrement:', requests[0].campaign_id);
      } else {
        console.log('❌ Colonne campaign_id MANQUANTE');
      }
    } else {
      console.log('⚠️  Table vide');
    }

    // 2. Vérifier les enregistrements existants
    console.log('\n📊 2. Enregistrements existants:');
    
    const { data: allRequests, error: allRequestsError } = await supabaseAdmin
      .from('link_purchase_requests')
      .select('id, campaign_id, status, proposed_price, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allRequestsError) {
      console.log('❌ Erreur récupération demandes:', allRequestsError.message);
    } else {
      console.log(`📊 Total des demandes: ${allRequests.length}`);
      allRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}`);
        console.log(`      Campaign ID: ${request.campaign_id || 'NULL'}`);
        console.log(`      Status: ${request.status}`);
        console.log(`      Prix: ${request.proposed_price} MAD`);
        console.log(`      Date: ${request.created_at}`);
        console.log('');
      });
    }

    // 3. Vérifier les campagnes existantes
    console.log('📊 3. Campagnes existantes:');
    
    const { data: allCampaigns, error: allCampaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allCampaignsError) {
      console.log('❌ Erreur récupération campagnes:', allCampaignsError.message);
    } else {
      console.log(`📊 Total des campagnes: ${allCampaigns.length}`);
      allCampaigns.forEach((campaign, index) => {
        console.log(`   ${index + 1}. ID: ${campaign.id}`);
        console.log(`      Nom: ${campaign.name}`);
        console.log(`      Status: ${campaign.status}`);
        console.log(`      Date: ${campaign.created_at}`);
        console.log('');
      });
    }

    // 4. Test de création d'une demande avec campaign_id
    console.log('🧪 4. Test de création d\'une demande avec campaign_id:');
    
    if (allCampaigns && allCampaigns.length > 0 && allRequests && allRequests.length > 0) {
      const campaign = allCampaigns[0];
      const existingRequest = allRequests[0];
      
      console.log(`🧪 Test avec:`);
      console.log(`   - Campagne: ${campaign.name} (${campaign.id})`);
      console.log(`   - Demande existante: ${existingRequest.id}`);
      
      // Tenter de créer une demande d'achat avec campaign_id
      const testRequestData = {
        link_listing_id: existingRequest.id, // Utiliser l'ID de la demande existante comme link_listing_id
        user_id: '00000000-0000-0000-0000-000000000000',
        publisher_id: '00000000-0000-0000-0000-000000000000',
        target_url: 'https://test-campaign.com',
        anchor_text: 'test',
        proposed_price: 100,
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
        console.log('💡 Suggestion:', testRequestError.hint);
      } else {
        console.log('✅ Demande d\'achat créée avec succès !');
        console.log(`   - ID: ${testRequest.id}`);
        console.log(`   - Campaign ID: ${testRequest.campaign_id}`);
        
        // Nettoyer la demande de test
        await supabaseAdmin
          .from('link_purchase_requests')
          .delete()
          .eq('id', testRequest.id);
        console.log('🧹 Demande de test nettoyée');
      }
    } else {
      console.log('⚠️  Données insuffisantes pour le test');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

checkTableStructure();
