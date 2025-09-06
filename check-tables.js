import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('Vérification des tables...');
    
    // Vérifier le contenu des tables
    for (const table of ['link_purchase_requests', 'link_purchase_transactions']) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Erreur pour la table ' + table + ':', error);
      } else {
        console.log('Table ' + table + ': ' + count + ' enregistrements');
      }
    }
    
    // Vérifier la structure de la table link_purchase_requests
    console.log('\nVérification de la structure de link_purchase_requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .limit(5);
    
    if (requestsError) {
      console.error('Erreur lors de la récupération des demandes:', requestsError);
    } else {
      console.log('Demandes trouvées:', requests.length);
      if (requests.length > 0) {
        console.log('Exemple de demande:', JSON.stringify(requests[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

checkTables();
