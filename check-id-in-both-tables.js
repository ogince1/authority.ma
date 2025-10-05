import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VÉRIFICATION - ID dans websites ET link_listings ?');
console.log('='.repeat(80));

async function checkIdsInBothTables() {
  try {
    // 1. Leplombier (fonctionne)
    console.log('\n🔬 1. LEPLOMBIER (fonctionne)');
    console.log('-'.repeat(80));
    
    const leplombierId = '8bf21f26-62f3-4272-977c-c831e6e22d85';
    
    const { data: leplombierWebsite } = await supabase
      .from('websites')
      .select('id, title')
      .eq('id', leplombierId)
      .single();

    const { data: leplombierListing } = await supabase
      .from('link_listings')
      .select('id, title, status')
      .eq('id', leplombierId)
      .single();

    console.log(`   ID: ${leplombierId}`);
    console.log(`   Existe dans websites ? ${leplombierWebsite ? '✅ OUI' : '❌ NON'}`);
    if (leplombierWebsite) {
      console.log(`      Titre: ${leplombierWebsite.title}`);
    }
    console.log(`   Existe dans link_listings ? ${leplombierListing ? '✅ OUI' : '❌ NON'}`);
    if (leplombierListing) {
      console.log(`      Titre: ${leplombierListing.title}`);
      console.log(`      Status: ${leplombierListing.status}`);
    }

    // 2. vit.ma (fonctionne)
    console.log('\n🔬 2. VIT.MA (fonctionne)');
    console.log('-'.repeat(80));
    
    const vitmaId = '973fd897-0b92-44c6-98d2-ecee9f6b65d1';
    
    const { data: vitmaWebsite } = await supabase
      .from('websites')
      .select('id, title')
      .eq('id', vitmaId)
      .single();

    const { data: vitmaListing } = await supabase
      .from('link_listings')
      .select('id, title, status')
      .eq('id', vitmaId)
      .single();

    console.log(`   ID: ${vitmaId}`);
    console.log(`   Existe dans websites ? ${vitmaWebsite ? '✅ OUI' : '❌ NON'}`);
    if (vitmaWebsite) {
      console.log(`      Titre: ${vitmaWebsite.title}`);
    }
    console.log(`   Existe dans link_listings ? ${vitmaListing ? '✅ OUI' : '❌ NON'}`);
    if (vitmaListing) {
      console.log(`      Titre: ${vitmaListing.title}`);
      console.log(`      Status: ${vitmaListing.status}`);
    }

    // 3. toutamenager.ma (fonctionne)
    console.log('\n🔬 3. TOUTAMENAGER.MA (fonctionne)');
    console.log('-'.repeat(80));
    
    const toutamenagerId = '79c93784-153d-4f5a-b056-54e935765dd9';
    
    const { data: toutamenagerWebsite } = await supabase
      .from('websites')
      .select('id, title')
      .eq('id', toutamenagerId)
      .single();

    const { data: toutamenagerListing } = await supabase
      .from('link_listings')
      .select('id, title, status')
      .eq('id', toutamenagerId)
      .single();

    console.log(`   ID: ${toutamenagerId}`);
    console.log(`   Existe dans websites ? ${toutamenagerWebsite ? '✅ OUI' : '❌ NON'}`);
    if (toutamenagerWebsite) {
      console.log(`      Titre: ${toutamenagerWebsite.title}`);
    }
    console.log(`   Existe dans link_listings ? ${toutamenagerListing ? '✅ OUI' : '❌ NON'}`);
    if (toutamenagerListing) {
      console.log(`      Titre: ${toutamenagerListing.title}`);
      console.log(`      Status: ${toutamenagerListing.status}`);
    }

    // 4. golftradition.fr (NE fonctionne PAS)
    console.log('\n🔬 4. GOLFTRADITION.FR (NE fonctionne PAS)');
    console.log('-'.repeat(80));
    
    const golfId = '2d935da0-32c7-4f4b-9404-ebb6fec6a417';
    
    const { data: golfWebsite } = await supabase
      .from('websites')
      .select('id, title')
      .eq('id', golfId)
      .single();

    const { data: golfListing } = await supabase
      .from('link_listings')
      .select('id, title, status')
      .eq('id', golfId)
      .single();

    console.log(`   ID: ${golfId}`);
    console.log(`   Existe dans websites ? ${golfWebsite ? '✅ OUI' : '❌ NON'}`);
    if (golfWebsite) {
      console.log(`      Titre: ${golfWebsite.title}`);
    }
    console.log(`   Existe dans link_listings ? ${golfListing ? '✅ OUI' : '❌ NON'}`);
    if (golfListing) {
      console.log(`      Titre: ${golfListing.title}`);
      console.log(`      Status: ${golfListing.status}`);
    }

    // 5. CONCLUSION
    console.log('\n\n🎯 CONCLUSION:');
    console.log('='.repeat(80));
    
    const workingSitesHaveListingEntry = (leplombierListing || vitmaListing || toutamenagerListing) !== null;
    const golfHasListingEntry = golfListing !== null;
    
    if (workingSitesHaveListingEntry && !golfHasListingEntry) {
      console.log('💡 DÉCOUVERTE:');
      console.log('   Les sites qui FONCTIONNENT ont leur website_id AUSSI dans link_listings !');
      console.log('   golftradition.fr n\'a PAS son website_id dans link_listings !');
      console.log('\n✅ SOLUTION:');
      console.log('   Créer une entrée dans link_listings avec le même ID que le website');
      console.log('   Cette entrée sert de "pont" pour la contrainte de clé étrangère');
    } else if (!workingSitesHaveListingEntry && !golfHasListingEntry) {
      console.log('🤔 MYSTÈRE:');
      console.log('   Aucun site n\'a son website_id dans link_listings');
      console.log('   Mais pourtant certains fonctionnent...');
      console.log('   Il doit y avoir une autre explication !');
    } else {
      console.log('📊 Résumé:');
      console.log(`   Sites qui fonctionnent dans link_listings: ${workingSitesHaveListingEntry ? 'Oui' : 'Non'}`);
      console.log(`   golftradition dans link_listings: ${golfHasListingEntry ? 'Oui' : 'Non'}`);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

checkIdsInBothTables();

