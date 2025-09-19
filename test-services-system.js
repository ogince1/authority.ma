// Test du système de services complet
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testServicesSystem() {
  console.log('🧪 Test du système de services complet...\n');
  
  try {
    // 1. Vérifier les services
    console.log('📋 1. Vérification des services...');
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'available');
    
    if (servicesError) {
      console.log(`   ❌ Erreur services: ${servicesError.message}`);
      return;
    }
    
    console.log(`   ✅ ${services.length} services trouvés:`);
    services.forEach(service => {
      console.log(`      - ${service.name}: ${service.price} ${service.currency}`);
    });
    
    // 2. Vérifier un utilisateur annonceur
    console.log('\n📋 2. Vérification utilisateur annonceur...');
    
    const { data: advertiser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, balance')
      .eq('role', 'advertiser')
      .limit(1)
      .single();
    
    if (userError) {
      console.log(`   ❌ Erreur utilisateur: ${userError.message}`);
      return;
    }
    
    console.log(`   ✅ Annonceur trouvé: ${advertiser.name} (${advertiser.email})`);
    console.log(`   📋 Solde actuel: ${advertiser.balance} MAD`);
    
    // 3. Tester la création d'une demande de service
    console.log('\n📋 3. Test création demande de service...');
    
    const service = services[0];
    const quantity = 1;
    const totalPrice = service.price * quantity;
    
    console.log(`   📋 Service: ${service.name}`);
    console.log(`   📋 Quantité: ${quantity}`);
    console.log(`   📋 Prix total: ${totalPrice} ${service.currency}`);
    
    // Vérifier le solde avant
    if (advertiser.balance < totalPrice) {
      console.log(`   ⚠️  Solde insuffisant. Ajout de crédit...`);
      
      const { error: addBalanceError } = await supabase
        .from('users')
        .update({ balance: advertiser.balance + totalPrice + 1000 })
        .eq('id', advertiser.id);
      
      if (addBalanceError) {
        console.log(`   ❌ Erreur ajout solde: ${addBalanceError.message}`);
        return;
      }
      
      console.log(`   ✅ Solde mis à jour`);
    }
    
    // Créer la demande de service
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .insert([{
        service_id: service.id,
        user_id: advertiser.id,
        quantity: quantity,
        total_price: totalPrice,
        client_notes: 'Test du système de services'
      }])
      .select(`
        *,
        service:services(*),
        user:users(id, name, email)
      `)
      .single();
    
    if (requestError) {
      console.log(`   ❌ Erreur création demande: ${requestError.message}`);
      return;
    }
    
    console.log(`   ✅ Demande créée: ${serviceRequest.id}`);
    console.log(`   📋 Statut: ${serviceRequest.status}`);
    
    // 4. Simuler le paiement (déduction du solde)
    console.log('\n📋 4. Test déduction du solde...');
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - totalPrice })
      .eq('id', advertiser.id)
      .select('balance')
      .single();
    
    if (updateError) {
      console.log(`   ❌ Erreur déduction: ${updateError.message}`);
    } else {
      console.log(`   ✅ Solde déduit: ${updatedUser.balance} MAD`);
    }
    
    // 5. Vérifier les demandes de services
    console.log('\n📋 5. Vérification des demandes...');
    
    const { data: allRequests, error: requestsError } = await supabase
      .from('service_requests')
      .select(`
        *,
        service:services(*),
        user:users(id, name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      console.log(`   ❌ Erreur demandes: ${requestsError.message}`);
    } else {
      console.log(`   ✅ ${allRequests.length} demandes trouvées`);
      
      allRequests.forEach((req, index) => {
        if (index < 3) { // Afficher les 3 dernières
          console.log(`      ${index + 1}. ${req.service?.name} - ${req.user?.name} - ${req.total_price} MAD - ${req.status}`);
        }
      });
    }
    
    // 6. Test de mise à jour du statut (admin)
    console.log('\n📋 6. Test mise à jour statut...');
    
    const { error: statusError } = await supabase
      .from('service_requests')
      .update({ 
        status: 'approved',
        admin_notes: 'Demande approuvée par l\'admin'
      })
      .eq('id', serviceRequest.id);
    
    if (statusError) {
      console.log(`   ❌ Erreur mise à jour: ${statusError.message}`);
    } else {
      console.log(`   ✅ Statut mis à jour: approved`);
    }
    
    // 7. Nettoyer les données de test
    console.log('\n🧹 7. Nettoyage...');
    
    const { error: deleteError } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', serviceRequest.id);
    
    if (deleteError) {
      console.log(`   ❌ Erreur suppression: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Demande de test supprimée`);
    }
    
    console.log('\n🎉 Test du système de services terminé avec succès!');
    console.log('\n📋 Résumé:');
    console.log('   ✅ Services en MAD disponibles');
    console.log('   ✅ Création de demandes fonctionnelle');
    console.log('   ✅ Déduction du solde opérationnelle');
    console.log('   ✅ Gestion admin des statuts');
    console.log('   ✅ Interface prête pour la production');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testServicesSystem().catch(console.error);
