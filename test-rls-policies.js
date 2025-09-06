// Test des politiques RLS pour identifier le problème 409
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testRLSPolicies() {
  console.log('🔍 Test des politiques RLS pour identifier le problème 409\n');

  try {
    // 1. Récupérer des données de test
    const { data: users } = await supabaseAdmin.from('users').select('*').limit(2);
    const { data: listings } = await supabaseAdmin.from('link_listings').select('*').limit(1);
    const { data: campaigns } = await supabaseAdmin.from('campaigns').select('*').limit(1);

    const advertiser = users.find(u => u.role === 'advertiser') || users[0];
    const publisher = users.find(u => u.role === 'publisher') || users[1];
    const listing = listings[0];
    const campaign = campaigns[0];

    console.log(`🧪 Test avec:`);
    console.log(`   - Annonceur: ${advertiser.email}`);
    console.log(`   - Éditeur: ${publisher.email}`);
    console.log(`   - Listing: ${listing.title}`);
    console.log(`   - Campagne: ${campaign.name}`);

    // 2. Test avec client anonyme (comme le frontend)
    console.log('\n📋 Test 1: Client anonyme (sans authentification)...');
    
    const testData = {
      link_listing_id: listing.id,
      user_id: advertiser.id,
      publisher_id: publisher.id,
      target_url: 'https://test-rls.com',
      anchor_text: 'test rls',
      proposed_price: 100,
      proposed_duration: 6,
      status: 'pending',
      campaign_id: campaign.id
    };

    const { data: request1, error: error1 } = await supabaseAnon
      .from('link_purchase_requests')
      .insert([testData])
      .select()
      .single();

    if (error1) {
      console.log('❌ Erreur client anonyme:', error1.message);
      console.log('📝 Code:', error1.code);
      console.log('📝 Détails:', error1.details);
      console.log('💡 Suggestion:', error1.hint);
    } else {
      console.log('✅ Client anonyme: SUCCÈS');
      await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request1.id);
    }

    // 3. Test avec authentification simulée
    console.log('\n�� Test 2: Authentification simulée...');
    
    // Simuler une session utilisateur
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: advertiser.email,
      password: 'password123'
    });

    if (authError) {
      console.log('⚠️  Impossible de se connecter:', authError.message);
      console.log('   Cela explique l\'erreur 409 - l\'utilisateur n\'est pas authentifié');
      
      // Test avec un utilisateur que nous savons qui existe
      console.log('\n📋 Test 3: Création d\'un utilisateur de test...');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'test-frontend@example.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          role: 'advertiser'
        }
      });

      if (createError) {
        console.log('❌ Erreur création utilisateur:', createError.message);
      } else {
        console.log('✅ Utilisateur de test créé:', newUser.user.email);
        
        // Créer l'enregistrement utilisateur dans la table users
        const { error: userInsertError } = await supabaseAdmin
          .from('users')
          .insert([{
            id: newUser.user.id,
            email: newUser.user.email,
            role: 'advertiser',
            balance: 1000,
            created_at: new Date().toISOString()
          }]);

        if (userInsertError) {
          console.log('❌ Erreur insertion utilisateur:', userInsertError.message);
        } else {
          console.log('✅ Enregistrement utilisateur créé');
          
          // Tester la connexion avec le nouvel utilisateur
          const { data: authData2, error: authError2 } = await supabaseAnon.auth.signInWithPassword({
            email: 'test-frontend@example.com',
            password: 'password123'
          });

          if (authError2) {
            console.log('❌ Erreur connexion nouvel utilisateur:', authError2.message);
          } else {
            console.log('✅ Connexion réussie avec nouvel utilisateur');
            
            // Tester la création de demande avec le nouvel utilisateur
            const testData2 = {
              ...testData,
              user_id: newUser.user.id,
              target_url: 'https://test-new-user.com'
            };

            const { data: request2, error: error2 } = await supabaseAnon
              .from('link_purchase_requests')
              .insert([testData2])
              .select()
              .single();

            if (error2) {
              console.log('❌ Erreur avec nouvel utilisateur:', error2.message);
              console.log('📝 Code:', error2.code);
              console.log('📝 Détails:', error2.details);
            } else {
              console.log('✅ Nouvel utilisateur: SUCCÈS');
              console.log(`   - ID: ${request2.id}`);
              console.log(`   - Campaign ID: ${request2.campaign_id}`);
              await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request2.id);
            }
          }
        }
      }
    } else {
      console.log('✅ Connexion réussie avec utilisateur existant');
      
      // Tester la création avec l'utilisateur connecté
      const { data: request3, error: error3 } = await supabaseAnon
        .from('link_purchase_requests')
        .insert([{
          ...testData,
          target_url: 'https://test-authenticated.com'
        }])
        .select()
        .single();

      if (error3) {
        console.log('❌ Erreur avec utilisateur connecté:', error3.message);
        console.log('📝 Code:', error3.code);
        console.log('📝 Détails:', error3.details);
      } else {
        console.log('✅ Utilisateur connecté: SUCCÈS');
        await supabaseAdmin.from('link_purchase_requests').delete().eq('id', request3.id);
      }
    }

    // 4. Vérifier les politiques RLS
    console.log('\n📋 Test 4: Vérification des politiques RLS...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'link_purchase_requests');

    if (policiesError) {
      console.log('❌ Erreur récupération politiques:', policiesError.message);
    } else {
      console.log(`✅ Politiques trouvées: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du test RLS:', error.message);
  }
}

testRLSPolicies();
