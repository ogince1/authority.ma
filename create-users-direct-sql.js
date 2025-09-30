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

async function createUsersDirectSQL() {
  try {
    console.log('=== Création d\'utilisateurs avec SQL direct ===\n');
    
    // Utiliser la clé de service pour contourner RLS
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Créer l'annonceur
    const advertiserData = {
      id: '9bb8b817-0916-483d-a8dc-4d29382e12a9',
      name: 'Test Advertiser',
      email: 'advertiser@test.com',
      role: 'advertiser',
      balance: 10000.00,
      phone: '+212 6 12 34 56 78',
      website: 'https://test-company.com',
      company_name: 'Test Company'
    };
    
    const { data: advertiser, error: advertiserError } = await supabaseAdmin
      .from('users')
      .insert([advertiserData])
      .select()
      .single();
    
    if (advertiserError) {
      console.error('❌ Erreur lors de la création de l\'annonceur:', advertiserError);
    } else {
      console.log('✅ Annonceur créé:', advertiser.email, 'ID:', advertiser.id);
    }
    
    // Créer l'éditeur
    const publisherData = {
      id: '187fba7a-38bf-4280-a069-656240b1c630',
      name: 'Test Publisher',
      email: 'publisher@test.com',
      role: 'publisher',
      balance: 5000.00,
      phone: '+212 6 98 76 54 32',
      website: 'https://test-publisher.com',
      company_name: 'Test Publisher Company'
    };
    
    const { data: publisher, error: publisherError } = await supabaseAdmin
      .from('users')
      .insert([publisherData])
      .select()
      .single();
    
    if (publisherError) {
      console.error('❌ Erreur lors de la création de l\'éditeur:', publisherError);
    } else {
      console.log('✅ Éditeur créé:', publisher.email, 'ID:', publisher.id);
    }
    
    // Vérifier les utilisateurs créés
    console.log('\n=== Vérification des utilisateurs ===\n');
    const { data: users, error: usersError } = await supabaseAdmin
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

createUsersDirectSQL();