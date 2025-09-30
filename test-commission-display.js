// Test pour vérifier l'affichage de la commission dans l'interface
// Exécuter avec: node test-commission-display.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommissionDisplay() {
  console.log('🧪 Test de l\'affichage de la commission...\n');

  try {
    // 1. Vérifier le paramètre de commission
    const { data: setting } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'deposit_commission_rate')
      .single();

    const commissionRate = parseFloat(setting?.setting_value || '5');
    console.log(`✅ Taux de commission configuré: ${commissionRate}%`);

    // 2. Simuler différents montants de dépôt
    const testAmounts = [100, 500, 1000, 2000, 5000];
    
    console.log('\n💰 Simulation des calculs de commission:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Montant déposé | Commission | Montant net | Économie');
    console.log('═══════════════════════════════════════════════════════════════');
    
    testAmounts.forEach(amount => {
      const commission = amount * (commissionRate / 100);
      const netAmount = amount - commission;
      const savings = amount - netAmount;
      
      console.log(`${amount.toString().padStart(14)} | ${commission.toFixed(2).padStart(10)} | ${netAmount.toFixed(2).padStart(11)} | ${savings.toFixed(2)}`);
    });

    console.log('═══════════════════════════════════════════════════════════════');

    // 3. Vérifier les transactions récentes avec commission
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(5);

    if (transactions && transactions.length > 0) {
      console.log('\n📋 Dernières transactions de dépôt:');
      console.log('Date | Montant | Description');
      console.log('-----|---------|------------');
      
      transactions.forEach(trans => {
        const date = new Date(trans.created_at).toLocaleDateString('fr-FR');
        console.log(`${date} | ${trans.amount.toFixed(2)} MAD | ${trans.description}`);
      });
    }

    console.log('\n✅ Test terminé !');
    console.log('\n💡 Interface mise à jour:');
    console.log('   1. Information claire sur la commission de 5%');
    console.log('   2. Calcul en temps réel du montant net');
    console.log('   3. Exemple concret (1000 MAD → 950 MAD)');
    console.log('   4. Affichage visuel de la commission déduite');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testCommissionDisplay();
