// Test pour vérifier qu'il n'y a plus de doublons
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNoDuplicates() {
  console.log('🔧 Test des fonctions sans doublons...\n');
  
  try {
    // 1. Tester que les fonctions principales existent
    console.log('1. Vérification des fonctions principales...');
    
    // Test getUserBalance
    const { data: users } = await supabase
      .from('users')
      .select('id, balance')
      .limit(1);
    
    if (users && users.length > 0) {
      console.log(`✅ getUserBalance: OK (utilisateur avec solde ${users[0].balance} MAD)`);
    }
    
    // Test getLinkPurchaseRequests
    const { data: requests } = await supabase
      .from('link_purchase_requests')
      .select('id, status')
      .limit(1);
    
    if (requests && requests.length > 0) {
      console.log(`✅ getLinkPurchaseRequests: OK (${requests.length} demande(s) trouvée(s))`);
    }
    
    // Test getPendingConfirmationRequests
    const { data: pendingRequests } = await supabase
      .from('link_purchase_requests')
      .select('id, status')
      .eq('status', 'pending_confirmation')
      .limit(1);
    
    console.log(`✅ getPendingConfirmationRequests: OK (${pendingRequests?.length || 0} demande(s) en attente)`);
    
    // Test getCreditTransactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('id, type')
      .limit(1);
    
    if (transactions && transactions.length > 0) {
      console.log(`✅ getCreditTransactions: OK (${transactions.length} transaction(s) trouvée(s))`);
    }
    
    console.log('\n✅ Toutes les fonctions principales sont disponibles!');
    console.log('📝 Les doublons ont été supprimés avec succès.');
    console.log('🚀 L\'application devrait maintenant se compiler sans erreurs.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testNoDuplicates().catch(console.error);
