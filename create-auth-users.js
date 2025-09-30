import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAuthUsers() {
  try {
    console.log('=== Création des utilisateurs d\'authentification ===\n');
    
    // Supprimer les utilisateurs existants
    console.log('--- Suppression des utilisateurs existants ---');
    const { error: deleteError } = await supabase.auth.admin.deleteUser('9bb8b817-0916-483d-a8dc-4d29382e12a9');
    if (deleteError && !deleteError.message.includes('User not found')) {
      console.log('Erreur suppression annonceur:', deleteError.message);
    }
    
    const { error: deleteError2 } = await supabase.auth.admin.deleteUser('187fba7a-38bf-4280-a069-656240b1c630');
    if (deleteError2 && !deleteError2.message.includes('User not found')) {
      console.log('Erreur suppression éditeur:', deleteError2.message);
    }
    
    // Créer l'annonceur
    console.log('--- Création de l\'annonceur ---');
    const { data: advertiserData, error: advertiserError } = await supabase.auth.admin.createUser({
      email: 'advertiser@test.com',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        name: 'Test Advertiser',
        role: 'advertiser'
      }
    });
    
    if (advertiserError) {
      console.error('❌ Erreur création annonceur:', advertiserError);
    } else {
      console.log('✅ Annonceur créé:', advertiserData.user.email);
      console.log('ID:', advertiserData.user.id);
      
      // Mettre à jour le profil dans public.users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: advertiserData.user.id,
          name: 'Test Advertiser',
          email: 'advertiser@test.com',
          role: 'advertiser',
          balance: 10000.00
        });
      
      if (profileError) {
        console.error('❌ Erreur profil annonceur:', profileError);
      } else {
        console.log('✅ Profil annonceur mis à jour');
      }
    }
    
    // Créer l'éditeur
    console.log('\n--- Création de l\'éditeur ---');
    const { data: publisherData, error: publisherError } = await supabase.auth.admin.createUser({
      email: 'publisher@test.com',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        name: 'Test Publisher',
        role: 'publisher'
      }
    });
    
    if (publisherError) {
      console.error('❌ Erreur création éditeur:', publisherError);
    } else {
      console.log('✅ Éditeur créé:', publisherData.user.email);
      console.log('ID:', publisherData.user.id);
      
      // Mettre à jour le profil dans public.users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: publisherData.user.id,
          name: 'Test Publisher',
          email: 'publisher@test.com',
          role: 'publisher',
          balance: 5000.00
        });
      
      if (profileError) {
        console.error('❌ Erreur profil éditeur:', profileError);
      } else {
        console.log('✅ Profil éditeur mis à jour');
      }
    }
    
    console.log('\n=== Test de connexion ===');
    
    // Test de connexion avec l'annonceur
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'advertiser@test.com',
      password: 'password'
    });
    
    if (signInError) {
      console.error('❌ Erreur connexion:', signInError);
    } else {
      console.log('✅ Connexion réussie:', signInData.user.email);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createAuthUsers();
