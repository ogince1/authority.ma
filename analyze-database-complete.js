import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 ANALYSE COMPLÈTE DE LA BASE DE DONNÉES SUPABASE');
console.log('='.repeat(80));

async function analyzeDatabase() {
  try {
    console.log('\n📊 1. ANALYSE DES TABLES');
    console.log('-'.repeat(80));
    
    // Récupérer la liste des tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_info');
    
    if (tablesError) {
      console.log('⚠️  Fonction RPC get_tables_info non disponible, utilisation de la méthode alternative...');
      
      // Liste manuelle des tables principales
      const mainTables = [
        'users',
        'websites', 
        'link_listings',
        'link_purchase_requests',
        'link_purchase_transactions',
        'credit_transactions',
        'balance_requests',
        'conversations',
        'conversation_messages',
        'notifications',
        'services',
        'service_requests',
        'blog_posts',
        'success_stories',
        'email_history',
        'email_preferences'
      ];
      
      console.log('\n📋 Tables principales du système :');
      for (const tableName of mainTables) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`   ✅ ${tableName.padEnd(30)} → ${count || 0} enregistrements`);
        } else {
          console.log(`   ❌ ${tableName.padEnd(30)} → Erreur: ${error.message}`);
        }
      }
    }

    console.log('\n\n👥 2. ANALYSE DES UTILISATEURS');
    console.log('-'.repeat(80));
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, balance, created_at');
    
    if (usersError) {
      console.log('❌ Erreur:', usersError.message);
    } else {
      console.log(`\n✅ Total utilisateurs: ${users.length}`);
      
      const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par rôle:');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count}`);
      });
      
      const totalBalance = users.reduce((sum, user) => sum + (parseFloat(user.balance) || 0), 0);
      console.log(`\n💰 Solde total plateforme: ${totalBalance.toFixed(2)} MAD`);
      
      console.log('\n📋 Liste des utilisateurs:');
      users.forEach(user => {
        console.log(`   ${user.role.padEnd(12)} | ${user.name.padEnd(25)} | ${user.email.padEnd(30)} | ${parseFloat(user.balance).toFixed(2).padStart(10)} MAD`);
      });
    }

    console.log('\n\n🌐 3. ANALYSE DES SITES WEB');
    console.log('-'.repeat(80));
    
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, title, url, category, status, user_id, new_article_price, is_new_article, created_at');
    
    if (websitesError) {
      console.log('❌ Erreur:', websitesError.message);
    } else {
      console.log(`\n✅ Total sites web: ${websites.length}`);
      
      const statusStats = websites.reduce((acc, site) => {
        acc[site.status] = (acc[site.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par statut:');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      console.log('\n📋 Liste des sites web:');
      websites.forEach(site => {
        const price = site.is_new_article ? `${site.new_article_price} MAD` : 'N/A';
        console.log(`   ${site.status.padEnd(15)} | ${site.title.padEnd(30)} | ${site.category.padEnd(20)} | Prix: ${price}`);
      });
    }

    console.log('\n\n🔗 4. ANALYSE DES LIENS');
    console.log('-'.repeat(80));
    
    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select('id, title, link_type, position, price, status, created_at');
    
    if (listingsError) {
      console.log('❌ Erreur:', listingsError.message);
    } else {
      console.log(`\n✅ Total annonces de liens: ${listings.length}`);
      
      const typeStats = listings.reduce((acc, link) => {
        acc[link.link_type] = (acc[link.link_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par type:');
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
      
      const avgPrice = listings.reduce((sum, link) => sum + parseFloat(link.price), 0) / listings.length;
      console.log(`\n💰 Prix moyen: ${avgPrice.toFixed(2)} MAD`);
    }

    console.log('\n\n📝 5. ANALYSE DES DEMANDES D\'ACHAT');
    console.log('-'.repeat(80));
    
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id, status, proposed_price, content_option, user_id, publisher_id, created_at');
    
    if (requestsError) {
      console.log('❌ Erreur:', requestsError.message);
    } else {
      console.log(`\n✅ Total demandes: ${requests.length}`);
      
      const statusStats = requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par statut:');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      const totalValue = requests.reduce((sum, req) => sum + parseFloat(req.proposed_price || 0), 0);
      console.log(`\n💰 Valeur totale des demandes: ${totalValue.toFixed(2)} MAD`);
    }

    console.log('\n\n💳 6. ANALYSE DES TRANSACTIONS');
    console.log('-'.repeat(80));
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('id, type, amount, status, user_id, created_at');
    
    if (transactionsError) {
      console.log('❌ Erreur:', transactionsError.message);
    } else {
      console.log(`\n✅ Total transactions: ${transactions.length}`);
      
      const typeStats = transactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par type:');
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
      
      const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      console.log(`\n💰 Volume total: ${totalAmount.toFixed(2)} MAD`);
    }

    console.log('\n\n💼 7. ANALYSE DES DEMANDES DE BALANCE');
    console.log('-'.repeat(80));
    
    const { data: balanceRequests, error: balanceError } = await supabase
      .from('balance_requests')
      .select('id, type, amount, status, payment_method, user_email, created_at');
    
    if (balanceError) {
      console.log('❌ Erreur:', balanceError.message);
    } else {
      console.log(`\n✅ Total demandes de balance: ${balanceRequests.length}`);
      
      const statusStats = balanceRequests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par statut:');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      console.log('\n📋 Demandes récentes:');
      balanceRequests.slice(0, 5).forEach(req => {
        console.log(`   ${req.type.padEnd(15)} | ${req.status.padEnd(12)} | ${req.amount.toString().padStart(8)} MAD | ${req.user_email}`);
      });
    }

    console.log('\n\n💬 8. ANALYSE DU SYSTÈME DE MESSAGERIE');
    console.log('-'.repeat(80));
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, advertiser_id, publisher_id, is_active, created_at');
    
    if (convError) {
      console.log('❌ Erreur:', convError.message);
    } else {
      console.log(`\n✅ Total conversations: ${conversations.length}`);
      
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('id, is_read, created_at');
      
      if (!msgError) {
        const unreadCount = messages.filter(m => !m.is_read).length;
        console.log(`✅ Total messages: ${messages.length}`);
        console.log(`📬 Messages non lus: ${unreadCount}`);
      }
    }

    console.log('\n\n🔔 9. ANALYSE DES NOTIFICATIONS');
    console.log('-'.repeat(80));
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, type, read, user_id, created_at');
    
    if (notifError) {
      console.log('❌ Erreur:', notifError.message);
    } else {
      console.log(`\n✅ Total notifications: ${notifications.length}`);
      
      const unreadCount = notifications.filter(n => !n.read).length;
      console.log(`📬 Notifications non lues: ${unreadCount}`);
      
      const typeStats = notifications.reduce((acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par type:');
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    }

    console.log('\n\n🛠️ 10. ANALYSE DES SERVICES');
    console.log('-'.repeat(80));
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price, status, category, created_at');
    
    if (servicesError) {
      console.log('❌ Erreur:', servicesError.message);
    } else {
      console.log(`\n✅ Total services: ${services.length}`);
      
      console.log('\n📋 Liste des services:');
      services.forEach(service => {
        console.log(`   ${service.status.padEnd(12)} | ${service.name.padEnd(40)} | ${service.price} MAD | ${service.category}`);
      });
      
      const { data: serviceRequests, error: srError } = await supabase
        .from('service_requests')
        .select('id, status, created_at');
      
      if (!srError) {
        console.log(`\n✅ Total demandes de services: ${serviceRequests.length}`);
      }
    }

    console.log('\n\n📰 11. ANALYSE DU BLOG');
    console.log('-'.repeat(80));
    
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, status, category, created_at');
    
    if (blogError) {
      console.log('❌ Erreur:', blogError.message);
    } else {
      console.log(`\n✅ Total articles: ${blogPosts.length}`);
      
      const statusStats = blogPosts.reduce((acc, post) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par statut:');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    console.log('\n\n🏆 12. ANALYSE DES SUCCESS STORIES');
    console.log('-'.repeat(80));
    
    const { data: stories, error: storiesError } = await supabase
      .from('success_stories')
      .select('id, title, status, client_name, created_at');
    
    if (storiesError) {
      console.log('❌ Erreur:', storiesError.message);
    } else {
      console.log(`\n✅ Total success stories: ${stories.length}`);
      
      if (stories.length > 0) {
        console.log('\n📋 Liste:');
        stories.forEach(story => {
          console.log(`   ${story.status.padEnd(12)} | ${story.title.padEnd(40)} | Client: ${story.client_name}`);
        });
      }
    }

    console.log('\n\n📧 13. ANALYSE DU SYSTÈME EMAIL');
    console.log('-'.repeat(80));
    
    const { data: emailHistory, error: emailError } = await supabase
      .from('email_history')
      .select('id, email_type, status, sent_at');
    
    if (emailError) {
      console.log('❌ Erreur:', emailError.message);
    } else {
      console.log(`\n✅ Total emails envoyés: ${emailHistory.length}`);
      
      const statusStats = emailHistory.reduce((acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par statut:');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ ANALYSE TERMINÉE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    console.error(error);
  }
}

// Exécuter l'analyse
analyzeDatabase();

