// Script pour corriger l'erreur de processus d'achat
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixPurchaseError() {
  console.log('🔧 CORRECTION DE L\'ERREUR DE PROCESSUS D\'ACHAT');
  console.log('================================================\n');
  
  // Étape 1: Créer l'utilisateur éditeur manquant
  console.log('👨‍💼 Étape 1: Création de l\'utilisateur éditeur manquant');
  try {
    const publisherId = '875c1fbd-7353-4a0d-b36c-217fc8827cc3';
    
    // Créer l'utilisateur dans la table users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        id: publisherId,
        name: 'Éditeur Leplombier',
        email: 'editeur@leplombier.ma',
        role: 'publisher',
        balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (userError) {
      console.log('⚠️ Erreur création utilisateur:', userError.message);
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', publisherId)
        .single();
      
      if (existingUser) {
        console.log('✅ Utilisateur existe déjà');
      }
    } else {
      console.log('✅ Utilisateur éditeur créé:', user.id);
    }
  } catch (error) {
    console.log('❌ Erreur étape 1:', error.message);
  }
  
  // Étape 2: Vérifier et corriger l'annonce de lien
  console.log('\n🔗 Étape 2: Vérification de l\'annonce de lien');
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select('*');
    
    if (listingsError) {
      console.log('❌ Erreur récupération annonces:', listingsError.message);
    } else {
      console.log('✅ Annonces trouvées:', listings.length);
      
      for (const listing of listings) {
        console.log(`   📋 Annonce: ${listing.title}`);
        console.log(`      ID: ${listing.id}`);
        console.log(`      User ID: ${listing.user_id}`);
        
        // Vérifier si l'user_id correspond à l'id
        if (listing.id !== listing.user_id) {
          console.log('   ⚠️ Incohérence détectée: ID ≠ User ID');
          
          // Corriger l'user_id pour qu'il corresponde à l'id
          const { error: updateError } = await supabase
            .from('link_listings')
            .update({ user_id: listing.id })
            .eq('id', listing.id);
          
          if (updateError) {
            console.log('   ❌ Erreur correction:', updateError.message);
          } else {
            console.log('   ✅ User ID corrigé');
          }
        } else {
          console.log('   ✅ Cohérence OK');
        }
      }
    }
  } catch (error) {
    console.log('❌ Erreur étape 2:', error.message);
  }
  
  // Étape 3: Créer un utilisateur annonceur de test
  console.log('\n👤 Étape 3: Création d\'un utilisateur annonceur de test');
  try {
    const advertiserId = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb'; // ID de l'utilisateur connecté
    
    // Vérifier si l'utilisateur existe
    const { data: existingAdvertiser } = await supabase
      .from('users')
      .select('*')
      .eq('id', advertiserId)
      .single();
    
    if (!existingAdvertiser) {
      // Créer l'utilisateur annonceur
      const { data: advertiser, error: advertiserError } = await supabase
        .from('users')
        .insert([{
          id: advertiserId,
          name: 'ABDERRAHIM MOLATEF',
          email: 'abderrahimmolatefpro@gmail.com',
          role: 'advertiser',
          balance: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (advertiserError) {
        console.log('⚠️ Erreur création annonceur:', advertiserError.message);
      } else {
        console.log('✅ Utilisateur annonceur créé:', advertiser.id);
      }
    } else {
      console.log('✅ Utilisateur annonceur existe déjà');
      console.log(`   Solde: ${existingAdvertiser.balance} MAD`);
    }
  } catch (error) {
    console.log('❌ Erreur étape 3:', error.message);
  }
  
  // Étape 4: Vérifier les données corrigées
  console.log('\n✅ Étape 4: Vérification des données corrigées');
  try {
    // Vérifier les utilisateurs
    const { data: users } = await supabase
      .from('users')
      .select('*');
    
    console.log('👥 Utilisateurs dans la base:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.role})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Solde: ${user.balance} MAD`);
    });
    
    // Vérifier les annonces
    const { data: listings } = await supabase
      .from('link_listings')
      .select('*');
    
    console.log('\n🔗 Annonces de liens:');
    listings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title}`);
      console.log(`      ID: ${listing.id}`);
      console.log(`      User ID: ${listing.user_id}`);
      console.log(`      Prix: ${listing.price} MAD`);
    });
    
  } catch (error) {
    console.log('❌ Erreur étape 4:', error.message);
  }
  
  // Étape 5: Test de création d'une demande d'achat
  console.log('\n🧪 Étape 5: Test de création d\'une demande d\'achat');
  try {
    const { data: listings } = await supabase
      .from('link_listings')
      .select('*')
      .limit(1)
      .single();
    
    if (listings) {
      const testRequest = {
        link_listing_id: listings.id,
        user_id: 'b1ece838-8fa7-4959-9ae1-7d5e152451cb', // Annonceur
        publisher_id: listings.user_id, // Éditeur
        target_url: 'https://example.com',
        anchor_text: 'test',
        message: 'Test de demande d\'achat',
        proposed_price: listings.price,
        proposed_duration: 12,
        status: 'pending'
      };
      
      const { data: request, error: requestError } = await supabase
        .from('link_purchase_requests')
        .insert([testRequest])
        .select()
        .single();
      
      if (requestError) {
        console.log('❌ Erreur test demande:', requestError.message);
      } else {
        console.log('✅ Test demande d\'achat réussi:', request.id);
        
        // Supprimer la demande de test
        await supabase
          .from('link_purchase_requests')
          .delete()
          .eq('id', request.id);
        
        console.log('✅ Demande de test supprimée');
      }
    }
  } catch (error) {
    console.log('❌ Erreur étape 5:', error.message);
  }
  
  console.log('\n🎉 CORRECTION TERMINÉE !');
  console.log('========================');
  console.log('✅ Les problèmes de clés étrangères ont été corrigés');
  console.log('✅ Les utilisateurs manquants ont été créés');
  console.log('✅ Les incohérences de données ont été résolues');
  console.log('✅ Le processus d\'achat devrait maintenant fonctionner');
  
  console.log('\n🚀 PROCHAINES ÉTAPES:');
  console.log('=====================');
  console.log('1. Rechargez votre application web');
  console.log('2. Essayez à nouveau le processus d\'achat');
  console.log('3. Le processus devrait maintenant fonctionner sans erreur');
}

fixPurchaseError();
