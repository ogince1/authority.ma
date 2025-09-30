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

async function createUsersWithFunction() {
  try {
    console.log('=== Création d\'utilisateurs avec la fonction create_test_user ===\n');
    
    // Créer l'annonceur avec la fonction
    const { data: advertiserResult, error: advertiserError } = await supabase
      .rpc('create_test_user', {
        p_id: '9bb8b817-0916-483d-a8dc-4d29382e12a9',
        p_name: 'Test Advertiser',
        p_email: 'advertiser@test.com',
        p_role: 'advertiser',
        p_balance: 10000.00,
        p_phone: '+212 6 12 34 56 78',
        p_website: 'https://test-company.com',
        p_company_name: 'Test Company'
      });
    
    if (advertiserError) {
      console.error('❌ Erreur lors de la création de l\'annonceur:', advertiserError);
    } else {
      console.log('✅ Annonceur créé:', advertiserResult);
    }
    
    // Créer l'éditeur avec la fonction
    const { data: publisherResult, error: publisherError } = await supabase
      .rpc('create_test_user', {
        p_id: '187fba7a-38bf-4280-a069-656240b1c630',
        p_name: 'Test Publisher',
        p_email: 'publisher@test.com',
        p_role: 'publisher',
        p_balance: 5000.00,
        p_phone: '+212 6 98 76 54 32',
        p_website: 'https://test-publisher.com',
        p_company_name: 'Test Publisher Company'
      });
    
    if (publisherError) {
      console.error('❌ Erreur lors de la création de l\'éditeur:', publisherError);
    } else {
      console.log('✅ Éditeur créé:', publisherResult);
    }
    
    // Vérifier les utilisateurs créés
    console.log('\n=== Vérification des utilisateurs ===\n');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Erreur lors de la vérification:', usersError);
    } else {
      console.log('Utilisateurs dans la base:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role} - Solde: ${user.balance} MAD - ID: ${user.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createUsersWithFunction();
