// Script de test pour se connecter à Supabase Cloud et vérifier le problème
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Connexion à Supabase Cloud...\n');

// Test 1: Vérifier les statuts disponibles
async function checkAvailableStatuses() {
  console.log('1️⃣ Vérification des statuts disponibles...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_enum_values', { enum_name: 'link_purchase_status' });
    
    if (error) {
      // Alternative: requête directe
      const { data: altData, error: altError } = await supabase
        .from('link_purchase_requests')
        .select('status')
        .not('status', 'is', null);
      
      if (altError) {
        console.error('❌ Erreur:', altError);
        return;
      }
      
      const uniqueStatuses = [...new Set(altData.map(item => item.status))];
      console.log('📊 Statuts trouvés:', uniqueStatuses);
    } else {
      console.log('📊 Statuts disponibles:', data);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des statuts:', error);
  }
}

// Test 2: Vérifier la structure de la table
async function checkTableStructure() {
  console.log('\n2️⃣ Vérification de la structure de la table...');
  
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('📋 Colonnes disponibles:', columns);
      
      // Vérifier les nouvelles colonnes
      const newColumns = ['accepted_at', 'confirmation_deadline', 'confirmed_at', 'auto_confirmed_at', 'payment_transaction_id'];
      const missingColumns = newColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️  Colonnes manquantes:', missingColumns);
        console.log('💡 La migration n\'a peut-être pas été appliquée');
      } else {
        console.log('✅ Toutes les nouvelles colonnes sont présentes');
      }
    } else {
      console.log('ℹ️  Aucune donnée dans la table');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la structure:', error);
  }
}

// Test 3: Vérifier les demandes récentes
async function checkRecentRequests() {
  console.log('\n3️⃣ Vérification des demandes récentes...');
  
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        user_id,
        publisher_id,
        status,
        accepted_at,
        confirmation_deadline,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    console.log('📋 Demandes récentes:');
    data.forEach((request, index) => {
      console.log(`   ${index + 1}. ID: ${request.id}`);
      console.log(`      Status: ${request.status}`);
      console.log(`      Accepté: ${request.accepted_at || 'Non'}`);
      console.log(`      Délai: ${request.confirmation_deadline || 'Non défini'}`);
      console.log(`      Créé: ${request.created_at}`);
      console.log('');
    });
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des demandes récentes:', error);
  }
}

// Test 4: Vérifier les demandes en attente de confirmation
async function checkPendingConfirmationRequests() {
  console.log('\n4️⃣ Vérification des demandes en attente de confirmation...');
  
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        user_id,
        publisher_id,
        status,
        accepted_at,
        confirmation_deadline,
        created_at
      `)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    if (data.length === 0) {
      console.log('ℹ️  Aucune demande en attente de confirmation');
    } else {
      console.log(`📋 ${data.length} demande(s) en attente de confirmation:`);
      data.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}`);
        console.log(`      Annonceur: ${request.user_id}`);
        console.log(`      Éditeur: ${request.publisher_id}`);
        console.log(`      Accepté: ${request.accepted_at}`);
        console.log(`      Délai: ${request.confirmation_deadline}`);
        console.log('');
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des demandes en attente:', error);
  }
}

// Test 5: Vérifier les fonctions RPC
async function checkRPCFunctions() {
  console.log('\n5️⃣ Vérification des fonctions RPC...');
  
  const functions = [
    'accept_purchase_request',
    'confirm_link_placement',
    'auto_confirm_expired_requests'
  ];
  
  for (const funcName of functions) {
    try {
      // Test simple pour voir si la fonction existe
      const { data, error } = await supabase
        .rpc(funcName, { p_request_id: 'test' });
      
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ Fonction ${funcName} n'existe pas`);
        } else {
          console.log(`⚠️  Fonction ${funcName} existe mais erreur:`, error.message);
        }
      } else {
        console.log(`✅ Fonction ${funcName} existe`);
      }
    } catch (error) {
      console.log(`❌ Erreur test ${funcName}:`, error.message);
    }
  }
}

// Test 6: Vérifier les notifications récentes
async function checkRecentNotifications() {
  console.log('\n6️⃣ Vérification des notifications récentes...');
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        message,
        action_type,
        action_url,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    if (data.length === 0) {
      console.log('ℹ️  Aucune notification récente');
    } else {
      console.log(`📋 ${data.length} notification(s) récente(s):`);
      data.forEach((notification, index) => {
        console.log(`   ${index + 1}. Type: ${notification.type}`);
        console.log(`      Message: ${notification.message}`);
        console.log(`      Action: ${notification.action_type}`);
        console.log(`      Créé: ${notification.created_at}`);
        console.log('');
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des notifications:', error);
  }
}

// Test 7: Vérifier les utilisateurs récents
async function checkRecentUsers() {
  console.log('\n7️⃣ Vérification des utilisateurs récents...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    console.log('👥 Utilisateurs récents:');
    data.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name || user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      ID: ${user.id}`);
      console.log('');
    });
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des utilisateurs:', error);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests Supabase Cloud...\n');
  
  await checkAvailableStatuses();
  await checkTableStructure();
  await checkRecentRequests();
  await checkPendingConfirmationRequests();
  await checkRPCFunctions();
  await checkRecentNotifications();
  await checkRecentUsers();
  
  console.log('\n✅ Tests terminés !');
  console.log('\n💡 Analyse des résultats:');
  console.log('   - Si les nouvelles colonnes manquent → Migration non appliquée');
  console.log('   - Si les fonctions RPC manquent → Migration non appliquée');
  console.log('   - Si aucune demande pending_confirmation → Problème dans accept_purchase_request');
  console.log('   - Si pas de notifications → Problème dans createNotification');
}

// Exécuter les tests
runAllTests().catch(console.error);
