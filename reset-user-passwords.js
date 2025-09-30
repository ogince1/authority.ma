// Script pour réinitialiser les mots de passe des utilisateurs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetUserPasswords() {
  console.log('🔧 Réinitialisation des mots de passe des utilisateurs\n');

  try {
    // 1. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    console.log(`📊 Utilisateurs trouvés: ${users.length}`);

    // 2. Pour chaque utilisateur, réinitialiser le mot de passe
    for (const user of users) {
      console.log(`\n👤 Réinitialisation mot de passe pour ${user.email}...`);

      try {
        // Réinitialiser le mot de passe
        const { data: authUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password: 'password123',
            email_confirm: true
          }
        );

        if (updateError) {
          console.log(`❌ Erreur réinitialisation ${user.email}:`, updateError.message);
        } else {
          console.log(`✅ Mot de passe réinitialisé pour ${user.email}`);
        }

      } catch (error) {
        console.log(`❌ Erreur traitement ${user.email}:`, error.message);
      }
    }

    // 3. Tester l'authentification
    console.log('\n🧪 Test d\'authentification...');
    
    const testUser = users.find(u => u.role === 'advertiser');
    if (testUser) {
      const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
      
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: testUser.email,
        password: 'password123'
      });

      if (authError) {
        console.log(`❌ Test auth échoué pour ${testUser.email}:`, authError.message);
      } else {
        console.log(`✅ Test auth réussi pour ${testUser.email}`);
        console.log(`   - ID: ${authData.user.id}`);
        console.log(`   - Email: ${authData.user.email}`);
      }
    }

    console.log('\n🎉 Réinitialisation des mots de passe terminée !');
    console.log('📝 Tous les utilisateurs ont maintenant le mot de passe: password123');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
  }
}

resetUserPasswords();
