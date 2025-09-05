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

async function checkTableStructure() {
  try {
    console.log('=== Vérification de la structure de la table link_purchase_requests ===\n');
    
    // Vérifier les contraintes de la table
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'link_purchase_requests' });
    
    if (constraintsError) {
      console.log('Impossible de récupérer les contraintes via RPC, essayons une approche différente...');
    } else {
      console.log('Contraintes trouvées:', constraints);
    }
    
    // Essayer de récupérer un enregistrement pour voir la structure
    const { data: records, error: recordsError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .limit(1);
    
    if (recordsError) {
      console.error('❌ Erreur lors de la récupération des enregistrements:', recordsError);
    } else {
      console.log('Structure de la table (basée sur un enregistrement):');
      if (records.length > 0) {
        console.log('Colonnes disponibles:', Object.keys(records[0]));
        console.log('Exemple d\'enregistrement:', records[0]);
      } else {
        console.log('Aucun enregistrement trouvé, mais la table existe');
      }
    }
    
    // Vérifier les colonnes de la table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'link_purchase_requests')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Erreur lors de la récupération des colonnes:', columnsError);
    } else {
      console.log('\nColonnes de la table link_purchase_requests:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTableStructure();
