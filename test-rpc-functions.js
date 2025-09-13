// Test des fonctions RPC disponibles
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Test des fonctions RPC...\n');

async function testRPCFunctions() {
  try {
    // Test de la fonction update_user_balance
    console.log('1️⃣ Test de la fonction update_user_balance...');
    
    const { data, error } = await supabase
      .rpc('update_user_balance', {
        user_id: '187fba7a-38bf-4280-a069-656240b1c630',
        amount: 0,
        operation: 'add'
      });
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ Fonction update_user_balance n\'existe pas');
        console.log('💡 Solution: Créer cette fonction ou utiliser une approche différente');
      } else {
        console.log('⚠️  Fonction existe mais erreur:', error.message);
      }
    } else {
      console.log('✅ Fonction update_user_balance existe');
    }
    
    // Test d'une approche alternative : utiliser une fonction RPC simple
    console.log('\n2️⃣ Test d\'une approche alternative...');
    
    // Créer une fonction RPC simple pour mettre à jour le solde
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_user_balance(
        user_id UUID,
        amount DECIMAL(10,2),
        operation TEXT
      )
      RETURNS BOOLEAN AS $$
      BEGIN
        IF operation = 'add' THEN
          UPDATE users SET balance = balance + amount WHERE id = user_id;
        ELSIF operation = 'subtract' THEN
          UPDATE users SET balance = balance - amount WHERE id = user_id;
        ELSE
          RAISE EXCEPTION 'Operation invalide: %', operation;
        END IF;
        
        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('📋 SQL pour créer la fonction:');
    console.log(createFunctionSQL);
    
    console.log('\n💡 Instructions:');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans "SQL Editor"');
    console.log('4. Copiez et collez le SQL ci-dessus');
    console.log('5. Cliquez sur "Run"');
    
  } catch (error) {
    console.error('❌ Erreur dans testRPCFunctions:', error);
  }
}

// Fonction principale
async function runTest() {
  console.log('🚀 Démarrage du test des fonctions RPC...\n');
  
  await testRPCFunctions();
  
  console.log('\n✅ Test terminé !');
}

// Exécuter le test
runTest().catch(console.error);
