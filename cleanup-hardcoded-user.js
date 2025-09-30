// Script pour nettoyer l'utilisateur hardcodé qui n'est plus nécessaire
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

async function cleanupHardcodedUser() {
  console.log('🧹 Nettoyage de l\'utilisateur hardcodé\n');

  const hardcodedId = '9bb8b817-0916-483d-a8dc-4d29382e12a9';

  try {
    // 1. Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', hardcodedId)
      .single();

    if (userError) {
      console.log('❌ Utilisateur hardcodé non trouvé:', userError.message);
      return;
    }

    console.log(`📊 Utilisateur hardcodé trouvé:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Balance: ${user.balance} MAD`);

    // 2. Vérifier s'il y a des demandes d'achat liées à cet utilisateur
    const { data: purchaseRequests, error: requestsError } = await supabaseAdmin
      .from('link_purchase_requests')
      .select('*')
      .eq('publisher_id', hardcodedId);

    if (requestsError) {
      console.log('❌ Erreur récupération demandes:', requestsError.message);
    } else {
      console.log(`📊 Demandes d'achat liées: ${purchaseRequests.length}`);
      
      if (purchaseRequests.length > 0) {
        console.log('⚠️  Des demandes d\'achat sont liées à cet utilisateur');
        console.log('   Il est recommandé de ne pas le supprimer pour préserver l\'intégrité des données');
        console.log('   Vous pouvez le garder comme utilisateur de test ou le désactiver');
        return;
      }
    }

    // 3. Vérifier s'il y a des listings liés à cet utilisateur
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('link_listings')
      .select('*')
      .eq('user_id', hardcodedId);

    if (listingsError) {
      console.log('❌ Erreur récupération listings:', listingsError.message);
    } else {
      console.log(`📊 Listings liés: ${listings.length}`);
      
      if (listings.length > 0) {
        console.log('⚠️  Des listings sont liés à cet utilisateur');
        console.log('   Il est recommandé de ne pas le supprimer pour préserver l\'intégrité des données');
        return;
      }
    }

    // 4. Supprimer l'utilisateur (seulement s'il n'y a pas de données liées)
    console.log('\n🗑️  Suppression de l\'utilisateur hardcodé...');
    
    // Supprimer de la table users
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', hardcodedId);

    if (deleteUserError) {
      console.log('❌ Erreur suppression utilisateur:', deleteUserError.message);
    } else {
      console.log('✅ Utilisateur supprimé de la table users');
    }

    // Supprimer du système d'authentification
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(hardcodedId);

    if (deleteAuthError) {
      console.log('❌ Erreur suppression auth:', deleteAuthError.message);
    } else {
      console.log('✅ Utilisateur supprimé du système d\'authentification');
    }

    // 5. Vérifier la suppression
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', hardcodedId)
      .single();

    if (verifyError && verifyError.message.includes('JSON object requested, multiple (or no) rows returned')) {
      console.log('✅ Utilisateur hardcodé supprimé avec succès');
    } else {
      console.log('⚠️  L\'utilisateur pourrait encore exister');
    }

    console.log('\n🎉 Nettoyage terminé !');
    console.log('📝 L\'utilisateur hardcodé a été supprimé car il n\'était plus nécessaire');
    console.log('✅ Le frontend utilise maintenant les vrais publisher_id');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

cleanupHardcodedUser();
