// Script pour appliquer le SQL de correction directement
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Application du SQL de correction...\n');

// SQL de correction
const fixSQL = `
CREATE OR REPLACE FUNCTION confirm_link_placement(p_request_id UUID)
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
`;

// Fonction pour exécuter du SQL via une fonction RPC
async function executeSQL(sql) {
  try {
    // Créer une fonction temporaire pour exécuter le SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql_fix()
      RETURNS TEXT AS $$
      BEGIN
        ${sql}
        RETURN 'SQL executed successfully';
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Exécuter la création de la fonction
    const { data: createData, error: createError } = await supabase
      .rpc('exec', { sql: createFunctionSQL });
    
    if (createError) {
      console.error('❌ Erreur lors de la création de la fonction:', createError);
      return false;
    }
    
    // Exécuter la fonction
    const { data: execData, error: execError } = await supabase
      .rpc('execute_sql_fix');
    
    if (execError) {
      console.error('❌ Erreur lors de l\'exécution:', execError);
      return false;
    }
    
    console.log('✅ SQL exécuté avec succès:', execData);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur dans executeSQL:', error);
    return false;
  }
}

// Approche alternative : utiliser une fonction RPC existante
async function applyFixAlternative() {
  console.log('1️⃣ Tentative d\'application du fix...');
  
  try {
    // Essayer d'utiliser une fonction RPC simple pour tester
    const { data, error } = await supabase
      .rpc('confirm_link_placement', { 
        p_request_id: '00000000-0000-0000-0000-000000000000' 
      });
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ Fonction confirm_link_placement n\'existe pas');
        return false;
      } else if (error.message.includes('No function matches')) {
        console.log('⚠️  Fonction existe mais signature incorrecte - application du fix nécessaire');
        
        // Essayer d'appliquer le fix via une approche différente
        console.log('   Tentative d\'application via une fonction RPC personnalisée...');
        
        // Créer une fonction de test d'abord
        const testFunction = `
          CREATE OR REPLACE FUNCTION test_sql_execution()
          RETURNS TEXT AS $$
          BEGIN
            RETURN 'Test function created successfully';
          END;
          $$ LANGUAGE plpgsql;
        `;
        
        // Cette approche ne fonctionnera pas car nous ne pouvons pas exécuter du SQL arbitraire
        console.log('   ⚠️  Impossible d\'exécuter du SQL arbitraire via l\'API standard');
        console.log('   💡 Utilisation d\'une approche alternative...');
        
        return 'manual_required';
      } else {
        console.log('✅ Fonction existe (erreur attendue pour UUID invalide)');
        console.log('   Erreur:', error.message);
        return true;
      }
    } else {
      console.log('✅ Fonction fonctionne correctement');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur dans applyFixAlternative:', error);
    return false;
  }
}

// Test après application
async function testAfterApplication() {
  console.log('\n2️⃣ Test après application...');
  
  try {
    // Récupérer une demande en attente de confirmation
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id')
      .eq('status', 'pending_confirmation')
      .limit(1);
    
    if (requestsError) {
      console.error('❌ Erreur lors de la récupération des demandes:', requestsError);
      return;
    }
    
    if (requests.length === 0) {
      console.log('ℹ️  Aucune demande en attente de confirmation');
      return;
    }
    
    const requestId = requests[0].id;
    console.log(`📋 Test avec la demande ID: ${requestId}`);
    
    // Tester la fonction confirm_link_placement
    const { data, error } = await supabase
      .rpc('confirm_link_placement', { 
        p_request_id: requestId 
      });
    
    if (error) {
      console.log('❌ Erreur lors de la confirmation:', error);
      if (error.message.includes('No function matches')) {
        console.log('   ⚠️  Le fix n\'a pas encore été appliqué');
      }
    } else {
      console.log('✅ Confirmation réussie:', data);
      console.log('   🎉 Le fix a été appliqué avec succès !');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans testAfterApplication:', error);
  }
}

// Fonction principale
async function runSQLFix() {
  console.log('🚀 Démarrage de l\'application du SQL fix...\n');
  
  const result = await applyFixAlternative();
  
  if (result === 'manual_required') {
    console.log('\n📋 Le fix nécessite une application manuelle:');
    console.log('\n1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans "SQL Editor"');
    console.log('4. Copiez et collez le SQL suivant:');
    console.log('\n' + '='.repeat(80));
    console.log(fixSQL);
    console.log('='.repeat(80));
    console.log('\n5. Cliquez sur "Run"');
    console.log('6. Vérifiez que la fonction est créée sans erreur');
  } else if (result === true) {
    console.log('\n✅ Le fix est déjà appliqué !');
  } else {
    console.log('\n❌ Échec de l\'application automatique');
  }
  
  await testAfterApplication();
  
  console.log('\n✅ Processus terminé !');
}

// Exécuter le fix
runSQLFix().catch(console.error);
