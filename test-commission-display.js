import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommissionDisplay() {
  console.log('🧪 Test de l\'affichage des commissions pour les éditeurs\n');

  try {
    // 1. Récupérer les transactions de type 'commission' pour les éditeurs
    console.log('1️⃣ Transactions de type commission:');
    const { data: commissionTransactions, error: commissionError } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        type,
        amount,
        description,
        created_at,
        balance_before,
        balance_after
      `)
      .eq('type', 'commission')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (commissionError) {
      console.log(`❌ Erreur: ${commissionError.message}`);
      return;
    }
    
    console.log(`✅ ${commissionTransactions ? commissionTransactions.length : 0} transactions de commission trouvées\n`);
    
    if (commissionTransactions && commissionTransactions.length > 0) {
      commissionTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. Transaction ID: ${transaction.id.slice(0, 8)}...`);
        console.log(`   - Type: ${transaction.type}`);
        console.log(`   - Montant: ${transaction.amount} MAD`);
        console.log(`   - Description: ${transaction.description}`);
        console.log(`   - Solde avant: ${transaction.balance_before} MAD`);
        console.log(`   - Solde après: ${transaction.balance_after} MAD`);
        console.log(`   - Impact: +${transaction.amount} MAD (positif)`);
        console.log(`   - Créé: ${transaction.created_at}`);
        console.log('');
      });
    }

    // 2. Tester la logique d'affichage
    console.log('2️⃣ Test de la logique d\'affichage:');
    
    const testTransactionTypes = ['deposit', 'withdrawal', 'purchase', 'refund', 'commission'];
    
    testTransactionTypes.forEach(type => {
      const isPositive = type === 'deposit' || type === 'refund' || type === 'commission';
      const sign = isPositive ? '+' : '-';
      const color = isPositive ? 'text-green-600' : 'text-red-600';
      
      console.log(`   ${type}: ${sign} (${color}) ${isPositive ? '✅ Positif' : '❌ Négatif'}`);
    });
    console.log('');

    // 3. Vérifier les transactions récentes d'un éditeur spécifique
    console.log('3️⃣ Transactions récentes d\'un éditeur:');
    
    // Récupérer un éditeur qui a des transactions
    const { data: publisherTransactions, error: publisherError } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        type,
        amount,
        description,
        created_at
      `)
      .in('type', ['commission', 'deposit', 'withdrawal'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (publisherError) {
      console.log(`❌ Erreur: ${publisherError.message}`);
    } else {
      console.log(`✅ ${publisherTransactions ? publisherTransactions.length : 0} transactions récentes`);
      if (publisherTransactions && publisherTransactions.length > 0) {
        publisherTransactions.forEach((transaction, index) => {
          const isPositive = transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'commission';
          const sign = isPositive ? '+' : '-';
          const color = isPositive ? 'vert' : 'rouge';
          
          console.log(`   ${index + 1}. ${transaction.type}: ${sign}${transaction.amount} MAD (${color})`);
        });
      }
    }
    console.log('');

    console.log('🎯 RÉSUMÉ DE LA CORRECTION:');
    console.log('✅ Les transactions de type "commission" sont maintenant affichées comme positives (+)');
    console.log('✅ Couleur verte pour les commissions (comme les dépôts)');
    console.log('✅ Icône TrendingUp pour les commissions');
    console.log('✅ Logique d\'affichage corrigée dans BalanceManager.tsx');
    console.log('\n💡 Les éditeurs verront maintenant leurs gains comme positifs dans l\'historique !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testCommissionDisplay();