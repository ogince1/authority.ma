import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTriggers() {
  console.log('\n🔍 VÉRIFICATION DES TRIGGERS ACTIFS DANS SUPABASE\n');
  console.log('='.repeat(80));
  
  try {
    // Requête pour lister tous les triggers
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation as event,
          event_object_table as table_name,
          action_timing as timing,
          action_statement as action
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
      `
    });

    if (error) {
      // Si la fonction RPC n'existe pas, utiliser une requête directe
      console.log('⚠️  RPC exec_sql non disponible, tentative avec requête directe...\n');
      
      const query = `
        SELECT 
          t.trigger_name,
          t.event_manipulation,
          t.event_object_table,
          t.action_timing,
          p.proname as function_name
        FROM information_schema.triggers t
        LEFT JOIN pg_trigger tr ON tr.tgname = t.trigger_name
        LEFT JOIN pg_proc p ON p.oid = tr.tgfoid
        WHERE t.trigger_schema = 'public'
        ORDER BY t.event_object_table, t.trigger_name;
      `;
      
      // Utiliser une connexion PostgreSQL directe
      const { Client } = await import('pg');
      
      // Extraire les infos de connexion de l'URL Supabase
      const dbUrl = SUPABASE_URL.replace('https://', '');
      const projectRef = dbUrl.split('.')[0];
      
      const client = new Client({
        host: `db.${dbUrl}`,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'votre_mot_de_passe', // Vous devez fournir le mot de passe
        ssl: { rejectUnauthorized: false }
      });

      await client.connect();
      const result = await client.query(query);
      await client.end();

      if (result.rows.length === 0) {
        console.log('ℹ️  Aucun trigger trouvé dans la base de données.\n');
        return;
      }

      console.log(`\n✅ ${result.rows.length} TRIGGER(S) TROUVÉ(S):\n`);
      
      let currentTable = '';
      result.rows.forEach((trigger, index) => {
        if (currentTable !== trigger.event_object_table) {
          currentTable = trigger.event_object_table;
          console.log(`\n📊 TABLE: ${currentTable}`);
          console.log('-'.repeat(80));
        }
        
        console.log(`\n${index + 1}. ${trigger.trigger_name}`);
        console.log(`   Event: ${trigger.event_manipulation}`);
        console.log(`   Timing: ${trigger.action_timing}`);
        console.log(`   Function: ${trigger.function_name || 'N/A'}`);
      });

    } else {
      console.log('Résultat:', data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Alternative: Vérification via les migrations SQL...\n');
    
    // Lister les triggers depuis les fichiers de migration
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationsPath = './supabase/migrations';
    const files = fs.readdirSync(migrationsPath)
      .filter(f => f.endsWith('.sql') && !f.startsWith('_'))
      .sort();
    
    console.log('📁 Fichiers de migration actifs:\n');
    
    for (const file of files) {
      const filePath = path.join(migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Chercher les CREATE TRIGGER
      const triggerMatches = content.match(/CREATE\s+(OR\s+REPLACE\s+)?TRIGGER\s+(\w+)/gi);
      
      if (triggerMatches && triggerMatches.length > 0) {
        console.log(`\n✅ ${file}:`);
        triggerMatches.forEach(match => {
          const triggerName = match.match(/TRIGGER\s+(\w+)/i)[1];
          console.log(`   - ${triggerName}`);
        });
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Vérification terminée\n');
}

checkTriggers();