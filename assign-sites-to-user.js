import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignSitesToUser() {
  console.log('🔄 Attribution des sites marocains à ogincema@gmail.com...\n');

  try {
    // 1. Trouver l'utilisateur ogincema@gmail.com
    console.log('1. Recherche de l\'utilisateur ogincema@gmail.com...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'ogincema@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Utilisateur non trouvé:', userError);
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (${user.role}) - ID: ${user.id}`);

    // 2. Trouver les sites marocains
    console.log('\n2. Recherche des sites marocains...');
    const { data: moroccanSites, error: sitesError } = await supabase
      .from('websites')
      .select('*')
      .or('title.ilike.%Hespress%,title.ilike.%Jumia%,title.ilike.%Avito%,title.ilike.%Mubawab%,title.ilike.%Moteur%,title.ilike.%Le360%,title.ilike.%Bladi%,title.ilike.%TelQuel%,title.ilike.%Akhbarona%,title.ilike.%Goud%');

    if (sitesError) {
      console.error('❌ Erreur recherche sites:', sitesError);
      return;
    }

    console.log(`✅ ${moroccanSites.length} sites marocains trouvés`);

    // 3. Assigner les sites à l'utilisateur
    console.log('\n3. Attribution des sites...');
    let success = 0;

    for (const site of moroccanSites) {
      const { error: updateError } = await supabase
        .from('websites')
        .update({ 
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', site.id);

      if (updateError) {
        console.error(`❌ Erreur attribution ${site.title}:`, updateError);
      } else {
        console.log(`✅ ${site.title} assigné à ${user.email}`);
        success++;
      }
    }

    console.log(`\n🎉 ${success}/${moroccanSites.length} sites assignés avec succès !`);

    // 4. Vérifier l'attribution
    console.log('\n4. Vérification de l\'attribution...');
    const { data: userSites, error: verifyError } = await supabase
      .from('websites')
      .select('title, user_id')
      .eq('user_id', user.id)
      .or('title.ilike.%Hespress%,title.ilike.%Jumia%,title.ilike.%Avito%,title.ilike.%Mubawab%,title.ilike.%Moteur%,title.ilike.%Le360%,title.ilike.%Bladi%,title.ilike.%TelQuel%,title.ilike.%Akhbarona%,title.ilike.%Goud%');

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError);
    } else {
      console.log(`✅ ${userSites.length} sites marocains maintenant assignés à ${user.email}`);
      userSites.forEach(site => {
        console.log(`   - ${site.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

assignSitesToUser().then(() => {
  console.log('\n🏁 Attribution terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
