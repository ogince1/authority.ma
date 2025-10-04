import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔄 MIGRATION: placement_url → placed_url');
console.log('='.repeat(80));

async function migratePlacementUrls() {
  try {
    // 1️⃣ Vérifier les demandes avec placement_url mais sans placed_url
    console.log('\n📊 Étape 1: Analyse des données existantes...');
    
    const { data: requestsToMigrate, error: fetchError } = await supabase
      .from('link_purchase_requests')
      .select('id, placement_url, placed_url, anchor_text, target_url, user_id, publisher_id, status')
      .or('placement_url.not.is.null');
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des demandes:', fetchError);
      return;
    }

    console.log(`✅ Total demandes trouvées: ${requestsToMigrate?.length || 0}`);

    // Filtrer seulement celles qui ont placement_url mais pas placed_url
    const needsMigration = requestsToMigrate?.filter(req => 
      req.placement_url && !req.placed_url
    ) || [];

    console.log(`📋 Demandes à migrer (avec placement_url mais sans placed_url): ${needsMigration.length}`);

    if (needsMigration.length === 0) {
      console.log('\n✅ Aucune migration nécessaire. Toutes les demandes sont déjà à jour !');
      return;
    }

    // Afficher les demandes à migrer
    console.log('\n📋 Liste des demandes à migrer:');
    needsMigration.forEach((req, index) => {
      console.log(`   ${index + 1}. ID: ${req.id.slice(0, 8)} | Ancrage: ${req.anchor_text} | URL: ${req.placement_url}`);
    });

    // 2️⃣ Migrer les données
    console.log('\n🔄 Étape 2: Migration des données...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const request of needsMigration) {
      try {
        const { error: updateError } = await supabase
          .from('link_purchase_requests')
          .update({
            placed_url: request.placement_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`   ❌ Erreur pour ${request.id.slice(0, 8)}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Migré: ${request.id.slice(0, 8)} | ${request.anchor_text}`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Exception pour ${request.id.slice(0, 8)}:`, err);
        errorCount++;
      }
    }

    // 3️⃣ Résumé de la migration
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(80));
    console.log(`✅ Migrations réussies: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total traité: ${needsMigration.length}`);

    // 4️⃣ Vérification finale
    console.log('\n🔍 Étape 3: Vérification finale...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('link_purchase_requests')
      .select('id, placed_url, placement_url')
      .or('placed_url.not.is.null,placement_url.not.is.null');

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
      return;
    }

    const withPlacedUrl = verifyData?.filter(r => r.placed_url)?.length || 0;
    const withPlacementUrl = verifyData?.filter(r => r.placement_url)?.length || 0;
    const withBoth = verifyData?.filter(r => r.placed_url && r.placement_url)?.length || 0;

    console.log(`\n📊 État après migration:`);
    console.log(`   - Demandes avec placed_url: ${withPlacedUrl}`);
    console.log(`   - Demandes avec placement_url (ancien): ${withPlacementUrl}`);
    console.log(`   - Demandes avec les deux: ${withBoth}`);

    if (withBoth > 0) {
      console.log(`\n💡 Note: ${withBoth} demandes ont les deux champs. C'est normal pendant la transition.`);
      console.log(`   Les anciennes données (placement_url) peuvent être supprimées plus tard.`);
    }

    console.log('\n✅ MIGRATION TERMINÉE AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('\n❌ ERREUR GÉNÉRALE:', error);
  }
}

// Fonction pour afficher les demandes d'un utilisateur spécifique
async function checkUserRequests(userEmail) {
  try {
    console.log(`\n🔍 Vérification des demandes pour: ${userEmail}`);
    console.log('-'.repeat(80));

    // Récupérer l'utilisateur
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', userEmail);

    if (userError || !users || users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = users[0];
    console.log(`✅ Utilisateur trouvé: ${user.email} (${user.role})`);

    // Récupérer les demandes (annonceur ou éditeur)
    let query = supabase
      .from('link_purchase_requests')
      .select('id, anchor_text, target_url, status, placed_url, placement_url, user_id, publisher_id');

    if (user.role === 'advertiser') {
      query = query.eq('user_id', user.id);
    } else if (user.role === 'publisher') {
      query = query.eq('publisher_id', user.id);
    }

    const { data: requests, error: reqError } = await query;

    if (reqError) {
      console.error('❌ Erreur lors de la récupération des demandes:', reqError);
      return;
    }

    console.log(`\n📋 Total demandes: ${requests?.length || 0}`);

    if (requests && requests.length > 0) {
      console.log('\nDétails des demandes:');
      requests.forEach((req, index) => {
        console.log(`\n${index + 1}. Demande #${req.id.slice(0, 8)}`);
        console.log(`   Ancrage: ${req.anchor_text}`);
        console.log(`   Statut: ${req.status}`);
        console.log(`   placed_url: ${req.placed_url || '❌ vide'}`);
        console.log(`   placement_url: ${req.placement_url || '❌ vide'}`);
        
        if (req.placed_url) {
          console.log(`   ✅ OK - placed_url est défini`);
        } else if (req.placement_url) {
          console.log(`   ⚠️  À MIGRER - placement_url existe mais pas placed_url`);
        } else {
          console.log(`   ℹ️  Pas d'URL de placement`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Menu principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--check' && args[1]) {
    // Mode vérification pour un utilisateur spécifique
    await checkUserRequests(args[1]);
  } else if (args[0] === '--migrate') {
    // Mode migration
    await migratePlacementUrls();
  } else {
    // Afficher l'aide
    console.log('📖 UTILISATION:');
    console.log('');
    console.log('   node migrate-placement-url.js --check <email>');
    console.log('   → Vérifier les demandes d\'un utilisateur');
    console.log('');
    console.log('   node migrate-placement-url.js --migrate');
    console.log('   → Migrer toutes les demandes de placement_url vers placed_url');
    console.log('');
    console.log('Exemples:');
    console.log('   node migrate-placement-url.js --check abderrahimmolatefpro@gmail.com');
    console.log('   node migrate-placement-url.js --migrate');
  }
}

// Exécuter
main();

