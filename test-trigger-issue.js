// Test pour diagnostiquer le problème du trigger
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

async function testTriggerIssue() {
  console.log('🚀 Test pour diagnostiquer le problème du trigger\n');

  try {
    // 1. Récupérer une campagne existante
    const { data: campaigns } = await supabaseAdmin.from('campaigns').select('*').limit(1);
    const campaign = campaigns[0];
    
    console.log(`📊 Campagne: ${campaign.name}`);
    console.log(`   - ID: ${campaign.id}`);
    console.log(`   - Statut actuel: ${campaign.status}`);

    // 2. Vérifier la taille du statut
    console.log(`   - Longueur du statut: ${campaign.status.length} caractères`);
    
    // 3. Vérifier si 'pending_editor_approval' tient dans la contrainte
    const targetStatus = 'pending_editor_approval';
    console.log(`\n🎯 Statut cible: "${targetStatus}"`);
    console.log(`   - Longueur: ${targetStatus.length} caractères`);

    // 4. Tester manuellement la mise à jour du statut
    console.log('\n🧪 Test de mise à jour manuelle du statut...');
    
    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({ status: targetStatus })
      .eq('id', campaign.id);

    if (updateError) {
      console.log('❌ Erreur mise à jour manuelle:', updateError.message);
      console.log('📝 Code:', updateError.code);
    } else {
      console.log('✅ Mise à jour manuelle: SUCCÈS');
      
      // Remettre l'ancien statut
      await supabaseAdmin
        .from('campaigns')
        .update({ status: campaign.status })
        .eq('id', campaign.id);
      console.log('🔄 Statut remis à l\'origine');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testTriggerIssue();
