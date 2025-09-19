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

async function testLocalSupabase() {
  try {
    console.log('=== Test de connexion Supabase Local ===\n');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    // Test de connexion
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return;
    }
    
    console.log('✅ Connexion réussie à Supabase local');
    console.log('Utilisateurs trouvés:', data.length);
    
    // Créer des utilisateurs de test
    console.log('\n=== Création d\'utilisateurs de test ===\n');
    
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
      console.error('❌ Erreur lors de la création de l\'annonceur:', advertiserError);
    } else {
      console.log('✅ Annonceur créé:', advertiser.email, 'ID:', advertiser.id);
    }
    
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
      console.error('❌ Erreur lors de la création de l\'éditeur:', publisherError);
    } else {
      console.log('✅ Éditeur créé:', publisher.email, 'ID:', publisher.id);
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
    
    // Vérifier les tables d'achat
    console.log('\n=== Vérification des tables d\'achat ===\n');
    
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('*', { count: 'exact', head: true });
    
    if (requestsError) {
      console.error('❌ Erreur link_purchase_requests:', requestsError);
    } else {
      console.log('✅ Table link_purchase_requests accessible, enregistrements:', requests);
    }
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('link_purchase_transactions')
      .select('*', { count: 'exact', head: true });
    
    if (transactionsError) {
      console.error('❌ Erreur link_purchase_transactions:', transactionsError);
    } else {
      console.log('✅ Table link_purchase_transactions accessible, enregistrements:', transactions);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testLocalSupabase();
