// Script pour examiner le contenu des tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function examineTables() {
  console.log('🔍 Examen détaillé des tables...\n');
  
  // Examiner les websites
  console.log('🌐 WEBSITES:');
  try {
    const { data: websites, error } = await supabase
      .from('websites')
      .select('*');
    
    if (!error && websites) {
      websites.forEach((site, index) => {
        console.log(`  ${index + 1}. ${site.title}`);
        console.log(`     URL: ${site.url}`);
        console.log(`     Statut: ${site.status}`);
        console.log(`     Catégorie: ${site.category}`);
        console.log(`     Créé: ${new Date(site.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('❌ Erreur:', err.message);
  }
  
  // Examiner les link_listings
  console.log('🔗 LINK_LISTINGS:');
  try {
    const { data: listings, error } = await supabase
      .from('link_listings')
      .select('*');
    
    if (!error && listings) {
      listings.forEach((listing, index) => {
        console.log(`  ${index + 1}. ${listing.title}`);
        console.log(`     Prix: ${listing.price} ${listing.currency}`);
        console.log(`     Type: ${listing.link_type}`);
        console.log(`     Statut: ${listing.status}`);
        console.log(`     Créé: ${new Date(listing.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('❌ Erreur:', err.message);
  }
  
  // Examiner les blog_posts
  console.log('📝 BLOG_POSTS:');
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*');
    
    if (!error && posts) {
      posts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title}`);
        console.log(`     Catégorie: ${post.category}`);
        console.log(`     Statut: ${post.status}`);
        console.log(`     Créé: ${new Date(post.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('❌ Erreur:', err.message);
  }
  
  // Examiner les users
  console.log('👥 USERS:');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (!error && users) {
      if (users.length === 0) {
        console.log('  Aucun utilisateur enregistré');
      } else {
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email})`);
          console.log(`     Rôle: ${user.role}`);
          console.log(`     Créé: ${new Date(user.created_at).toLocaleDateString()}`);
          console.log('');
        });
      }
    }
  } catch (err) {
    console.log('❌ Erreur:', err.message);
  }
}

examineTables();
