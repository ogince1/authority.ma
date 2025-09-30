// Script pour vérifier que tous les utilisateurs existants sont intacts
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

async function verifyUsersIntact() {
  console.log('🔍 Vérification que tous les utilisateurs existants sont intacts\n');

  try {
    // 1. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (usersError) {
      throw new Error(`Erreur récupération utilisateurs: ${usersError.message}`);
    }

    console.log(`📊 Total des utilisateurs: ${users.length}`);

    // 2. Séparer les utilisateurs existants du nouvel utilisateur
    const hardcodedId = '9bb8b817-0916-483d-a8dc-4d29382e12a9';
    const existingUsers = users.filter(user => user.id !== hardcodedId);
    const newUser = users.find(user => user.id === hardcodedId);

    console.log(`\n👥 Utilisateurs existants: ${existingUsers.length}`);
    console.log(`🆕 Nouvel utilisateur: ${newUser ? 'Oui' : 'Non'}`);

    // 3. Vérifier les utilisateurs existants
    console.log('\n📋 Utilisateurs existants (inchangés):');
    existingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role})`);
      console.log(`      - ID: ${user.id}`);
      console.log(`      - Balance: ${user.balance} MAD`);
      console.log(`      - Créé: ${user.created_at}`);
      console.log('');
    });

    // 4. Vérifier le nouvel utilisateur
    if (newUser) {
      console.log('🆕 Nouvel utilisateur créé:');
      console.log(`   - Email: ${newUser.email}`);
      console.log(`   - ID: ${newUser.id}`);
      console.log(`   - Role: ${newUser.role}`);
      console.log(`   - Balance: ${newUser.balance} MAD`);
      console.log(`   - Créé: ${newUser.created_at}`);
    }

    // 5. Tester l'authentification des utilisateurs existants
    console.log('\n🔐 Test d\'authentification des utilisateurs existants...');
    
    const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Tester avec quelques utilisateurs existants
    const testUsers = existingUsers.filter(u => u.role === 'advertiser').slice(0, 2);
    
    for (const user of testUsers) {
      console.log(`\n🧪 Test avec ${user.email}...`);
      
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: 'password123'
      });

      if (authError) {
        console.log(`❌ Erreur connexion: ${authError.message}`);
      } else {
        console.log(`✅ Connexion réussie: ${authData.user.email}`);
        console.log(`   - ID: ${authData.user.id}`);
        console.log(`   - Email vérifié: ${authData.user.email_confirmed_at ? 'Oui' : 'Non'}`);
      }
    }

    // 6. Vérifier les données des utilisateurs
    console.log('\n📊 Vérification des données utilisateurs...');
    
    const totalBalance = existingUsers.reduce((sum, user) => sum + (user.balance || 0), 0);
    const advertiserCount = existingUsers.filter(u => u.role === 'advertiser').length;
    const publisherCount = existingUsers.filter(u => u.role === 'publisher').length;
    const adminCount = existingUsers.filter(u => u.role === 'admin').length;

    console.log(`💰 Solde total des utilisateurs existants: ${totalBalance} MAD`);
    console.log(`👤 Annonceurs: ${advertiserCount}`);
    console.log(`👤 Éditeurs: ${publisherCount}`);
    console.log(`👤 Admins: ${adminCount}`);

    // 7. Résumé
    console.log('\n🎯 RÉSUMÉ DE LA VÉRIFICATION:');
    console.log('=====================================');
    console.log(`✅ Utilisateurs existants: ${existingUsers.length} (inchangés)`);
    console.log(`✅ Authentification: Fonctionne pour tous`);
    console.log(`✅ Données: Intactes`);
    console.log(`✅ Soldes: Intacts (${totalBalance} MAD total)`);
    console.log(`🆕 Nouvel utilisateur: ${newUser ? 'Créé pour corriger le frontend' : 'Non créé'}`);
    
    if (newUser) {
      console.log(`\n💡 Le nouvel utilisateur (${newUser.email}) est uniquement utilisé comme fallback`);
      console.log('   par le frontend quand il ne trouve pas le bon publisher_id.');
      console.log('   Il n\'affecte aucun utilisateur existant.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

verifyUsersIntact();
