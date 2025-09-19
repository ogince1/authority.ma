// Script pour vérifier la structure de la table credit_transactions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Vérification de la structure de la table credit_transactions...\n');

async function checkCreditTransactionsSchema() {
  try {
    // 1. Vérifier la structure de la table
    console.log('1️⃣ Structure de la table credit_transactions:');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'credit_transactions' });
    
    if (columnsError) {
      console.log('⚠️  Impossible de récupérer les colonnes via RPC:', columnsError.message);
      
      // Essayer une requête directe
      const { data: directColumns, error: directError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'credit_transactions')
        .eq('table_schema', 'public');
      
      if (directError) {
        console.log('❌ Impossible de récupérer les colonnes:', directError.message);
      } else {
        console.log('📋 Colonnes de la table credit_transactions:');
        directColumns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
      }
    } else {
      console.log('📋 Colonnes récupérées via RPC:', columns);
    }
    
    // 2. Tester l'insertion avec les champs corrects
    console.log('\n2️⃣ Test d\'insertion avec les champs de base:');
    
    const testTransaction = {
      user_id: 'b1ece838-8fa7-4959-9ae1-7d5e152451cb',
      type: 'purchase',
      amount: 10,
      description: 'Test insertion basique',
      currency: 'MAD',
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('credit_transactions')
      .insert([testTransaction])
      .select('id')
      .single();
    
    if (insertError) {
      console.log('❌ Erreur insertion basique:', insertError.message);
      console.log('Code:', insertError.code);
      console.log('Details:', insertError.details);
    } else {
      console.log('✅ Insertion basique réussie:', inserted.id);
      
      // Supprimer la transaction de test
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', inserted.id);
    }
    
    // 3. Tester l'insertion avec les champs problématiques
    console.log('\n3️⃣ Test d\'insertion avec les champs problématiques:');
    
    const testTransactionWithExtra = {
      user_id: 'b1ece838-8fa7-4959-9ae1-7d5e152451cb',
      type: 'purchase',
      amount: 10,
      description: 'Test avec champs supplémentaires',
      currency: 'MAD',
      status: 'completed',
      related_link_listing_id: 'test-id',
      related_purchase_request_id: 'test-request-id',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    const { data: insertedExtra, error: insertExtraError } = await supabase
      .from('credit_transactions')
      .insert([testTransactionWithExtra])
      .select('id')
      .single();
    
    if (insertExtraError) {
      console.log('❌ Erreur insertion avec champs supplémentaires:', insertExtraError.message);
      console.log('Code:', insertExtraError.code);
      console.log('Details:', insertExtraError.details);
    } else {
      console.log('✅ Insertion avec champs supplémentaires réussie:', insertedExtra.id);
      
      // Supprimer la transaction de test
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', insertedExtra.id);
    }
    
    // 4. Solution recommandée
    console.log('\n4️⃣ Solution recommandée:');
    console.log('💡 Si les champs related_link_listing_id et related_purchase_request_id n\'existent pas,');
    console.log('   utilisez seulement les champs de base dans confirmLinkPlacement:');
    console.log('');
    console.log('   const { error: creditTransactionError } = await supabase');
    console.log('     .from(\'credit_transactions\')');
    console.log('     .insert([');
    console.log('       {');
    console.log('         user_id: request.user_id,');
    console.log('         type: \'purchase\',');
    console.log('         amount: request.proposed_price,');
    console.log('         description: \'Achat de lien\',');
    console.log('         currency: \'MAD\',');
    console.log('         status: \'completed\',');
    console.log('         created_at: new Date().toISOString(),');
    console.log('         completed_at: new Date().toISOString()');
    console.log('       },');
    console.log('       {');
    console.log('         user_id: request.publisher_id,');
    console.log('         type: \'deposit\',');
    console.log('         amount: publisherAmount,');
    console.log('         description: \'Vente de lien\',');
    console.log('         currency: \'MAD\',');
    console.log('         status: \'completed\',');
    console.log('         created_at: new Date().toISOString(),');
    console.log('         completed_at: new Date().toISOString()');
    console.log('       }');
    console.log('     ]);');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur dans checkCreditTransactionsSchema:', error);
  }
}

// Fonction principale
async function runCheck() {
  console.log('🚀 Démarrage de la vérification du schéma...\n');
  
  await checkCreditTransactionsSchema();
  
  console.log('\n✅ Vérification terminée !');
}

// Exécuter la vérification
runCheck().catch(console.error);
