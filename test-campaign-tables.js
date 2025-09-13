// Script pour tester et supprimer les tables de campagnes dans Supabase Cloud
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCampaignTables() {
  console.log('🔍 Vérification des tables de campagnes...');
  
  try {
    // Vérifier si les tables de campagnes existent
    const tables = ['campaigns', 'link_opportunities', 'url_analyses', 'link_orders'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: existe (${data?.length || 0} enregistrements)`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: n'existe pas ou erreur`);
      }
    }
    
    // Vérifier la colonne campaign_id dans link_purchase_requests
    try {
      const { data, error } = await supabase
        .from('link_purchase_requests')
        .select('campaign_id')
        .limit(1);
      
      if (error) {
        console.log('❌ Colonne campaign_id: n\'existe pas');
      } else {
        console.log('✅ Colonne campaign_id: existe dans link_purchase_requests');
      }
    } catch (err) {
      console.log('❌ Colonne campaign_id: n\'existe pas');
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
}

async function removeCampaignSystem() {
  console.log('🗑️ Suppression du système de campagnes...');
  
  try {
    // 1. Supprimer les triggers
    console.log('1. Suppression des triggers...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS trigger_update_campaign_spent ON link_purchase_requests;
        DROP TRIGGER IF EXISTS trigger_update_campaign_status ON link_purchase_requests;
      `
    });
    
    // 2. Supprimer les fonctions
    console.log('2. Suppression des fonctions...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP FUNCTION IF EXISTS update_campaign_spent_amount();
        DROP FUNCTION IF EXISTS update_campaign_status();
      `
    });
    
    // 3. Supprimer la colonne campaign_id
    console.log('3. Suppression de la colonne campaign_id...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE link_purchase_requests DROP COLUMN IF EXISTS campaign_id;
      `
    });
    
    // 4. Supprimer les index
    console.log('4. Suppression des index...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP INDEX IF EXISTS idx_link_purchase_requests_campaign_id;
        DROP INDEX IF EXISTS idx_campaigns_status;
        DROP INDEX IF EXISTS idx_campaigns_user_id_status;
        DROP INDEX IF EXISTS idx_campaigns_dates;
      `
    });
    
    // 5. Supprimer les tables
    console.log('5. Suppression des tables...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS link_orders CASCADE;
        DROP TABLE IF EXISTS link_opportunities CASCADE;
        DROP TABLE IF EXISTS url_analyses CASCADE;
        DROP TABLE IF EXISTS campaigns CASCADE;
      `
    });
    
    // 6. Recréer les politiques RLS
    console.log('6. Recréation des politiques RLS...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view their own purchase requests" ON link_purchase_requests;
        CREATE POLICY "Users can view their own purchase requests" ON link_purchase_requests
        FOR SELECT USING (
          auth.uid() = user_id OR 
          auth.uid() = publisher_id
        );
      `
    });
    
    console.log('✅ Système de campagnes supprimé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  }
}

async function main() {
  console.log('🚀 Début de la suppression du système de campagnes...\n');
  
  await checkCampaignTables();
  console.log('\n' + '='.repeat(50) + '\n');
  await removeCampaignSystem();
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🔍 Vérification finale...');
  await checkCampaignTables();
  
  console.log('\n✅ Processus terminé!');
}

main().catch(console.error);
