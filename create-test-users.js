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

async function createTestUsers() {
  try {
    console.log('=== Création des utilisateurs de test ===\n');
    
    // Créer un annonceur de test
    const advertiserData = {
      id: '9bb8b817-0916-483d-a8dc-4d29382e12a9',
      email: 'advertiser@test.com',
      full_name: 'Test Advertiser',
      role: 'advertiser',
      balance: 10000.00,
      phone: '+212 6 12 34 56 78',
      company: 'Test Company',
      website: 'https://test-company.com'
    };
    
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .upsert([advertiserData])
      .select()
      .single();
    
    if (advertiserError) {
      console.error('Erreur lors de la création de l\'annonceur:', advertiserError);
    } else {
      console.log('✅ Annonceur créé:', advertiser.email);
    }
    
    // Créer un éditeur de test
    const publisherData = {
      id: '187fba7a-38bf-4280-a069-656240b1c630',
      email: 'publisher@test.com',
      full_name: 'Test Publisher',
      role: 'publisher',
      balance: 5000.00,
      phone: '+212 6 98 76 54 32',
      company: 'Test Publisher Company',
      website: 'https://test-publisher.com'
    };
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .upsert([publisherData])
      .select()
      .single();
    
    if (publisherError) {
      console.error('Erreur lors de la création de l\'éditeur:', publisherError);
    } else {
      console.log('✅ Éditeur créé:', publisher.email);
    }
    
    // Vérifier que les utilisateurs ont été créés
    console.log('\n=== Vérification des utilisateurs créés ===\n');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('Erreur lors de la vérification:', usersError);
    } else {
      console.log('Utilisateurs dans la base:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Solde: ${user.balance} MAD`);
      });
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

createTestUsers();
