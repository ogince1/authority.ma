// Script pour supprimer directement les données de campagnes dans Supabase Cloud
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeCampaignData() {
  console.log('🗑️ Suppression des données de campagnes...');
  
  try {
    // 1. Supprimer toutes les données des tables de campagnes
    console.log('1. Suppression des données de link_orders...');
    const { error: linkOrdersError } = await supabase
      .from('link_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tout
    
    if (linkOrdersError) {
      console.log('⚠️ Erreur link_orders:', linkOrdersError.message);
    } else {
      console.log('✅ Données link_orders supprimées');
    }
    
    console.log('2. Suppression des données de link_opportunities...');
    const { error: opportunitiesError } = await supabase
      .from('link_opportunities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (opportunitiesError) {
      console.log('⚠️ Erreur link_opportunities:', opportunitiesError.message);
    } else {
      console.log('✅ Données link_opportunities supprimées');
    }
    
    console.log('3. Suppression des données de url_analyses...');
    const { error: analysesError } = await supabase
      .from('url_analyses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (analysesError) {
      console.log('⚠️ Erreur url_analyses:', analysesError.message);
    } else {
      console.log('✅ Données url_analyses supprimées');
    }
    
    console.log('4. Suppression des données de campaigns...');
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (campaignsError) {
      console.log('⚠️ Erreur campaigns:', campaignsError.message);
    } else {
      console.log('✅ Données campaigns supprimées');
    }
    
    // 2. Mettre à jour les link_purchase_requests pour supprimer campaign_id
    console.log('5. Mise à jour des link_purchase_requests...');
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({ campaign_id: null })
      .not('campaign_id', 'is', null);
    
    if (updateError) {
      console.log('⚠️ Erreur mise à jour link_purchase_requests:', updateError.message);
    } else {
      console.log('✅ link_purchase_requests mis à jour');
    }
    
    console.log('✅ Données de campagnes supprimées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  }
}

async function verifyRemoval() {
  console.log('\n🔍 Vérification de la suppression...');
  
  try {
    const tables = ['campaigns', 'link_opportunities', 'url_analyses', 'link_orders'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: ${data?.length || 0} enregistrements restants`);
      }
    }
    
    // Vérifier link_purchase_requests
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id, campaign_id')
      .not('campaign_id', 'is', null)
      .limit(5);
    
    if (requestsError) {
      console.log('❌ Erreur vérification link_purchase_requests:', requestsError.message);
    } else {
      console.log(`✅ link_purchase_requests avec campaign_id: ${requests?.length || 0}`);
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
}

async function main() {
  console.log('🚀 Début de la suppression des données de campagnes...\n');
  
  await removeCampaignData();
  await verifyRemoval();
  
  console.log('\n✅ Processus terminé!');
  console.log('📝 Note: Les tables existent encore mais sont vides.');
  console.log('📝 Pour supprimer complètement les tables, utilisez l\'interface Supabase Cloud.');
}

main().catch(console.error);
