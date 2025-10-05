import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 DEBUG - Erreur 409 pour golftradition.fr');
console.log('='.repeat(80));

async function debugGolftraditionError() {
  try {
    // 1. Récupérer le site golftradition.fr
    console.log('\n📊 1. Recherche du site golftradition.fr...');
    const { data: websites, error: websiteError } = await supabase
      .from('websites')
      .select('id, title, url, user_id, status')
      .ilike('url', '%golftradition%');
    
    if (websiteError) {
      console.error('❌ Erreur:', websiteError);
      return;
    }

    if (!websites || websites.length === 0) {
      console.log('❌ Site golftradition.fr non trouvé');
      return;
    }

    console.log(`✅ Site trouvé: ${websites[0].title}`);
    console.log(`   ID: ${websites[0].id}`);
    console.log(`   URL: ${websites[0].url}`);
    console.log(`   User ID: ${websites[0].user_id}`);
    console.log(`   Status: ${websites[0].status}`);

    const siteId = websites[0].id;
    const publisherId = websites[0].user_id;

    // 2. Récupérer l'éditeur propriétaire
    console.log('\n👤 2. Propriétaire du site...');
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', publisherId)
      .single();

    if (publisherError) {
      console.error('❌ Erreur:', publisherError);
    } else {
      console.log(`✅ Propriétaire: ${publisher.name} (${publisher.email})`);
      console.log(`   Rôle: ${publisher.role}`);
    }

    // 3. Récupérer les annonces de liens pour ce site
    console.log('\n🔗 3. Annonces de liens pour golftradition.fr...');
    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select('id, title, price, status, user_id, website_id')
      .eq('website_id', siteId);

    if (listingsError) {
      console.error('❌ Erreur:', listingsError);
    } else {
      console.log(`✅ Total annonces: ${listings?.length || 0}`);
      listings?.forEach((listing, index) => {
        console.log(`\n   ${index + 1}. ${listing.title}`);
        console.log(`      ID: ${listing.id}`);
        console.log(`      Prix: ${listing.price} MAD`);
        console.log(`      Status: ${listing.status}`);
        console.log(`      User ID: ${listing.user_id}`);
      });
    }

    // 4. Vérifier les demandes d'achat existantes pour ce site
    console.log('\n📝 4. Demandes d\'achat existantes pour golftradition.fr...');
    
    if (listings && listings.length > 0) {
      const listingIds = listings.map(l => l.id);
      
      const { data: requests, error: requestsError } = await supabase
        .from('link_purchase_requests')
        .select('id, link_listing_id, user_id, publisher_id, status, anchor_text, created_at')
        .in('link_listing_id', listingIds)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('❌ Erreur:', requestsError);
      } else {
        console.log(`✅ Total demandes: ${requests?.length || 0}`);
        
        if (requests && requests.length > 0) {
          requests.forEach((req, index) => {
            console.log(`\n   ${index + 1}. Demande #${req.id.slice(0, 8)}`);
            console.log(`      Annonceur: ${req.user_id}`);
            console.log(`      Status: ${req.status}`);
            console.log(`      Ancrage: ${req.anchor_text}`);
            console.log(`      Date: ${new Date(req.created_at).toLocaleString()}`);
          });

          // 5. Vérifier les demandes en attente (pending)
          const pendingRequests = requests.filter(r => 
            r.status === 'pending' || 
            r.status === 'accepted' || 
            r.status === 'pending_confirmation'
          );

          if (pendingRequests.length > 0) {
            console.log(`\n⚠️  ${pendingRequests.length} demande(s) en cours (pending/accepted):`);
            pendingRequests.forEach((req, index) => {
              console.log(`   ${index + 1}. #${req.id.slice(0, 8)} - ${req.status}`);
            });
            console.log('\n💡 CAUSE PROBABLE: Une demande est déjà en cours pour cette annonce.');
          }
        } else {
          console.log('   Aucune demande trouvée pour ce site');
        }
      }
    }

    // 6. Vérifier les contraintes uniques en base de données
    console.log('\n🔍 5. Vérification des contraintes uniques...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'link_purchase_requests' })
      .then(() => null)
      .catch(() => {
        console.log('   ℹ️  RPC get_table_constraints non disponible');
        return { data: null, error: null };
      });

    // Alternative: Rechercher manuellement les contraintes
    console.log('   Recherche manuelle de doublons potentiels...');
    
    // Récupérer l'utilisateur test qui essaie d'acheter
    const testUsers = await supabase
      .from('users')
      .select('id, email')
      .or('email.eq.abderrahimmolatefpro@gmail.com,email.eq.molatef888@gmail.com');

    if (testUsers.data && testUsers.data.length > 0) {
      console.log('\n👤 Utilisateur(s) test:');
      testUsers.data.forEach(u => console.log(`   - ${u.email} (${u.id})`));

      // Vérifier si une demande existe déjà pour cet utilisateur + ce site
      if (listings && listings.length > 0) {
        for (const user of testUsers.data) {
          const { data: existingRequests, error: existingError } = await supabase
            .from('link_purchase_requests')
            .select('id, status, link_listing_id, created_at')
            .eq('user_id', user.id)
            .in('link_listing_id', listings.map(l => l.id));

          if (!existingError && existingRequests && existingRequests.length > 0) {
            console.log(`\n   ⚠️  ${user.email} a déjà ${existingRequests.length} demande(s):`);
            existingRequests.forEach(req => {
              console.log(`      #${req.id.slice(0, 8)} - ${req.status} - ${new Date(req.created_at).toLocaleDateString()}`);
            });
          }
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 DIAGNOSTIC:');
    console.log('='.repeat(80));
    console.log('1. Vérifiez si une demande en cours existe pour cette annonce');
    console.log('2. Vérifiez les contraintes uniques en base de données');
    console.log('3. Erreur 409 = Conflit (demande dupliquée ou contrainte violée)');

  } catch (error) {
    console.error('\n❌ Erreur générale:', error);
  }
}

debugGolftraditionError();

