import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Création des fonctions RPC via l\'API REST\n');

async function createRPCViaRest() {
  try {
    // Fonction 1: Vérifier l'état des triggers
    console.log('📋 Création de la fonction check_trigger_status...');
    
    const function1 = `
CREATE OR REPLACE FUNCTION check_trigger_status()
RETURNS TABLE (
  table_name text,
  trigger_name text,
  is_enabled boolean,
  function_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.event_object_table::text as table_name,
    t.trigger_name::text,
    CASE WHEN t.action_timing IS NOT NULL THEN true ELSE false END as is_enabled,
    t.action_statement::text as function_name
  FROM information_schema.triggers t
  WHERE t.event_object_table IN ('credit_transactions', 'users', 'link_purchase_transactions')
  ORDER BY t.event_object_table, t.trigger_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

    // Utiliser l'API REST pour exécuter la requête SQL
    const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: function1 })
    });

    if (response1.ok) {
      console.log('   ✅ check_trigger_status créée');
    } else {
      console.log('   ❌ Erreur création check_trigger_status:', await response1.text());
    }

    // Fonction 2: Réparer les triggers manquants
    console.log('\n📋 Création de la fonction repair_missing_triggers...');
    
    const function2 = `
CREATE OR REPLACE FUNCTION repair_missing_triggers()
RETURNS text AS $$
DECLARE
  result text := '';
BEGIN
  -- Vérifier et recréer le trigger de balance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_user_balance_after_transaction'
  ) THEN
    -- Recréer la fonction de trigger
    CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Mettre à jour le solde de l'utilisateur
      UPDATE users 
      SET balance = NEW.balance_after,
          updated_at = NOW()
      WHERE id = NEW.user_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Recréer le trigger
    CREATE TRIGGER trigger_update_user_balance_after_transaction
      AFTER INSERT ON credit_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_user_balance_after_transaction();
      
    result := result || 'Trigger de balance recréé. ';
  END IF;
  
  -- Vérifier et recréer le trigger de vérification de solde
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_check_balance_before_transaction'
  ) THEN
    -- Recréer la fonction de vérification
    CREATE OR REPLACE FUNCTION check_balance_before_transaction()
    RETURNS TRIGGER AS $$
    DECLARE
      current_balance DECIMAL(10,2);
    BEGIN
      -- Récupérer le solde actuel
      SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
      
      -- Calculer le nouveau solde
      IF NEW.type IN ('deposit', 'refund') THEN
        NEW.balance_after := current_balance + NEW.amount;
      ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
        NEW.balance_after := current_balance - NEW.amount;
        
        -- Vérifier que le solde ne devient pas négatif
        IF NEW.balance_after < 0 THEN
          RAISE EXCEPTION 'Solde insuffisant pour cette transaction';
        END IF;
      END IF;
      
      NEW.balance_before := current_balance;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Recréer le trigger
    CREATE TRIGGER trigger_check_balance_before_transaction
      BEFORE INSERT ON credit_transactions
      FOR EACH ROW
      EXECUTE FUNCTION check_balance_before_transaction();
      
    result := result || 'Trigger de vérification recréé. ';
  END IF;
  
  IF result = '' THEN
    result := 'Tous les triggers sont déjà présents.';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: function2 })
    });

    if (response2.ok) {
      console.log('   ✅ repair_missing_triggers créée');
    } else {
      console.log('   ❌ Erreur création repair_missing_triggers:', await response2.text());
    }

    // Fonction 3: Tester le trigger de balance
    console.log('\n📋 Création de la fonction test_balance_trigger...');
    
    const function3 = `
CREATE OR REPLACE FUNCTION test_balance_trigger(user_id uuid, amount decimal)
RETURNS TABLE (
  before_balance decimal,
  after_balance decimal,
  transaction_id uuid
) AS $$
DECLARE
  current_balance decimal;
  new_balance decimal;
  test_transaction_id uuid;
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO current_balance FROM users WHERE id = user_id;
  
  -- Calculer le nouveau solde
  new_balance := current_balance + amount;
  
  -- Créer une transaction de test
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status,
    balance_before,
    balance_after,
    created_at,
    completed_at
  ) VALUES (
    user_id,
    'deposit',
    amount,
    'Test trigger balance',
    'MAD',
    'completed',
    current_balance,
    new_balance,
    NOW(),
    NOW()
  ) RETURNING id INTO test_transaction_id;
  
  -- Récupérer le solde final
  SELECT balance INTO current_balance FROM users WHERE id = user_id;
  
  RETURN QUERY
  SELECT 
    current_balance - amount as before_balance,
    current_balance as after_balance,
    test_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

    const response3 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: function3 })
    });

    if (response3.ok) {
      console.log('   ✅ test_balance_trigger créée');
    } else {
      console.log('   ❌ Erreur création test_balance_trigger:', await response3.text());
    }

    console.log('\n🎉 Toutes les fonctions RPC ont été créées !');
    
    // Tester les nouvelles fonctions
    console.log('\n🧪 Test des nouvelles fonctions RPC...');
    
    // Test 1: Vérifier l'état des triggers
    const { data: status, error: statusError } = await supabase
      .rpc('check_trigger_status');
    
    if (statusError) {
      console.log('❌ Erreur test statut:', statusError);
    } else {
      console.log('✅ Statut des triggers:');
      status?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.table_name}.${item.trigger_name} (${item.is_enabled ? 'Actif' : 'Inactif'})`);
      });
    }
    
    // Test 2: Réparer les triggers manquants
    const { data: repair, error: repairError } = await supabase
      .rpc('repair_missing_triggers');
    
    if (repairError) {
      console.log('❌ Erreur réparation:', repairError);
    } else {
      console.log('✅ Réparation:', repair);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la création
createRPCViaRest();
