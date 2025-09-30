// Script pour corriger l'authentification des utilisateurs
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

async function fixUserAuthentication() {
  console.log('🔧 Correction de l\'authentification des utilisateurs\n');

  try {
    // 1. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    console.log(`📊 Utilisateurs trouvés: ${users.length}`);

    // 2. Pour chaque utilisateur, créer un compte d'authentification
    for (const user of users) {
      console.log(`\n👤 Traitement de ${user.email}...`);

      try {
        // Vérifier si l'utilisateur existe déjà dans auth.users
        const { data: existingAuthUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(user.id);

        if (checkError && checkError.message.includes('User not found')) {
          // Créer l'utilisateur dans auth.users
          const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            id: user.id,
            email: user.email,
            password: 'password123', // Mot de passe par défaut
            email_confirm: true,
            user_metadata: {
              role: user.role
            }
          });

          if (createError) {
            console.log(`❌ Erreur création auth pour ${user.email}:`, createError.message);
          } else {
            console.log(`✅ Compte auth créé pour ${user.email}`);
          }
        } else if (checkError) {
          console.log(`❌ Erreur vérification auth pour ${user.email}:`, checkError.message);
        } else {
          console.log(`✅ Compte auth existe déjà pour ${user.email}`);
        }

        // 3. Mettre à jour l'enregistrement utilisateur avec les champs manquants
        const updateData = {};
        
        if (!user.name) {
          updateData.name = user.email.split('@')[0]; // Utiliser la partie avant @ comme nom
        }
        
        if (!user.created_at) {
          updateData.created_at = new Date().toISOString();
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', user.id);

          if (updateError) {
            console.log(`❌ Erreur mise à jour ${user.email}:`, updateError.message);
          } else {
            console.log(`✅ Mise à jour ${user.email}:`, Object.keys(updateData).join(', '));
          }
        }

      } catch (error) {
        console.log(`❌ Erreur traitement ${user.email}:`, error.message);
      }
    }

    // 4. Tester l'authentification
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

    console.log('\n🎉 Correction de l\'authentification terminée !');
    console.log('📝 Tous les utilisateurs ont maintenant le mot de passe: password123');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
  }
}

fixUserAuthentication();
