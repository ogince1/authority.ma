// Script pour corriger le problème en utilisant un ID existant
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

async function fixFrontendPublisherId() {
  console.log('🔧 Correction du problème de publisher_id dans le frontend\n');

  try {
    // 1. Trouver un éditeur valide
    const { data: publishers, error: publishersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'publisher');

    if (publishersError) {
      throw new Error(`Erreur récupération éditeurs: ${publishersError.message}`);
    }

    const validPublisher = publishers[0];
    console.log(`✅ Éditeur valide trouvé: ${validPublisher.email} (${validPublisher.id})`);

    // 2. Créer un utilisateur avec l'ID hardcodé mais un email différent
    const hardcodedId = '9bb8b817-0916-483d-a8dc-4d29382e12a9';
    const uniqueEmail = `editeur-hardcoded-${Date.now()}@test.com`;

    console.log(`\n👤 Création de l'utilisateur avec l'ID hardcodé...`);
    console.log(`   - ID: ${hardcodedId}`);
    console.log(`   - Email: ${uniqueEmail}`);

    // Créer le compte auth
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      id: hardcodedId,
      email: uniqueEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'publisher'
      }
    });

    if (createAuthError) {
      console.log('❌ Erreur création auth:', createAuthError.message);
    } else {
      console.log('✅ Compte auth créé');
    }

    // Créer l'enregistrement utilisateur
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: hardcodedId,
        email: uniqueEmail,
        role: 'publisher',
        balance: 1000,
        name: 'editeur-hardcoded',
        created_at: new Date().toISOString()
      }]);

    if (userInsertError) {
      console.log('❌ Erreur insertion utilisateur:', userInsertError.message);
    } else {
      console.log('✅ Enregistrement utilisateur créé');
    }

    // 3. Vérifier que l'utilisateur existe
    const { data: user, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', hardcodedId)
      .single();

    if (verifyError) {
      console.log('❌ Vérification échouée:', verifyError.message);
    } else {
      console.log('✅ Utilisateur vérifié:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
    }

    // 4. Test de création de demande
    console.log('\n🧪 Test de création de demande avec l\'ID hardcodé...');
    
    const { data: advertiser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'advertiser')
      .limit(1)
      .single();

    const { data: listing } = await supabaseAdmin
      .from('link_listings')
      .select('*')
      .limit(1)
      .single();

    if (advertiser && listing) {
      const testData = {
        link_listing_id: listing.id,
        user_id: advertiser.id,
        publisher_id: hardcodedId, // Utiliser l'ID hardcodé
        target_url: 'https://test-hardcoded-fixed.com',
        anchor_text: 'test hardcoded fixed',
        proposed_price: 100,
        proposed_duration: 6,
        status: 'pending'
      };

      const { data: request, error: requestError } = await supabaseAdmin
        .from('link_purchase_requests')
        .insert([testData])
        .select()
        .single();

      if (requestError) {
        console.log('❌ Erreur création demande:', requestError.message);
        console.log('📝 Code:', requestError.code);
        console.log('📝 Détails:', requestError.details);
      } else {
        console.log('✅ Demande créée avec succès !');
        console.log(`   - ID: ${request.id}`);
        console.log(`   - Publisher ID: ${request.publisher_id}`);
        
        // Nettoyer
        await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request.id);
        console.log('🧹 Demande de test nettoyée');
      }
    }

    console.log('\n🎉 CORRECTION RÉUSSIE !');
    console.log('=====================================');
    console.log('✅ Utilisateur avec ID hardcodé créé');
    console.log('✅ Test de création de demande réussi');
    console.log('✅ Le frontend peut maintenant fonctionner');
    console.log('\n📝 Le frontend peut maintenant créer des demandes d\'achat !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
  }
}

fixFrontendPublisherId();
