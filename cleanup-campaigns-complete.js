// Script pour nettoyer complètement les campagnes en gérant les contraintes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupCampaigns() {
  console.log('🧹 Nettoyage complet des campagnes...');
  
  try {
    // 1. D'abord, récupérer toutes les campagnes
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name');
    
    if (campaignsError) {
      console.log('❌ Erreur récupération campagnes:', campaignsError.message);
      return;
    }
    
    console.log(`📋 ${campaigns?.length || 0} campagnes trouvées`);
    
    // 2. Pour chaque campagne, nettoyer les dépendances
    for (const campaign of campaigns || []) {
      console.log(`\n🗑️ Nettoyage de la campagne: ${campaign.name} (${campaign.id})`);
      
      // Supprimer les link_purchase_requests liées à cette campagne
      const { error: requestsError } = await supabase
        .from('link_purchase_requests')
        .delete()
        .eq('campaign_id', campaign.id);
      
      if (requestsError) {
        console.log(`⚠️ Erreur suppression requests: ${requestsError.message}`);
      } else {
        console.log('✅ link_purchase_requests supprimées');
      }
      
      // Supprimer les link_opportunities liées à cette campagne
      const { error: opportunitiesError } = await supabase
        .from('link_opportunities')
        .delete()
        .eq('campaign_id', campaign.id);
      
      if (opportunitiesError) {
        console.log(`⚠️ Erreur suppression opportunities: ${opportunitiesError.message}`);
      } else {
        console.log('✅ link_opportunities supprimées');
      }
    }
    
    // 3. Maintenant supprimer toutes les campagnes
    console.log('\n🗑️ Suppression finale des campagnes...');
    const { error: finalDeleteError } = await supabase
      .from('campaigns')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (finalDeleteError) {
      console.log('❌ Erreur suppression finale:', finalDeleteError.message);
    } else {
      console.log('✅ Toutes les campagnes supprimées');
    }
    
    // 4. Nettoyer les autres tables
    console.log('\n🧹 Nettoyage des autres tables...');
    
    const { error: urlAnalysesError } = await supabase
      .from('url_analyses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (urlAnalysesError) {
      console.log('⚠️ Erreur url_analyses:', urlAnalysesError.message);
    } else {
      console.log('✅ url_analyses nettoyées');
    }
    
    const { error: linkOrdersError } = await supabase
      .from('link_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (linkOrdersError) {
      console.log('⚠️ Erreur link_orders:', linkOrdersError.message);
    } else {
      console.log('✅ link_orders nettoyées');
    }
    
    console.log('\n✅ Nettoyage terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Vérification du nettoyage...');
  
  try {
    const tables = ['campaigns', 'link_opportunities', 'url_analyses', 'link_orders'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: ${data?.length || 0} enregistrements`);
      }
    }
    
    // Vérifier qu'il n'y a plus de campaign_id dans link_purchase_requests
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id, campaign_id')
      .not('campaign_id', 'is', null)
      .limit(1);
    
    if (requestsError) {
      console.log('❌ Erreur vérification link_purchase_requests:', requestsError.message);
    } else {
      console.log(`✅ link_purchase_requests avec campaign_id: ${requests?.length || 0}`);
    }
    
    // Vérifier le système d'achat rapide
    const { data: quickBuyRequests, error: quickBuyError } = await supabase
      .from('link_purchase_requests')
      .select('id, status, proposed_price')
      .is('campaign_id', null)
      .limit(5);
    
    if (quickBuyError) {
      console.log('❌ Erreur vérification achat rapide:', quickBuyError.message);
    } else {
      console.log(`✅ Demandes d'achat rapide: ${quickBuyRequests?.length || 0}`);
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
}

async function main() {
  console.log('🚀 Nettoyage complet du système de campagnes...\n');
  
  await cleanupCampaigns();
  await verifyCleanup();
  
  console.log('\n✅ Processus terminé!');
  console.log('📝 Le système d\'achat rapide est préservé.');
  console.log('📝 Les tables de campagnes sont vides mais existent encore.');
}

main().catch(console.error);
