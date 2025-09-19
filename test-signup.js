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

async function testSignup() {
  try {
    console.log('=== Test d\'inscription ===\n');
    
    // Test d'inscription
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          name: 'Test User',
          role: 'advertiser'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Erreur inscription:', signupError);
    } else {
      console.log('✅ Inscription réussie:', signupData.user?.email);
      console.log('ID utilisateur:', signupData.user?.id);
      
      if (signupData.user) {
        // Vérifier si le profil a été créé
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Erreur récupération profil:', profileError);
        } else {
          console.log('✅ Profil créé:', profile);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testSignup();
