import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomContentCreation() {
  console.log('🧪 Test de création d\'une demande avec contenu personnalisé...\n');

  try {
    // 1. Récupérer un utilisateur et un listing existants
    console.log('1. Récupération des données de test...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(2);

    if (usersError || !users || users.length < 2) {
      console.log('❌ Erreur lors de la récupération des utilisateurs:', usersError?.message);
      return;
    }

    const { data: listings, error: listingsError } = await supabase
      .from('link_listings')
      .select('id, user_id, price')
      .limit(1);

    if (listingsError || !listings || listings.length < 1) {
      console.log('❌ Erreur lors de la récupération des listings:', listingsError?.message);
      return;
    }

    const advertiser = users[0];
    const publisher = users[1];
    const listing = listings[0];

    console.log(`✅ Utilisateur annonceur: ${advertiser.email} (${advertiser.id})`);
    console.log(`✅ Utilisateur éditeur: ${publisher.email} (${publisher.id})`);
    console.log(`✅ Listing: ${listing.id} (prix: ${listing.price})`);

    // 2. Créer une demande avec contenu personnalisé
    console.log('\n2. Création d\'une demande avec contenu personnalisé...');
    
    const customContent = `
      <h2>Article personnalisé pour notre marque</h2>
      <p>Voici un <strong>contenu personnalisé</strong> avec des <em>éléments formatés</em>.</p>
      <ul>
        <li>Point important 1</li>
        <li>Point important 2</li>
        <li>Point important 3</li>
      </ul>
      <p>Pour plus d'informations, visitez notre <a href="https://example.com">site web</a>.</p>
    `;

    const requestData = {
      link_listing_id: listing.id,
      user_id: advertiser.id,
      publisher_id: publisher.id,
      target_url: 'https://example.com/test-page',
      anchor_text: 'lien personnalisé',
      message: 'Message de test avec contenu personnalisé',
      custom_content: customContent,
      content_option: 'custom',
      proposed_price: listing.price,
      proposed_duration: 1
    };

    const { data: newRequest, error: createError } = await supabase
      .from('link_purchase_requests')
      .insert([requestData])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur lors de la création de la demande:', createError.message);
      return;
    }

    console.log('✅ Demande créée avec succès!');
    console.log(`- ID: ${newRequest.id}`);
    console.log(`- Content Option: ${newRequest.content_option}`);
    console.log(`- Custom Content: ${newRequest.custom_content ? 'Présent' : 'Absent'}`);
    console.log(`- Custom Content Length: ${newRequest.custom_content?.length || 0} caractères`);

    // 3. Vérifier que la demande a bien été créée avec le contenu personnalisé
    console.log('\n3. Vérification de la demande créée...');
    
    const { data: verifyRequest, error: verifyError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', newRequest.id)
      .single();

    if (verifyError) {
      console.log('❌ Erreur lors de la vérification:', verifyError.message);
      return;
    }

    console.log('✅ Vérification réussie!');
    console.log(`- Content Option: ${verifyRequest.content_option}`);
    console.log(`- Custom Content: ${verifyRequest.custom_content ? 'Présent' : 'Absent'}`);
    
    if (verifyRequest.custom_content) {
      console.log('\n📄 Contenu personnalisé:');
      console.log(verifyRequest.custom_content.substring(0, 200) + '...');
    }

    // 4. Vérifier l'affichage dans les demandes
    console.log('\n4. Test de récupération pour l\'affichage...');
    
    const { data: advertiserRequests, error: advertiserError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('user_id', advertiser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (advertiserError) {
      console.log('❌ Erreur lors de la récupération des demandes annonceur:', advertiserError.message);
    } else {
      console.log(`✅ ${advertiserRequests.length} demande(s) trouvée(s) pour l'annonceur`);
      
      const customContentRequests = advertiserRequests.filter(req => 
        req.content_option === 'custom' && req.custom_content
      );
      
      console.log(`✅ ${customContentRequests.length} demande(s) avec contenu personnalisé`);
    }

    const { data: publisherRequests, error: publisherError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('publisher_id', publisher.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (publisherError) {
      console.log('❌ Erreur lors de la récupération des demandes éditeur:', publisherError.message);
    } else {
      console.log(`✅ ${publisherRequests.length} demande(s) trouvée(s) pour l'éditeur`);
      
      const customContentRequests = publisherRequests.filter(req => 
        req.content_option === 'custom' && req.custom_content
      );
      
      console.log(`✅ ${customContentRequests.length} demande(s) avec contenu personnalisé`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testCustomContentCreation().catch(console.error);
