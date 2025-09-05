import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    console.log('=== Test d\'authentification ===\n');
    
    // Test de connexion pour l'annonceur
    console.log('--- Test connexion annonceur ---');
    const { data: advertiserData, error: advertiserError } = await supabase.auth.signInWithPassword({
      email: 'advertiser@test.com',
      password: 'password'
    });
    
    if (advertiserError) {
      console.error('❌ Erreur connexion annonceur:', advertiserError);
    } else {
      console.log('✅ Connexion annonceur réussie:', advertiserData.user.email);
      console.log('ID utilisateur:', advertiserData.user.id);
    }
    
    // Déconnexion
    await supabase.auth.signOut();
    
    // Test de connexion pour l'éditeur
    console.log('\n--- Test connexion éditeur ---');
    const { data: publisherData, error: publisherError } = await supabase.auth.signInWithPassword({
      email: 'publisher@test.com',
      password: 'password'
    });
    
    if (publisherError) {
      console.error('❌ Erreur connexion éditeur:', publisherError);
    } else {
      console.log('✅ Connexion éditeur réussie:', publisherData.user.email);
      console.log('ID utilisateur:', publisherData.user.id);
    }
    
    // Déconnexion
    await supabase.auth.signOut();
    
    console.log('\n=== Test terminé ===');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAuth();
