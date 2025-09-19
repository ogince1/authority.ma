// Script pour déboguer le problème de l'éditeur
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

const publisherId = '187fba7a-38bf-4280-a069-656240b1c630';

console.log('🔍 Débogage du problème de l\'éditeur...\n');

async function debugPublisherIssue() {
  try {
    // 1. Vérifier si l'éditeur existe
    console.log('1️⃣ Vérification de l\'existence de l\'éditeur...');
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('*')
      .eq('id', publisherId)
      .maybeSingle();
    
    if (publisherError) {
      console.error('❌ Erreur lors de la récupération de l\'éditeur:', publisherError);
      return;
    }
    
    if (!publisher) {
      console.log('❌ Éditeur non trouvé avec l\'ID:', publisherId);
      
      // Chercher des utilisateurs similaires
      console.log('\n🔍 Recherche d\'utilisateurs similaires...');
      const { data: similarUsers, error: similarError } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .limit(10);
      
      if (similarError) {
        console.error('❌ Erreur lors de la recherche:', similarError);
      } else {
        console.log('📋 Utilisateurs trouvés:');
        similarUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Nom: ${user.full_name || 'N/A'}`);
          console.log(`      Role: ${user.role}`);
          console.log('');
        });
      }
      return;
    }
    
    console.log('✅ Éditeur trouvé:');
    console.log(`   ID: ${publisher.id}`);
    console.log(`   Email: ${publisher.email}`);
    console.log(`   Nom: ${publisher.full_name || 'N/A'}`);
    console.log(`   Role: ${publisher.role}`);
    console.log(`   Solde: ${publisher.balance} MAD`);
    
    // 2. Vérifier les demandes avec cet éditeur
    console.log('\n2️⃣ Vérification des demandes avec cet éditeur...');
    
    const { data: requests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        status,
        proposed_price,
        created_at,
        link_listings!inner(title)
      `)
      .eq('publisher_id', publisherId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (requestsError) {
      console.error('❌ Erreur lors de la récupération des demandes:', requestsError);
    } else {
      console.log(`📋 ${requests.length} demande(s) trouvée(s) pour cet éditeur:`);
      requests.forEach((request, index) => {
        console.log(`   ${index + 1}. ID: ${request.id}`);
        console.log(`      Status: ${request.status}`);
        console.log(`      Prix: ${request.proposed_price} MAD`);
        console.log(`      Titre: ${request.link_listings?.title}`);
        console.log(`      Créé: ${request.created_at}`);
        console.log('');
      });
    }
    
    // 3. Tester la requête qui pose problème
    console.log('\n3️⃣ Test de la requête problématique...');
    
    const { data: balanceData, error: balanceError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', publisherId)
      .maybeSingle();
    
    if (balanceError) {
      console.error('❌ Erreur lors de la récupération du solde:', balanceError);
    } else if (!balanceData) {
      console.log('❌ Aucune donnée de solde trouvée');
    } else {
      console.log('✅ Solde récupéré avec succès:', balanceData.balance, 'MAD');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans debugPublisherIssue:', error);
  }
}

// Fonction principale
async function runDebug() {
  console.log('🚀 Démarrage du débogage...\n');
  
  await debugPublisherIssue();
  
  console.log('\n✅ Débogage terminé !');
}

// Exécuter le débogage
runDebug().catch(console.error);
