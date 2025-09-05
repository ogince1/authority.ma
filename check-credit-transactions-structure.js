import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreditTransactionsStructure() {
  try {
    console.log('=== Vérification de la structure de la table credit_transactions ===\n');
    
    // Essayer de récupérer un enregistrement pour voir la structure
    const { data: records, error: recordsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(1);
    
    if (recordsError) {
      console.error('❌ Erreur lors de la récupération des enregistrements:', recordsError);
    } else {
      console.log('Structure de la table credit_transactions:');
      if (records.length > 0) {
        console.log('Colonnes disponibles:', Object.keys(records[0]));
        console.log('Exemple d\'enregistrement:', records[0]);
      } else {
        console.log('Aucun enregistrement trouvé, mais la table existe');
      }
    }
    
    // Vérifier les contraintes de clé étrangère
    console.log('\n=== Test de création d\'une transaction de crédit simple ===\n');
    
    const { data: advertiser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'advertiser@test.com')
      .single();
    
    if (advertiser) {
      console.log('Annonceur trouvé:', advertiser.id);
      
      // Essayer de créer une transaction de crédit simple
      const { data: creditTransaction, error: creditError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: advertiser.id,
          type: 'purchase',
          amount: 100.00,
          description: 'Test transaction',
          balance_before: advertiser.balance,
          balance_after: advertiser.balance - 100.00
        }])
        .select()
        .single();
      
      if (creditError) {
        console.error('❌ Erreur lors de la création de la transaction de crédit:', creditError);
      } else {
        console.log('✅ Transaction de crédit créée:', creditTransaction.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkCreditTransactionsStructure();
