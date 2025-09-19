// Script pour créer l'éditeur manquant ou corriger le problème
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

async function fixMissingPublisher() {
  console.log('🔧 Correction du problème de l\'éditeur manquant\n');

  const hardcodedId = '9bb8b817-0916-483d-a8dc-4d29382e12a9';

  try {
    // 1. Vérifier si l'ID existe déjà
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', hardcodedId)
      .single();

    if (checkError && checkError.message.includes('JSON object requested, multiple (or no) rows returned')) {
      console.log('❌ L\'ID hardcodé n\'existe pas, création nécessaire');
      
      // 2. Créer l'utilisateur manquant
      console.log('👤 Création de l\'utilisateur manquant...');
      
      const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        id: hardcodedId,
        email: 'editeur@test.com',
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

      // 3. Créer l'enregistrement dans la table users
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: hardcodedId,
          email: 'editeur@test.com',
          role: 'publisher',
          balance: 1000,
          name: 'editeur',
          created_at: new Date().toISOString()
        }]);

      if (userInsertError) {
        console.log('❌ Erreur insertion utilisateur:', userInsertError.message);
      } else {
        console.log('✅ Enregistrement utilisateur créé');
      }

    } else if (checkError) {
      console.log('❌ Erreur vérification:', checkError.message);
    } else {
      console.log('✅ L\'utilisateur existe déjà');
    }

    // 4. Vérifier que l'utilisateur existe maintenant
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
      console.log(`   - Balance: ${user.balance} MAD`);
    }

    // 5. Test de création de demande avec cet utilisateur
    console.log('\n🧪 Test de création de demande...');
    
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
        target_url: 'https://test-hardcoded-id.com',
        anchor_text: 'test hardcoded id',
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
      } else {
        console.log('✅ Demande créée avec succès !');
        console.log(`   - ID: ${request.id}`);
        console.log(`   - Publisher ID: ${request.publisher_id}`);
        
        // Nettoyer
        await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request.id);
        console.log('🧹 Demande de test nettoyée');
      }
    }

    console.log('\n🎉 Correction terminée !');
    console.log('📝 Le frontend peut maintenant utiliser l\'ID hardcodé');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
  }
}

fixMissingPublisher();
