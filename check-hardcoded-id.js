// Vérifier si l'ID hardcodé existe
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

async function checkHardcodedId() {
  console.log('🔍 Vérification de l\'ID hardcodé dans le frontend\n');

  const hardcodedId = '9bb8b817-0916-483d-a8dc-4d29382e12a9';

  try {
    // Vérifier si cet ID existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', hardcodedId)
      .single();

    if (userError) {
      console.log(`❌ ID hardcodé ${hardcodedId} n'existe pas !`);
      console.log('📝 Erreur:', userError.message);
    } else {
      console.log(`✅ ID hardcodé ${hardcodedId} existe`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
    }

    // Trouver un éditeur valide à utiliser
    console.log('\n📊 Éditeurs valides disponibles:');
    const { data: publishers, error: publishersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'publisher');

    if (publishersError) {
      console.log('❌ Erreur récupération éditeurs:', publishersError.message);
    } else {
      console.log(`✅ Éditeurs trouvés: ${publishers.length}`);
      publishers.forEach(publisher => {
        console.log(`   - ${publisher.id}: ${publisher.email}`);
      });

      // Recommander un éditeur valide
      if (publishers.length > 0) {
        const recommendedPublisher = publishers[0];
        console.log(`\n💡 Recommandation: Utiliser ${recommendedPublisher.id} (${recommendedPublisher.email})`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

checkHardcodedId();
