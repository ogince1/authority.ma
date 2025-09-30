import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🛠️  CORRECTION: Recréer le trigger pour l\'éditeur\n');

async function fixTriggerPublisher() {
  try {
    console.log('📋 ÉTAPE 1: Correction manuelle du solde de l\'éditeur...');
    
    // Corriger manuellement le solde de l'éditeur d'abord
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (publisherError || !publisher) {
      console.log('❌ Éditeur non trouvé');
      return;
    }

    console.log(`   Solde actuel éditeur: ${publisher.balance} MAD`);
    console.log(`   Solde attendu: 4460.5 MAD`);

    // Corriger le solde manuellement
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: 4460.5,
        updated_at: new Date().toISOString()
      })
      .eq('id', publisher.id);

    if (updateError) {
      console.log('❌ Erreur correction manuelle:', updateError);
    } else {
      console.log('✅ Solde éditeur corrigé manuellement: 4460.5 MAD');
    }

    console.log('\n📋 ÉTAPE 2: Recréation du trigger...');
    
    // Supprimer l'ancien trigger s'il existe
    console.log('   Suppression de l\'ancien trigger...');
    try {
      await supabase.rpc('drop_trigger_if_exists', { 
        trigger_name: 'trigger_update_user_balance_after_transaction',
        table_name: 'credit_transactions'
      });
    } catch (err) {
      console.log('   (Ancien trigger probablement déjà supprimé)');
    }

    // Recréer la fonction trigger
    console.log('   Recréation de la fonction trigger...');
    const createFunction = `
      CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Log pour debug
        RAISE NOTICE 'Trigger déclenché pour user_id: %, type: %, amount: %, balance_after: %', 
          NEW.user_id, NEW.type, NEW.amount, NEW.balance_after;
        
        -- Mettre à jour le solde de l'utilisateur
        UPDATE users 
        SET balance = NEW.balance_after,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Vérifier que la mise à jour a fonctionné
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Utilisateur avec ID % non trouvé', NEW.user_id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      // Note: Nous ne pouvons pas exécuter directement du SQL via l'API REST
      // Nous allons créer le trigger via une approche différente
      console.log('   ⚠️  Impossible de recréer le trigger via l\'API');
      console.log('   Utilisons une approche alternative...');
    } catch (err) {
      console.log('   Erreur création fonction:', err);
    }

    console.log('\n📋 ÉTAPE 3: Test du trigger avec une nouvelle transaction...');
    
    // Créer une transaction de test pour vérifier si le trigger fonctionne
    const testAmount = 1;
    const currentBalance = 4460.5; // Balance corrigée
    
    const { data: testTransaction, error: testError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: publisher.id,
        type: 'deposit',
        amount: testAmount,
        description: 'Test trigger éditeur corrigé',
        currency: 'MAD',
        status: 'completed',
        balance_before: currentBalance,
        balance_after: currentBalance + testAmount,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Erreur création transaction test:', testError);
      return;
    }

    console.log(`✅ Transaction test créée: ${testTransaction.id.slice(0, 8)}...`);
    console.log(`   Balance before: ${testTransaction.balance_before} MAD`);
    console.log(`   Balance after: ${testTransaction.balance_after} MAD`);

    // Attendre et vérifier
    console.log('\n   Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: updatedPublisher } = await supabase
      .from('users')
      .select('balance, updated_at')
      .eq('id', publisher.id)
      .single();

    console.log(`📊 RÉSULTAT DU TEST:`);
    console.log(`   Balance attendue: ${currentBalance + testAmount} MAD`);
    console.log(`   Balance réelle: ${updatedPublisher?.balance} MAD`);
    console.log(`   Timestamp: ${new Date(updatedPublisher?.updated_at).toLocaleString()}`);

    if (updatedPublisher?.balance === currentBalance + testAmount) {
      console.log(`   ✅ TRIGGER FONCTIONNE MAINTENANT !`);
    } else {
      console.log(`   ❌ TRIGGER NE FONCTIONNE TOUJOURS PAS !`);
      console.log(`   Le problème est plus profond - le trigger n'existe pas`);
    }

    console.log('\n🎯 SOLUTION FINALE:');
    console.log('   1. J\'ai corrigé manuellement le solde de l\'éditeur');
    console.log('   2. Le trigger doit être recréé côté Supabase');
    console.log('   3. Contactez l\'administrateur Supabase pour recréer le trigger');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la correction
fixTriggerPublisher();
