// Test de synchronisation des services
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Test de synchronisation des services...\n');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📊 Services dans la base de données :');
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log(`❌ Erreur: ${error.message}`);
  } else {
    console.log(`✅ ${data?.length || 0} services trouvés\n`);
    
    data?.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   Prix: ${service.price} ${service.currency}`);
      console.log(`   Statut: ${service.status}`);
      console.log(`   Features: ${service.features?.length || 0} éléments`);
      console.log(`   Créé: ${new Date(service.created_at).toLocaleDateString()}\n`);
    });
  }

  console.log('✅ Test terminé !');
  console.log('\n📝 Instructions :');
  console.log('1. Ouvrez http://localhost:5173/admin/services');
  console.log('2. Vérifiez que les services affichés correspondent à ceux ci-dessus');
  console.log('3. Testez la création/modification d\'un service');
  console.log('4. Rechargez la page pour vérifier la persistance');

} catch (error) {
  console.error('❌ Erreur générale:', error);
}
