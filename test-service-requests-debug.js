const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugServiceRequests() {
  console.log('🔍 Debug des demandes de services...\n');

  try {
    // 1. Vérifier tous les utilisateurs
    console.log('1. Utilisateurs dans la base:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur utilisateurs:', usersError);
    } else {
      console.log(`✅ ${users.length} utilisateurs trouvés:`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ID: ${user.id}`);
      });
    }

    // 2. Vérifier tous les services
    console.log('\n2. Services disponibles:');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .order('name');

    if (servicesError) {
      console.error('❌ Erreur services:', servicesError);
    } else {
      console.log(`✅ ${services.length} services trouvés:`);
      services.forEach(service => {
        console.log(`   - ${service.name} (${service.price} ${service.currency})`);
      });
    }

    // 3. Vérifier toutes les demandes de services
    console.log('\n3. Toutes les demandes de services:');
    const { data: allRequests, error: allRequestsError } = await supabase
      .from('service_requests')
      .select(`
        *,
        service:services(*),
        user:users(email, role)
      `)
      .order('created_at', { ascending: false });

    if (allRequestsError) {
      console.error('❌ Erreur demandes:', allRequestsError);
    } else {
      console.log(`✅ ${allRequests.length} demandes trouvées:`);
      allRequests.forEach(request => {
        console.log(`   - ID: ${request.id}`);
        console.log(`     Utilisateur: ${request.user?.email} (${request.user?.role})`);
        console.log(`     Service: ${request.service?.name}`);
        console.log(`     Statut: ${request.status}`);
        console.log(`     Prix: ${request.total_price} MAD`);
        console.log(`     Date: ${new Date(request.created_at).toLocaleString('fr-FR')}`);
        console.log('     ---');
      });
    }

    // 4. Tester la fonction getUserServiceRequests pour chaque utilisateur
    console.log('\n4. Test getUserServiceRequests par utilisateur:');
    for (const user of users) {
      console.log(`\n   Test pour ${user.email} (${user.role}):`);
      
      const { data: userRequests, error: userRequestsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userRequestsError) {
        console.error(`     ❌ Erreur pour ${user.email}:`, userRequestsError);
      } else {
        console.log(`     ✅ ${userRequests.length} demandes trouvées pour ${user.email}`);
        userRequests.forEach(request => {
          console.log(`       - ${request.service?.name} (${request.status}) - ${request.total_price} MAD`);
        });
      }
    }

    // 5. Vérifier les politiques RLS
    console.log('\n5. Vérification des politiques RLS:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'service_requests');

    if (policiesError) {
      console.log('   ⚠️  Impossible de vérifier les politiques RLS (normal en mode anon)');
    } else {
      console.log(`   ✅ ${policies.length} politiques trouvées pour service_requests`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugServiceRequests().then(() => {
  console.log('\n🏁 Debug terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
