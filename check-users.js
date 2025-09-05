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

async function checkUsers() {
  try {
    console.log('=== Vérification des utilisateurs ===\n');
    
    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }
    
    console.log('Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Solde: ${user.balance} MAD`);
    });
    
    // Vérifier les liens disponibles
    console.log('\n=== Vérification des liens ===\n');
    const { data: links, error: linksError } = await supabase
      .from('link_listings')
      .select('*')
      .limit(10);
    
    if (linksError) {
      console.error('Erreur lors de la récupération des liens:', linksError);
      return;
    }
    
    console.log('Liens trouvés:', links.length);
    links.forEach(link => {
      console.log(`- ${link.title} (${link.price} MAD) - Propriétaire: ${link.user_id}`);
    });
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

checkUsers();
