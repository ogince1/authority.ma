#!/usr/bin/env node

/**
 * Script pour appliquer la migration de suppression des champs inutiles
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Application de la migration de suppression des champs...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250123000001_remove_website_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Contenu de la migration:');
    console.log(migrationSQL);
    console.log('\n');

    // Exécuter la migration
    console.log('🚀 Exécution de la migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:', error);
      
      // Essayer une approche alternative avec des requêtes directes
      console.log('\n🔄 Tentative avec des requêtes directes...');
      
      const queries = [
        'ALTER TABLE websites DROP COLUMN IF EXISTS owner_status;',
        'ALTER TABLE websites DROP COLUMN IF EXISTS content_quality;',
        'ALTER TABLE websites DROP COLUMN IF EXISTS average_response_time;',
        'ALTER TABLE websites DROP COLUMN IF EXISTS logo;'
      ];

      for (const query of queries) {
        try {
          console.log(`Exécution: ${query}`);
          const { error: queryError } = await supabase.rpc('exec_sql', { sql: query });
          if (queryError) {
            console.log(`⚠️  ${queryError.message}`);
          } else {
            console.log(`✅ Succès: ${query}`);
          }
        } catch (err) {
          console.log(`⚠️  Erreur: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Migration appliquée avec succès!');
    }

    // Vérifier la structure de la table
    console.log('\n🔍 Vérification de la structure de la table websites...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('websites')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erreur lors de la vérification:', tableError);
    } else {
      console.log('✅ Structure de la table vérifiée');
      if (tableInfo && tableInfo.length > 0) {
        console.log('📋 Colonnes disponibles:', Object.keys(tableInfo[0]));
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la migration
applyMigration().then(() => {
  console.log('\n🏁 Migration terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});