// Test de la correction de la fonction confirmLinkPlacement
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConfirmLinkFix() {
  console.log('🧪 Test de la correction de confirmLinkPlacement...\n');
  
  try {
    // 1. Créer une demande d'achat
    console.log('📋 1. Création d\'une demande d\'achat...');
    
    const { data: linkListing, error: linkError } = await supabase
      .from('link_listings')
      .select('id, user_id')
      .limit(1)
      .single();
    
    if (linkError) {
      console.log(`   ❌ Erreur récupération lien: ${linkError.message}`);
      return;
    }
    
    const { data: createResult, error: createError } = await supabase
      .from('link_purchase_requests')
      .insert([{
        link_listing_id: linkListing.id,
        user_id: '4a435b5c-dcf2-4837-bba4-4ba244705427', // ID annonceur test
        publisher_id: linkListing.user_id,
        target_url: 'https://example.com/test-confirm-fix',
        anchor_text: 'Test correction confirmation',
        proposed_price: 100,
        proposed_duration: 1
      }])
      .select()
      .single();
    
    if (createError) {
      console.log(`   ❌ Erreur création: ${createError.message}`);
      return;
    }
    
    console.log(`   ✅ Demande créée: ${createResult.id}`);
    
    // 2. Simuler l'acceptation par l'éditeur
    console.log('\n📋 2. Acceptation par l\'éditeur...');
    
    const now = new Date();
    const { data: acceptResult, error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({ 
        status: 'pending_confirmation',
        placed_url: 'https://example.com/placed-link-confirm-fix',
        placed_at: now.toISOString(),
        accepted_at: now.toISOString(),
        editor_response: 'Lien placé avec succès !'
      })
      .eq('id', createResult.id)
      .select()
      .single();
    
    if (acceptError) {
      console.log(`   ❌ Erreur acceptation: ${acceptError.message}`);
    } else {
      console.log(`   ✅ Demande acceptée: ${acceptResult.id} (statut: ${acceptResult.status})`);
    }
    
    // 3. Tester la récupération de la demande (comme dans confirmLinkPlacement)
    console.log('\n📋 3. Test de récupération de la demande...');
    
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings(title)
      `)
      .eq('id', createResult.id)
      .single();
    
    if (requestError) {
      console.log(`   ❌ Erreur récupération: ${requestError.message}`);
      console.log(`   📋 Code: ${requestError.code}`);
      console.log(`   📋 Détails: ${requestError.details}`);
    } else {
      console.log(`   ✅ Demande récupérée: ${request.id}`);
      console.log(`   📋 Statut: ${request.status}`);
      console.log(`   📋 Lien: ${request.link_listings?.title || 'N/A'}`);
      console.log(`   📋 URL placée: ${request.placed_url}`);
    }
    
    // 4. Tester la confirmation (simulation)
    console.log('\n📋 4. Test de confirmation...');
    
    if (request && request.status === 'pending_confirmation') {
      // Vérifier le délai
      const deadline = new Date(request.accepted_at || request.response_date);
      deadline.setHours(deadline.getHours() + 48);
      
      if (new Date() > deadline) {
        console.log(`   ❌ Délai expiré !`);
      } else {
        console.log(`   ✅ Délai valide !`);
        
        // Simuler la confirmation (sans effectuer le paiement)
        console.log(`   📋 Simulation de confirmation réussie`);
        console.log(`   📋 La demande ${request.id} peut être confirmée`);
      }
    } else {
      console.log(`   ❌ Demande non en attente de confirmation`);
    }
    
    // 5. Nettoyer
    console.log('\n🧹 5. Nettoyage...');
    
    const { error: deleteError } = await supabase
      .from('link_purchase_requests')
      .delete()
      .eq('id', createResult.id);
    
    if (deleteError) {
      console.log(`   ❌ Erreur suppression: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Demande de test supprimée`);
    }
    
    console.log('\n🎉 Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testConfirmLinkFix().catch(console.error);
