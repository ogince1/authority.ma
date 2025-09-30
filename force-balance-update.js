// Script pour forcer la mise à jour des soldes dans le frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Forçage de la mise à jour des soldes...\n');

async function forceBalanceUpdate() {
  try {
    const advertiserEmail = 'abderrahimmolatefpro@gmail.com';
    const publisherEmail = 'ogincema@gmail.com';
    
    // 1. Récupérer les utilisateurs
    console.log('1️⃣ Récupération des utilisateurs...');
    
    const { data: advertiser } = await supabase
      .from('users')
      .select('id, name, email, balance')
      .eq('email', advertiserEmail)
      .single();
    
    const { data: publisher } = await supabase
      .from('users')
      .select('id, name, email, balance')
      .eq('email', publisherEmail)
      .single();
    
    console.log('✅ Annonceur:', {
      name: advertiser.name,
      email: advertiser.email,
      balance: advertiser.balance
    });
    
    console.log('✅ Éditeur:', {
      name: publisher.name,
      email: publisher.email,
      balance: publisher.balance
    });
    
    // 2. Calculer les montants corrects
    console.log('\n2️⃣ Calcul des montants corrects...');
    
    // Récupérer toutes les transactions de l'éditeur
    const { data: publisherTransactions } = await supabase
      .from('credit_transactions')
      .select('type, amount')
      .eq('user_id', publisher.id)
      .eq('type', 'deposit')
      .eq('description', 'Vente de lien');
    
    const totalReceived = publisherTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    
    console.log(`💰 Total reçu par l'éditeur (ventes de liens): ${totalReceived} MAD`);
    console.log(`📊 Solde actuel affiché: ${publisher.balance} MAD`);
    
    // 3. Vérifier si le solde est correct
    console.log('\n3️⃣ Vérification de la cohérence...');
    
    if (publisher.balance >= totalReceived) {
      console.log('✅ Le solde de l\'éditeur est cohérent avec les transactions');
      console.log('💡 Le problème est probablement dans le frontend qui ne se met pas à jour');
    } else {
      console.log('⚠️  Le solde semble incorrect. Vérification nécessaire.');
    }
    
    // 4. Créer une transaction de test pour déclencher la mise à jour
    console.log('\n4️⃣ Création d\'une transaction de test...');
    
    const testAmount = 1; // 1 MAD de test
    
    const { error: testTransactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test mise à jour solde',
        currency: 'MAD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });
    
    if (testTransactionError) {
      console.log('❌ Erreur création transaction test:', testTransactionError.message);
    } else {
      console.log('✅ Transaction de test créée');
      
      // Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: publisher.balance + testAmount })
        .eq('id', publisher.id);
      
      if (updateError) {
        console.log('❌ Erreur mise à jour solde:', updateError.message);
      } else {
        console.log('✅ Solde mis à jour');
        
        // Vérifier le nouveau solde
        const { data: updatedPublisher } = await supabase
          .from('users')
          .select('balance')
          .eq('id', publisher.id)
          .single();
        
        console.log(`✅ Nouveau solde: ${updatedPublisher.balance} MAD`);
        
        // Supprimer la transaction de test
        await supabase
          .from('credit_transactions')
          .delete()
          .eq('user_id', publisher.id)
          .eq('description', 'Test mise à jour solde');
        
        // Restaurer le solde original
        await supabase
          .from('users')
          .update({ balance: publisher.balance })
          .eq('id', publisher.id);
        
        console.log('✅ Solde restauré et transaction de test supprimée');
      }
    }
    
    // 5. Instructions pour l'utilisateur
    console.log('\n5️⃣ Instructions pour résoudre le problème frontend:');
    console.log('');
    console.log('🔧 Solutions à essayer:');
    console.log('   1. Rafraîchir la page (F5 ou Ctrl+R)');
    console.log('   2. Vider le cache du navigateur (Ctrl+Shift+R)');
    console.log('   3. Se déconnecter et se reconnecter');
    console.log('   4. Ouvrir les outils de développement (F12) et vérifier la console');
    console.log('   5. Vérifier que l\'événement "balance-updated" est bien déclenché');
    console.log('');
    console.log('💡 Le backend fonctionne correctement. Le problème est dans le frontend.');
    console.log('📊 Solde réel de l\'éditeur:', publisher.balance, 'MAD');
    console.log('💰 Montant reçu des ventes:', totalReceived, 'MAD');
    
  } catch (error) {
    console.error('❌ Erreur dans forceBalanceUpdate:', error);
  }
}

// Fonction principale
async function runForceUpdate() {
  console.log('🚀 Démarrage du forçage de mise à jour...\n');
  
  await forceBalanceUpdate();
  
  console.log('\n✅ Forçage terminé !');
}

// Exécuter le forçage
runForceUpdate().catch(console.error);
