import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VÉRIFICATION IMMÉDIATE DES SOLDES DANS LA TABLE USERS\n');

async function checkCurrentBalances() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, balance, updated_at')
      .in('email', ['abderrahimmolatefpro@gmail.com', 'ogincema@gmail.com'])
      .order('email');

    if (error) {
      console.log('❌ Erreur:', error);
      return;
    }

    console.log(`📊 SOLDES ACTUELS DANS LA TABLE USERS:`);
    console.log(`   Timestamp: ${new Date().toLocaleString()}`);
    console.log('');

    users?.forEach((user) => {
      console.log(`👤 ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   💰 Balance: ${user.balance} MAD`);
      console.log(`   🕒 Dernière mise à jour: ${new Date(user.updated_at).toLocaleString()}`);
      console.log('');
    });

    // Comparer avec les valeurs que vous avez mentionnées
    const advertiser = users?.find(u => u.email === 'abderrahimmolatefpro@gmail.com');
    const publisher = users?.find(u => u.email === 'ogincema@gmail.com');

    console.log(`🔍 COMPARAISON AVEC VOS VALEURS:`);
    console.log(`   Annonceur - Vous: 189 MAD | Table: ${advertiser?.balance} MAD`);
    console.log(`   Éditeur - Vous: 4442.5 MAD | Table: ${publisher?.balance} MAD`);

    if (advertiser?.balance === 189 && publisher?.balance === 4442.5) {
      console.log(`   ✅ PARFAIT ! Les valeurs correspondent exactement !`);
    } else {
      console.log(`   ⚠️  DIFFÉRENCE DÉTECTÉE !`);
      if (advertiser?.balance !== 189) {
        console.log(`      Annonceur: différence de ${Math.abs((advertiser?.balance || 0) - 189)} MAD`);
      }
      if (publisher?.balance !== 4442.5) {
        console.log(`      Éditeur: différence de ${Math.abs((publisher?.balance || 0) - 4442.5)} MAD`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkCurrentBalances();
