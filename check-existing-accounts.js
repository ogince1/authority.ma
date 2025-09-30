// Script pour vérifier les comptes existants
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkExistingAccounts() {
  console.log('🔍 Vérification des comptes existants...\n');

  try {
    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur récupération utilisateurs: ${error.message}`);
    }

    console.log(`📊 Total des utilisateurs: ${users.length}\n`);

    // Grouper par rôle
    const advertisers = users.filter(u => u.role === 'advertiser');
    const publishers = users.filter(u => u.role === 'publisher');
    const admins = users.filter(u => u.role === 'admin');

    console.log('👥 Annonceurs:');
    advertisers.forEach(user => {
      console.log(`   - ${user.email} (${user.balance} MAD) - ${user.full_name}`);
    });

    console.log('\n📝 Éditeurs:');
    publishers.forEach(user => {
      console.log(`   - ${user.email} (${user.balance} MAD) - ${user.full_name}`);
    });

    console.log('\n👑 Admins:');
    admins.forEach(user => {
      console.log(`   - ${user.email} (${user.balance} MAD) - ${user.full_name}`);
    });

    // Vérifier les sites web
    console.log('\n🌐 Sites web:');
    const { data: websites, error: websitesError } = await supabaseAdmin
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false });

    if (websitesError) {
      console.log('❌ Erreur récupération sites:', websitesError.message);
    } else {
      console.log(`📊 Total des sites: ${websites.length}`);
      websites.slice(0, 5).forEach(site => {
        console.log(`   - ${site.title} (${site.url}) - ${site.status}`);
      });
    }

    // Vérifier les listings de liens
    console.log('\n🔗 Listings de liens:');
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('link_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (listingsError) {
      console.log('❌ Erreur récupération listings:', listingsError.message);
    } else {
      console.log(`📊 Total des listings: ${listings.length}`);
      listings.slice(0, 5).forEach(listing => {
        console.log(`   - ${listing.title} (${listing.price} ${listing.currency}) - ${listing.status}`);
      });
    }

    // Vérifier les demandes d'achat
    console.log('\n💳 Demandes d\'achat:');
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('link_purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.log('❌ Erreur récupération demandes:', requestsError.message);
    } else {
      console.log(`📊 Total des demandes: ${requests.length}`);
      requests.slice(0, 5).forEach(request => {
        console.log(`   - ${request.status} - ${request.proposed_price} MAD - ${request.created_at}`);
      });
    }

    // Vérifier les transactions
    console.log('\n💰 Transactions:');
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('link_purchase_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.log('❌ Erreur récupération transactions:', transactionsError.message);
    } else {
      console.log(`📊 Total des transactions: ${transactions.length}`);
      transactions.slice(0, 5).forEach(transaction => {
        console.log(`   - ${transaction.status} - ${transaction.amount} MAD - ${transaction.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkExistingAccounts();
