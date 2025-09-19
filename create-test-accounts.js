// Script pour créer des comptes test (annonceur et éditeur)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAccounts() {
  console.log('🚀 Création des comptes test...\n');

  try {
    // 1. Créer un compte annonceur
    console.log('1️⃣ Création du compte annonceur...');
    const { data: advertiserAuth, error: advertiserAuthError } = await supabase.auth.signUp({
      email: 'annonceur@test.com',
      password: 'password123',
      options: {
        data: {
          name: 'Jean Annonceur',
          role: 'advertiser'
        }
      }
    });

    if (advertiserAuthError) {
      console.log('⚠️  Compte annonceur existe peut-être déjà:', advertiserAuthError.message);
    } else {
      console.log('✅ Compte annonceur créé:', advertiserAuth.user?.email);
    }

    // 2. Créer un compte éditeur
    console.log('\n2️⃣ Création du compte éditeur...');
    const { data: publisherAuth, error: publisherAuthError } = await supabase.auth.signUp({
      email: 'editeur@test.com',
      password: 'password123',
      options: {
        data: {
          name: 'Marie Éditeur',
          role: 'publisher'
        }
      }
    });

    if (publisherAuthError) {
      console.log('⚠️  Compte éditeur existe peut-être déjà:', publisherAuthError.message);
    } else {
      console.log('✅ Compte éditeur créé:', publisherAuth.user?.email);
    }

    // 3. Créer les profils utilisateurs
    console.log('\n3️⃣ Création des profils utilisateurs...');
    
    // Profil annonceur
    const advertiserProfile = {
      id: advertiserAuth?.user?.id || 'temp-advertiser-id',
      name: 'Jean Annonceur',
      email: 'annonceur@test.com',
      role: 'advertiser',
      balance: 1000, // 1000 MAD de crédit
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: advertiserProfileError } = await supabase
      .from('users')
      .upsert(advertiserProfile);

    if (advertiserProfileError) {
      console.log('⚠️  Erreur profil annonceur:', advertiserProfileError.message);
    } else {
      console.log('✅ Profil annonceur créé');
    }

    // Profil éditeur
    const publisherProfile = {
      id: publisherAuth?.user?.id || 'temp-publisher-id',
      name: 'Marie Éditeur',
      email: 'editeur@test.com',
      role: 'publisher',
      balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: publisherProfileError } = await supabase
      .from('users')
      .upsert(publisherProfile);

    if (publisherProfileError) {
      console.log('⚠️  Erreur profil éditeur:', publisherProfileError.message);
    } else {
      console.log('✅ Profil éditeur créé');
    }

    // 4. Afficher les comptes créés
    console.log('\n4️⃣ Résumé des comptes créés:');
    console.log('📧 Annonceur: annonceur@test.com / password123');
    console.log('📧 Éditeur: editeur@test.com / password123');
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces comptes sur http://localhost:5173');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTestAccounts();
