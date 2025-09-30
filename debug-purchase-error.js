// Script pour déboguer l'erreur de processus d'achat
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugPurchaseError() {
  console.log('🔍 DÉBOGAGE DE L\'ERREUR DE PROCESSUS D\'ACHAT');
  console.log('==============================================\n');
  
  // Analyser l'erreur
  console.log('❌ ERREUR DÉTECTÉE:');
  console.log('Code: 23503 (Foreign Key Constraint)');
  console.log('Message: Key is not present in table "users"');
  console.log('Table: link_purchase_requests');
  console.log('Contrainte: link_purchase_requests_publisher_id_fkey');
  console.log('Publisher ID problématique: 875c1fbd-7353-4a0d-b36c-217fc8827cc3\n');
  
  // Vérifier les utilisateurs existants
  console.log('👥 VÉRIFICATION DES UTILISATEURS:');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Erreur récupération utilisateurs:', usersError.message);
    } else {
      console.log('✅ Utilisateurs trouvés:', users.length);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Nom: ${user.name}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Rôle: ${user.role}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  
  // Vérifier les annonces de liens
  console.log('🔗 VÉRIFICATION DES ANNONCES DE LIENS:');
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select('*');
    
    if (listingsError) {
      console.log('❌ Erreur récupération annonces:', listingsError.message);
    } else {
      console.log('✅ Annonces trouvées:', listings.length);
      listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ID: ${listing.id}`);
        console.log(`      Titre: ${listing.title}`);
        console.log(`      User ID: ${listing.user_id}`);
        console.log(`      Prix: ${listing.price} ${listing.currency}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  
  // Vérifier les demandes d'achat existantes
  console.log('📝 VÉRIFICATION DES DEMANDES D\'ACHAT:');
  try {
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('*');
    
    if (requestsError) {
      console.log('❌ Erreur récupération demandes:', requestsError.message);
    } else {
      console.log('✅ Demandes trouvées:', requests.length);
      requests.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}`);
        console.log(`      Annonceur: ${request.user_id}`);
        console.log(`      Éditeur: ${request.publisher_id}`);
        console.log(`      Prix: ${request.proposed_price} MAD`);
        console.log(`      Statut: ${request.status}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  
  // Vérifier l'utilisateur actuel
  console.log('🔍 VÉRIFICATION DE L\'UTILISATEUR ACTUEL:');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Utilisateur connecté:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.user_metadata?.name || 'N/A'}`);
      console.log(`   Rôle: ${user.user_metadata?.role || 'N/A'}`);
      
      // Vérifier si le profil existe dans la table users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profil non trouvé dans la table users:', profileError.message);
      } else {
        console.log('✅ Profil trouvé dans la table users');
        console.log(`   Solde: ${profile.balance} MAD`);
      }
    } else {
      console.log('❌ Aucun utilisateur connecté');
    }
  } catch (error) {
    console.log('❌ Erreur vérification utilisateur:', error.message);
  }
  
  // Analyser le problème spécifique
  console.log('🔧 ANALYSE DU PROBLÈME:');
  console.log('========================');
  console.log('Le problème vient du fait que:');
  console.log('1. L\'annonce de lien a un user_id: 875c1fbd-7353-4a0d-b36c-217fc8827cc3');
  console.log('2. Ce user_id est utilisé comme publisher_id dans la demande d\'achat');
  console.log('3. Mais cet utilisateur n\'existe pas dans la table users');
  console.log('4. La contrainte de clé étrangère échoue');
  
  console.log('\n💡 SOLUTIONS POSSIBLES:');
  console.log('=======================');
  console.log('1. Créer l\'utilisateur manquant dans la table users');
  console.log('2. Modifier l\'annonce pour utiliser un user_id existant');
  console.log('3. Corriger la logique de création des demandes d\'achat');
  console.log('4. Vérifier les politiques RLS sur la table users');
}

debugPurchaseError();
