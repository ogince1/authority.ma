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

async function checkUsersSchema() {
  try {
    console.log('=== Vérification de la structure de la table users ===\n');
    
    // Essayer de récupérer un utilisateur pour voir la structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      
      // Essayer de créer un utilisateur simple
      console.log('\n--- Tentative de création d\'un utilisateur simple ---');
      const simpleUserData = {
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'advertiser',
        balance: 1000.00
      };
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([simpleUserData])
        .select()
        .single();
      
      if (createError) {
        console.error('Erreur lors de la création simple:', createError);
      } else {
        console.log('✅ Utilisateur simple créé:', newUser);
      }
    } else {
      console.log('Structure de la table users:');
      if (users.length > 0) {
        console.log('Colonnes disponibles:', Object.keys(users[0]));
        console.log('Exemple d\'utilisateur:', users[0]);
      } else {
        console.log('Aucun utilisateur trouvé, mais la table existe');
      }
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

checkUsersSchema();
