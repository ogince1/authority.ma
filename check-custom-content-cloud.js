import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomContentColumns() {
  console.log('🔍 Vérification des colonnes custom_content dans Supabase Cloud...\n');

  try {
    // 1. Vérifier la structure de la table link_purchase_requests
    console.log('1. Vérification de la structure de la table link_purchase_requests:');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'link_purchase_requests' });

    if (columnsError) {
      console.log('❌ Erreur lors de la vérification des colonnes:', columnsError.message);
      
      // Alternative: essayer de récupérer quelques enregistrements pour voir la structure
      console.log('\n2. Tentative alternative - récupération d\'un échantillon:');
      const { data: sample, error: sampleError } = await supabase
        .from('link_purchase_requests')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Erreur lors de la récupération d\'échantillon:', sampleError.message);
      } else if (sample && sample.length > 0) {
        console.log('✅ Structure de la table (échantillon):');
        console.log('Colonnes disponibles:', Object.keys(sample[0]));
        
        const hasCustomContent = 'custom_content' in sample[0];
        const hasContentOption = 'content_option' in sample[0];
        
        console.log(`- custom_content: ${hasCustomContent ? '✅ Présent' : '❌ Manquant'}`);
        console.log(`- content_option: ${hasContentOption ? '✅ Présent' : '❌ Manquant'}`);
      } else {
        console.log('⚠️ Aucun enregistrement trouvé dans la table');
      }
    } else {
      console.log('✅ Colonnes de la table link_purchase_requests:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    }

    // 2. Vérifier s'il y a des enregistrements avec du contenu personnalisé
    console.log('\n3. Vérification des enregistrements avec contenu personnalisé:');
    const { data: customContentRecords, error: customError } = await supabase
      .from('link_purchase_requests')
      .select('id, custom_content, content_option, created_at')
      .not('custom_content', 'is', null)
      .limit(5);

    if (customError) {
      console.log('❌ Erreur lors de la récupération du contenu personnalisé:', customError.message);
    } else if (customContentRecords && customContentRecords.length > 0) {
      console.log(`✅ ${customContentRecords.length} enregistrement(s) avec contenu personnalisé trouvé(s):`);
      customContentRecords.forEach((record, index) => {
        console.log(`\nEnregistrement ${index + 1}:`);
        console.log(`- ID: ${record.id}`);
        console.log(`- Content Option: ${record.content_option}`);
        console.log(`- Custom Content: ${record.custom_content ? record.custom_content.substring(0, 100) + '...' : 'Vide'}`);
        console.log(`- Date: ${record.created_at}`);
      });
    } else {
      console.log('⚠️ Aucun enregistrement avec contenu personnalisé trouvé');
    }

    // 3. Vérifier tous les enregistrements récents
    console.log('\n4. Vérification des enregistrements récents:');
    const { data: recentRecords, error: recentError } = await supabase
      .from('link_purchase_requests')
      .select('id, content_option, custom_content, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.log('❌ Erreur lors de la récupération des enregistrements récents:', recentError.message);
    } else if (recentRecords && recentRecords.length > 0) {
      console.log(`✅ ${recentRecords.length} enregistrement(s) récent(s) trouvé(s):`);
      recentRecords.forEach((record, index) => {
        console.log(`\nEnregistrement ${index + 1}:`);
        console.log(`- ID: ${record.id}`);
        console.log(`- Content Option: ${record.content_option || 'Non défini'}`);
        console.log(`- Custom Content: ${record.custom_content ? 'Présent' : 'Absent'}`);
        console.log(`- Date: ${record.created_at}`);
      });
    } else {
      console.log('⚠️ Aucun enregistrement récent trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Fonction pour créer les colonnes si elles n'existent pas
async function createCustomContentColumns() {
  console.log('\n🔧 Tentative de création des colonnes custom_content...\n');

  try {
    // Créer la colonne custom_content
    const { error: customContentError } = await supabase
      .rpc('exec_sql', { 
        sql: `ALTER TABLE link_purchase_requests ADD COLUMN IF NOT EXISTS custom_content TEXT;` 
      });

    if (customContentError) {
      console.log('❌ Erreur lors de la création de custom_content:', customContentError.message);
    } else {
      console.log('✅ Colonne custom_content créée ou déjà présente');
    }

    // Créer la colonne content_option
    const { error: contentOptionError } = await supabase
      .rpc('exec_sql', { 
        sql: `ALTER TABLE link_purchase_requests ADD COLUMN IF NOT EXISTS content_option VARCHAR(20) DEFAULT 'platform' CHECK (content_option IN ('platform', 'custom'));` 
      });

    if (contentOptionError) {
      console.log('❌ Erreur lors de la création de content_option:', contentOptionError.message);
    } else {
      console.log('✅ Colonne content_option créée ou déjà présente');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des colonnes:', error.message);
  }
}

// Exécution
async function main() {
  await checkCustomContentColumns();
  await createCustomContentColumns();
  
  console.log('\n🔄 Vérification finale après création des colonnes:');
  await checkCustomContentColumns();
}

main().catch(console.error);
