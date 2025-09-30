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

async function updateUserProfiles() {
  try {
    console.log('=== Mise à jour des profils utilisateurs ===\n');
    
    // Récupérer tous les utilisateurs auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs auth:', authError);
      return;
    }
    
    console.log('Utilisateurs auth trouvés:', authUsers.users.length);
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
    });
    
    // Mettre à jour les profils
    for (const user of authUsers.users) {
      if (user.email === 'advertiser@test.com') {
        console.log('\n--- Mise à jour profil annonceur ---');
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
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
      
      if (user.email === 'publisher@test.com') {
        console.log('\n--- Mise à jour profil éditeur ---');
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
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
    }
    
    console.log('\n=== Test de connexion ===');
    
    // Test de connexion
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

updateUserProfiles();
