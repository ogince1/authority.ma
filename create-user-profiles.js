// Script pour créer les profils utilisateurs avec la clé de service
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

// Client avec clé de service pour contourner RLS
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function createUserProfiles() {
  console.log('🔧 Création des profils utilisateurs avec clé de service...\n');

  try {
    // 1. Récupérer les utilisateurs créés
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError.message);
      return;
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés`);

    // 2. Créer les profils pour chaque utilisateur
    for (const user of users.users) {
      const userRole = user.user_metadata?.role || 'advertiser';
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      
      const profile = {
        id: user.id,
        name: userName,
        email: user.email,
        role: userRole,
        balance: userRole === 'advertiser' ? 1000 : 0, // 1000 MAD pour annonceur
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert(profile);

      if (profileError) {
        console.log(`⚠️  Erreur profil ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Profil créé: ${user.email} (${userRole})`);
      }
    }

    // 3. Vérifier les profils créés
    console.log('\n📋 Profils utilisateurs dans la base:');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profilesError && profiles) {
      profiles.forEach(profile => {
        console.log(`   👤 ${profile.name} (${profile.email}) - ${profile.role} - ${profile.balance} MAD`);
      });
    }

    console.log('\n🎉 Comptes test prêts !');
    console.log('📧 Annonceur: annonceur@test.com / password123');
    console.log('📧 Éditeur: editeur@test.com / password123');
    console.log('🌐 Connectez-vous sur: http://localhost:5173');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createUserProfiles();
