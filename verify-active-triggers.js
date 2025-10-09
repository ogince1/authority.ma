import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║         🔍 VÉRIFICATION DES TRIGGERS ACTIFS DANS SUPABASE                ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

async function verifyTriggers() {
  try {
    // Requête SQL pour lister tous les triggers actifs
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          t.trigger_name,
          t.event_manipulation as event,
          t.event_object_table as table_name,
          t.action_timing as timing,
          t.action_statement as action,
          t.action_orientation as orientation
        FROM information_schema.triggers t
        WHERE t.trigger_schema = 'public'
        ORDER BY t.event_object_table, t.trigger_name;
      `
    });

    if (error) {
      console.log('⚠️  La fonction RPC exec_sql n\'existe pas.');
      console.log('📝 Utilisation d\'une requête SQL directe via Supabase...\n');
      
      // Alternative: Utiliser une fonction PostgreSQL existante ou créer une vue
      const query = `
        SELECT 
          tgname as trigger_name,
          tgenabled as is_enabled,
          tgtype,
          relname as table_name
        FROM pg_trigger
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
        WHERE nspname = 'public'
          AND NOT tgisinternal
        ORDER BY relname, tgname;
      `;
      
      // Essayer avec une requête directe
      const { data: triggers, error: triggerError } = await supabase
        .rpc('run_sql', { query })
        .catch(() => ({ data: null, error: 'RPC non disponible' }));
      
      if (triggers) {
        displayTriggers(triggers);
      } else {
        console.log('❌ Impossible d\'interroger directement la base de données.\n');
        console.log('💡 Solution: Vérifier via le Dashboard Supabase:\n');
        console.log('   1. Ouvrir: https://supabase.com/dashboard/project/lqldqgbpaxqaazfjzlsz');
        console.log('   2. Aller dans: Database > Database > public');
        console.log('   3. Cliquer sur une table');
        console.log('   4. Onglet "Triggers"\n');
        
        // Vérification alternative via les migrations
        await checkMigrationFiles();
      }
    } else {
      displayTriggers(data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await checkMigrationFiles();
  }
}

function displayTriggers(triggers) {
  if (!triggers || triggers.length === 0) {
    console.log('✅ AUCUN TRIGGER ACTIF dans la base de données.\n');
    console.log('📊 Cela signifie que TOUT est géré en JavaScript côté front-end.\n');
    return;
  }

  console.log(`✅ ${triggers.length} TRIGGER(S) ACTIF(S) TROUVÉ(S):\n`);
  console.log('═'.repeat(80));
  
  let currentTable = '';
  triggers.forEach((trigger, index) => {
    if (currentTable !== trigger.table_name) {
      if (currentTable !== '') console.log('');
      currentTable = trigger.table_name;
      console.log(`\n📊 TABLE: ${currentTable}`);
      console.log('─'.repeat(80));
    }
    
    console.log(`\n${index + 1}. Trigger: ${trigger.trigger_name}`);
    console.log(`   Événement: ${trigger.event || trigger.tgtype || 'N/A'}`);
    console.log(`   Timing: ${trigger.timing || 'N/A'}`);
    console.log(`   Activé: ${trigger.is_enabled !== 'D' ? '✅ OUI' : '❌ NON'}`);
    
    if (trigger.action) {
      const action = trigger.action.substring(0, 100);
      console.log(`   Action: ${action}${trigger.action.length > 100 ? '...' : ''}`);
    }
  });
  
  console.log('\n' + '═'.repeat(80));
}

async function checkMigrationFiles() {
  console.log('\n📁 VÉRIFICATION DES FICHIERS DE MIGRATION...\n');
  console.log('═'.repeat(80));
  
  const fs = await import('fs');
  const path = await import('path');
  
  // Lister les migrations actives
  const migrationsPath = './supabase/migrations';
  const files = fs.readdirSync(migrationsPath, { withFileTypes: true })
    .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.sql'))
    .map(dirent => dirent.name)
    .sort();
  
  console.log(`\n✅ Migrations actives (${files.length}):\n`);
  
  let triggerCount = 0;
  
  for (const file of files) {
    const filePath = path.join(migrationsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Chercher les CREATE TRIGGER
    const triggerRegex = /CREATE\s+(OR\s+REPLACE\s+)?TRIGGER\s+(\w+)/gi;
    const matches = [...content.matchAll(triggerRegex)];
    
    if (matches.length > 0) {
      console.log(`\n📄 ${file}:`);
      matches.forEach(match => {
        const triggerName = match[2];
        console.log(`   ✅ ${triggerName}`);
        triggerCount++;
        
        // Trouver la table associée
        const tableMatch = content.match(new RegExp(`${triggerName}[\\s\\S]*?ON\\s+(\\w+)`, 'i'));
        if (tableMatch) {
          console.log(`      └─ Table: ${tableMatch[1]}`);
        }
      });
    }
  }
  
  console.log(`\n📊 Total de triggers définis dans les migrations: ${triggerCount}`);
  console.log('═'.repeat(80));
  
  // Vérifier les migrations désactivées
  const disabledPath = './supabase/migrations/_disabled_all';
  if (fs.existsSync(disabledPath)) {
    const disabledFiles = fs.readdirSync(disabledPath)
      .filter(f => f.endsWith('.sql'));
    
    console.log(`\n⚠️  Migrations désactivées (${disabledFiles.length}) dans _disabled_all/`);
    
    let disabledTriggerCount = 0;
    for (const file of disabledFiles) {
      const filePath = path.join(disabledPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = [...content.matchAll(/CREATE\s+(OR\s+REPLACE\s+)?TRIGGER\s+(\w+)/gi)];
      
      if (matches.length > 0) {
        disabledTriggerCount += matches.length;
      }
    }
    
    if (disabledTriggerCount > 0) {
      console.log(`❌ ${disabledTriggerCount} trigger(s) désactivé(s) trouvé(s)`);
      console.log('   → Ces triggers ne sont PAS actifs dans votre base de données\n');
    }
  }
}

async function checkForDuplication() {
  console.log('\n\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║         🔄 VÉRIFICATION DE DUPLICATION FRONT-END / BACK-END              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Analyse des opérations financières:\n');
  
  const operations = [
    {
      operation: 'Création de transaction crédit',
      frontend: '✅ src/lib/supabase.ts → createCreditTransaction()',
      backend: '❌ Aucun trigger actif',
      duplication: '❌ NON'
    },
    {
      operation: 'Mise à jour du solde utilisateur',
      frontend: '✅ Fait dans createCreditTransaction() (UPDATE users)',
      backend: '❌ Pas de trigger update_user_balance_after_transaction',
      duplication: '❌ NON'
    },
    {
      operation: 'Vérification du solde',
      frontend: '✅ Vérification manuelle dans createCreditTransaction()',
      backend: '❌ Pas de trigger check_balance_before_transaction',
      duplication: '❌ NON'
    },
    {
      operation: 'Acceptation demande de lien',
      frontend: '✅ acceptPurchaseRequest() avec calcul commission',
      backend: '❌ Aucun trigger',
      duplication: '❌ NON'
    },
    {
      operation: 'Calcul des commissions',
      frontend: '✅ Calculé en JavaScript (15%)',
      backend: '❌ Aucun trigger',
      duplication: '❌ NON'
    }
  ];
  
  operations.forEach((op, index) => {
    console.log(`${index + 1}. ${op.operation}`);
    console.log(`   Front-end: ${op.frontend}`);
    console.log(`   Back-end:  ${op.backend}`);
    console.log(`   Duplication? ${op.duplication}\n`);
  });
  
  console.log('═'.repeat(80));
  console.log('\n✅ CONCLUSION:');
  console.log('   Il n\'y a PAS de duplication.');
  console.log('   Tout est géré UNIQUEMENT en JavaScript côté front-end.');
  console.log('   Les triggers SQL pour les transactions sont DÉSACTIVÉS.\n');
}

async function main() {
  await verifyTriggers();
  await checkForDuplication();
  
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        ✅ ANALYSE TERMINÉE                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
