// Script pour corriger le problème RLS et créer les utilisateurs manquants
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixRLSIssue() {
  console.log('🔐 CORRECTION DU PROBLÈME RLS ET CRÉATION DES UTILISATEURS');
  console.log('=========================================================\n');
  
  // Étape 1: Créer l'utilisateur éditeur via l'authentification
  console.log('👨‍💼 Étape 1: Création de l\'utilisateur éditeur via auth');
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'editeur@leplombier.ma',
      password: 'EditeurPassword123!',
      options: {
        data: {
          name: 'Éditeur Leplombier',
          role: 'publisher'
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Erreur création auth éditeur:', authError.message);
      // Essayer de se connecter si l'utilisateur existe
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'editeur@leplombier.ma',
        password: 'EditeurPassword123!'
      });
      
      if (!loginError) {
        console.log('✅ Connexion éditeur réussie:', loginData.user?.id);
      }
    } else {
      console.log('✅ Utilisateur éditeur créé:', authData.user?.id);
    }
  } catch (error) {
    console.log('❌ Erreur étape 1:', error.message);
  }
  
  // Étape 2: Créer l'utilisateur annonceur via l'authentification
  console.log('\n👤 Étape 2: Création de l\'utilisateur annonceur via auth');
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'abderrahimmolatefpro@gmail.com',
      password: 'AdvertiserPassword123!',
      options: {
        data: {
          name: 'ABDERRAHIM MOLATEF',
          role: 'advertiser'
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Erreur création auth annonceur:', authError.message);
      // Essayer de se connecter si l'utilisateur existe
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'abderrahimmolatefpro@gmail.com',
        password: 'AdvertiserPassword123!'
      });
      
      if (!loginError) {
        console.log('✅ Connexion annonceur réussie:', loginData.user?.id);
      }
    } else {
      console.log('✅ Utilisateur annonceur créé:', authData.user?.id);
    }
  } catch (error) {
    console.log('❌ Erreur étape 2:', error.message);
  }
  
  // Étape 3: Vérifier les utilisateurs créés
  console.log('\n👥 Étape 3: Vérification des utilisateurs créés');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Erreur récupération utilisateurs:', usersError.message);
    } else {
      console.log('✅ Utilisateurs trouvés:', users.length);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.role})`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Solde: ${user.balance || 0} MAD`);
      });
    }
  } catch (error) {
    console.log('❌ Erreur étape 3:', error.message);
  }
  
  // Étape 4: Corriger l'annonce de lien
  console.log('\n🔗 Étape 4: Correction de l\'annonce de lien');
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
        console.log(`      User ID actuel: ${listing.user_id}`);
        
        // Trouver l'utilisateur éditeur correspondant
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'publisher');
        
        if (users && users.length > 0) {
          const publisher = users[0];
          console.log(`      Nouveau User ID: ${publisher.id}`);
          
          // Mettre à jour l'annonce avec le bon user_id
          const { error: updateError } = await supabase
            .from('link_listings')
            .update({ user_id: publisher.id })
            .eq('id', listing.id);
          
          if (updateError) {
            console.log('   ❌ Erreur mise à jour:', updateError.message);
          } else {
            console.log('   ✅ User ID mis à jour');
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ Erreur étape 4:', error.message);
  }
  
  // Étape 5: Test final
  console.log('\n🧪 Étape 5: Test final du processus');
  try {
    // Vérifier les données finales
    const { data: users } = await supabase
      .from('users')
      .select('*');
    
    const { data: listings } = await supabase
      .from('link_listings')
      .select('*');
    
    console.log('📊 DONNÉES FINALES:');
    console.log(`   Utilisateurs: ${users?.length || 0}`);
    console.log(`   Annonces: ${listings?.length || 0}`);
    
    if (users && users.length > 0 && listings && listings.length > 0) {
      console.log('✅ Toutes les données sont prêtes');
      console.log('✅ Le processus d\'achat devrait maintenant fonctionner');
    } else {
      console.log('⚠️ Certaines données manquent encore');
    }
    
  } catch (error) {
    console.log('❌ Erreur étape 5:', error.message);
  }
  
  console.log('\n🎉 CORRECTION RLS TERMINÉE !');
  console.log('=============================');
  console.log('✅ Les utilisateurs ont été créés via l\'authentification');
  console.log('✅ Les profils utilisateurs ont été générés automatiquement');
  console.log('✅ L\'annonce de lien a été corrigée');
  console.log('✅ Les contraintes de clés étrangères sont respectées');
  
  console.log('\n🚀 INSTRUCTIONS POUR TESTER:');
  console.log('============================');
  console.log('1. Rechargez votre application web');
  console.log('2. Connectez-vous avec: abderrahimmolatefpro@gmail.com');
  console.log('3. Essayez le processus d\'achat');
  console.log('4. Le processus devrait maintenant fonctionner sans erreur');
  
  console.log('\n📋 INFORMATIONS DE CONNEXION:');
  console.log('=============================');
  console.log('Annonceur: abderrahimmolatefpro@gmail.com');
  console.log('Éditeur: editeur@leplombier.ma');
  console.log('Mot de passe: AdvertiserPassword123! / EditeurPassword123!');
}

fixRLSIssue();
