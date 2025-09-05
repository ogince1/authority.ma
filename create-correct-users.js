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

async function createCorrectUsers() {
  try {
    console.log('=== Création d\'utilisateurs avec la bonne structure ===\n');
    
    // Créer un annonceur de test
    const advertiserData = {
      name: 'Test Advertiser',
      email: 'advertiser@test.com',
      role: 'advertiser',
      balance: 10000.00,
      phone: '+212 6 12 34 56 78',
      website: 'https://test-company.com',
      company_name: 'Test Company'
    };
    
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .insert([advertiserData])
      .select()
      .single();
    
    if (advertiserError) {
      console.error('Erreur lors de la création de l\'annonceur:', advertiserError);
    } else {
      console.log('✅ Annonceur créé:', advertiser.email, 'ID:', advertiser.id);
    }
    
    // Créer un éditeur de test
    const publisherData = {
      name: 'Test Publisher',
      email: 'publisher@test.com',
      role: 'publisher',
      balance: 5000.00,
      phone: '+212 6 98 76 54 32',
      website: 'https://test-publisher.com',
      company_name: 'Test Publisher Company'
    };
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .insert([publisherData])
      .select()
      .single();
    
    if (publisherError) {
      console.error('Erreur lors de la création de l\'éditeur:', publisherError);
    } else {
      console.log('✅ Éditeur créé:', publisher.email, 'ID:', publisher.id);
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
        console.log(`- ${user.name} (${user.email}) - ${user.role} - Solde: ${user.balance} MAD - ID: ${user.id}`);
      });
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

createCorrectUsers();
