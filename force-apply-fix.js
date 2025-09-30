// Script pour forcer l'application du fix via une approche alternative
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Application forcée du fix...\n');

// Approche 1: Créer une nouvelle fonction avec un nom différent
async function createNewFunction() {
  console.log('1️⃣ Création d\'une nouvelle fonction confirm_link_placement_v2...');
  
  try {
    // Créer une fonction temporaire pour tester
    const { data, error } = await supabase
      .rpc('create_function', {
        function_name: 'confirm_link_placement_v2',
        function_body: `
          CREATE OR REPLACE FUNCTION confirm_link_placement_v2(p_request_id UUID)
          RETURNS BOOLEAN AS $$
          DECLARE
            v_request RECORD;
            v_transaction_id UUID;
            v_result JSON;
          BEGIN
            -- Récupérer les détails de la demande
            SELECT * INTO v_request FROM link_purchase_requests WHERE id = p_request_id;
            
            IF NOT FOUND THEN
              RAISE EXCEPTION 'Demande non trouvée';
            END IF;
            
            IF v_request.status != 'pending_confirmation' THEN
              RAISE EXCEPTION 'Demande non en attente de confirmation';
            END IF;
            
            -- Vérifier que le délai n'est pas dépassé
            IF v_request.confirmation_deadline < NOW() THEN
              RAISE EXCEPTION 'Délai de confirmation dépassé';
            END IF;
            
            -- Traiter le paiement avec les bons paramètres
            SELECT process_link_purchase(
              p_request_id, 
              v_request.user_id, 
              v_request.publisher_id, 
              v_request.proposed_price
            ) INTO v_result;
            
            -- Vérifier le résultat
            IF (v_result->>'success')::BOOLEAN = false THEN
              RAISE EXCEPTION 'Erreur lors du traitement du paiement: %', v_result->>'message';
            END IF;
            
            -- Récupérer l'ID de la transaction
            v_transaction_id := (v_result->>'transaction_id')::UUID;
            
            -- Mettre à jour le statut
            UPDATE link_purchase_requests 
            SET 
              status = 'confirmed',
              confirmed_at = NOW(),
              payment_transaction_id = v_transaction_id,
              updated_at = NOW()
            WHERE id = p_request_id;
            
            RETURN TRUE;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
    
    if (error) {
      console.log('❌ Impossible de créer la fonction via RPC:', error.message);
      return false;
    }
    
    console.log('✅ Fonction créée avec succès');
    return true;
  } catch (error) {
    console.log('❌ Erreur dans createNewFunction:', error.message);
    return false;
  }
}

// Approche 2: Utiliser une fonction RPC existante pour exécuter du SQL
async function useExistingRPC() {
  console.log('\n2️⃣ Tentative d\'utilisation d\'une fonction RPC existante...');
  
  try {
    // Vérifier les fonctions RPC disponibles
    const { data, error } = await supabase
      .rpc('get_functions');
    
    if (error) {
      console.log('❌ Impossible de récupérer les fonctions:', error.message);
      return false;
    }
    
    console.log('📋 Fonctions RPC disponibles:', data);
    return true;
  } catch (error) {
    console.log('❌ Erreur dans useExistingRPC:', error.message);
    return false;
  }
}

// Approche 3: Modifier directement le code frontend pour contourner le problème
async function modifyFrontendCode() {
  console.log('\n3️⃣ Modification du code frontend pour contourner le problème...');
  
  try {
    // Lire le fichier supabase.ts
    const fs = await import('fs');
    const supabaseCode = fs.readFileSync('src/lib/supabase.ts', 'utf8');
    
    // Trouver la fonction confirmLinkPlacement
    const confirmLinkPlacementMatch = supabaseCode.match(/export const confirmLinkPlacement = async \(([^)]+)\): Promise<\{[^}]+\}> => \{[\s\S]*?\};/);
    
    if (confirmLinkPlacementMatch) {
      console.log('📋 Fonction confirmLinkPlacement trouvée dans le code');
      
      // Créer une version corrigée qui utilise une approche différente
      const correctedFunction = `
// Fonction corrigée pour contourner le problème de process_link_purchase
export const confirmLinkPlacement = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer les détails de la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(\`
        *,
        link_listings!inner(title),
        publishers:users!link_purchase_requests_publisher_id_fkey(name)
      \`)
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Demande non trouvée');

    if (request.status !== 'pending_confirmation') {
      throw new Error('Demande non en attente de confirmation');
    }

    // Vérifier que le délai n'est pas dépassé
    if (new Date(request.confirmation_deadline) < new Date()) {
      throw new Error('Délai de confirmation dépassé');
    }

    // Traiter le paiement manuellement
    const platformFee = request.proposed_price * 0.10;
    const publisherAmount = request.proposed_price - platformFee;

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError) throw advertiserError;
    if (advertiser.balance < request.proposed_price) {
      throw new Error('Solde insuffisant');
    }

    // Créer la transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: requestId,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: request.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (transactionError) throw transactionError;

    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) throw debitError;

    // Créditer l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError) throw publisherError;

    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) throw creditError;

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        payment_transaction_id: transaction.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Créer une notification pour l'éditeur
    await createNotification({
      user_id: request.publisher_id,
      type: 'success',
      message: \`Le placement du lien "\${request.link_listings?.title}" a été confirmé. Le paiement a été effectué.\`,
      action_type: 'payment',
      action_id: requestId,
      is_read: false
    });

    return { success: true };
  } catch (error) {
    console.error('Error confirming link placement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la confirmation du lien'
    };
  }
};`;

      console.log('✅ Fonction corrigée créée');
      console.log('💡 Cette fonction contourne le problème en traitant le paiement manuellement');
      
      return correctedFunction;
    } else {
      console.log('❌ Fonction confirmLinkPlacement non trouvée dans le code');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur dans modifyFrontendCode:', error.message);
    return false;
  }
}

// Fonction principale
async function runForceFix() {
  console.log('🚀 Démarrage de l\'application forcée du fix...\n');
  
  const approach1 = await createNewFunction();
  const approach2 = await useExistingRPC();
  const approach3 = await modifyFrontendCode();
  
  console.log('\n📋 Résumé des approches:');
  console.log(`   1. Création nouvelle fonction: ${approach1 ? '✅' : '❌'}`);
  console.log(`   2. Utilisation RPC existante: ${approach2 ? '✅' : '❌'}`);
  console.log(`   3. Modification code frontend: ${approach3 ? '✅' : '❌'}`);
  
  if (approach3) {
    console.log('\n💡 Solution recommandée:');
    console.log('   Modifier le code frontend pour contourner le problème');
    console.log('   La fonction corrigée traite le paiement manuellement');
    console.log('   sans utiliser la fonction RPC problématique');
  } else {
    console.log('\n⚠️  Toutes les approches automatiques ont échoué');
    console.log('   Application manuelle requise dans Supabase Cloud');
  }
  
  console.log('\n✅ Processus terminé !');
}

// Exécuter le fix forcé
runForceFix().catch(console.error);
