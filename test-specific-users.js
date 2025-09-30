import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificUsers() {
  console.log('🧪 Test spécifique entre abderrahimmloatefpro@gmail.com (annonceur) & ogincema@gmail.com (éditeur)\n');

  try {
    // 1. Rechercher les utilisateurs
    console.log('1️⃣ Recherche des utilisateurs...');
    
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'abderrahimmolatefpro@gmail.com')
      .single();
    
    if (advertiserError) {
      console.log(`❌ Erreur recherche annonceur: ${advertiserError.message}`);
      return;
    }
    
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ogincema@gmail.com')
      .single();
    
    if (publisherError) {
      console.log(`❌ Erreur recherche éditeur: ${publisherError.message}`);
      return;
    }
    
    console.log('✅ Annonceur trouvé:', {
      id: advertiser.id,
      email: advertiser.email,
      name: advertiser.name || 'N/A'
    });
    console.log('✅ Éditeur trouvé:', {
      id: publisher.id,
      email: publisher.email,
      name: publisher.name || 'N/A'
    });
    console.log('');

    // 2. Rechercher un website de l'éditeur
    console.log('2️⃣ Recherche d\'un website de l\'éditeur...');
    
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', publisher.id)
      .limit(1)
      .single();
    
    if (websiteError) {
      console.log(`❌ Erreur recherche website: ${websiteError.message}`);
      return;
    }
    
    console.log('✅ Website trouvé:', {
      id: website.id,
      domain: website.domain,
      title: website.title || 'N/A'
    });
    console.log('');

    // 3. Créer un link_listing virtuel pour le nouveau article
    console.log('3️⃣ Création d\'un link_listing virtuel...');
    
    const { data: virtualListing, error: listingError } = await supabase
      .from('link_listings')
      .insert({
        website_id: website.id,
        user_id: publisher.id,
        title: 'Nouvel article - Leplombier',
        description: 'Article qui sera rédigé par la plateforme',
        target_url: 'https://example.com/virtual-article',
        anchor_text: 'Article Rédaction Plateforme',
        link_type: 'dofollow',
        position: 'content',
        price: 90, // Prix de la rédaction
        currency: 'MAD',
        minimum_contract_duration: 1,
        max_links_per_page: 1,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (listingError) {
      console.log(`❌ Erreur création link_listing: ${listingError.message}`);
      return;
    }
    
    console.log('✅ Link_listing virtuel créé:', {
      id: virtualListing.id,
      type: virtualListing.type,
      title: virtualListing.title
    });
    console.log('');

    // 4. Créer une demande d'achat avec rédaction par la plateforme
    console.log('4️⃣ Création d\'une demande d\'achat avec rédaction par la plateforme...');
    
    const newRequest = {
      user_id: advertiser.id, // Annonceur
      publisher_id: publisher.id, // Éditeur
      link_listing_id: virtualListing.id, // Lien vers le listing virtuel
      anchor_text: 'Test Article Rédaction Plateforme',
      target_url: 'https://example.com/test-article',
      content_option: 'platform', // Rédaction par la plateforme
      proposed_price: 90, // Prix proposé
      status: 'pending',
      extended_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdRequest, error: createError } = await supabase
      .from('link_purchase_requests')
      .insert(newRequest)
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Erreur création demande: ${createError.message}`);
      return;
    }
    
    console.log('✅ Demande créée:', {
      id: createdRequest.id,
      anchor_text: createdRequest.anchor_text,
      content_option: createdRequest.content_option,
      status: createdRequest.status,
      extended_status: createdRequest.extended_status
    });
    console.log('');

    // 5. Simuler l'acceptation de la demande par l'éditeur
    console.log('5️⃣ Simulation de l\'acceptation par l\'éditeur...');
    
    const { error: acceptError } = await supabase
      .from('link_purchase_requests')
      .update({
        extended_status: 'accepted_waiting_article',
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', createdRequest.id);
    
    if (acceptError) {
      console.log(`❌ Erreur acceptation: ${acceptError.message}`);
      return;
    }
    
    console.log('✅ Demande acceptée par l\'éditeur');
    console.log('');

    // 6. Créer une conversation (comme dans le code frontend)
    console.log('6️⃣ Création d\'une conversation...');
    
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        purchase_request_id: createdRequest.id,
        advertiser_id: advertiser.id,
        publisher_id: publisher.id,
        subject: `Demande acceptée - ${createdRequest.anchor_text}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (conversationError) {
      console.log(`❌ Erreur création conversation: ${conversationError.message}`);
      return;
    }
    
    console.log('✅ Conversation créée:', {
      id: conversation.id,
      subject: conversation.subject,
      advertiser_id: conversation.advertiser_id,
      publisher_id: conversation.publisher_id
    });
    console.log('');

    // 7. Ajouter le message initial de l'éditeur
    console.log('7️⃣ Ajout du message initial de l\'éditeur...');
    
    const { data: initialMessage, error: initialMessageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: publisher.id, // Éditeur
        receiver_id: advertiser.id, // Annonceur
        content: `Bonjour ! J'ai accepté votre demande pour le lien "${createdRequest.anchor_text}". L'équipe va maintenant rédiger l'article pour vous.`,
        message_type: 'text',
        related_purchase_request_id: createdRequest.id
      })
      .select()
      .single();
    
    if (initialMessageError) {
      console.log(`❌ Erreur message initial: ${initialMessageError.message}`);
      return;
    }
    
    console.log('✅ Message initial envoyé:', {
      id: initialMessage.id,
      content: initialMessage.content.substring(0, 50) + '...',
      sender_id: initialMessage.sender_id,
      receiver_id: initialMessage.receiver_id
    });
    console.log('');

    // 8. Simuler une réponse de l'annonceur
    console.log('8️⃣ Simulation d\'une réponse de l\'annonceur...');
    
    const { data: replyMessage, error: replyError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: advertiser.id, // Annonceur
        receiver_id: publisher.id, // Éditeur
        content: 'Merci pour l\'acceptation ! J\'attends l\'article avec impatience. Pouvez-vous me donner une estimation du délai ?',
        message_type: 'text',
        related_purchase_request_id: createdRequest.id
      })
      .select()
      .single();
    
    if (replyError) {
      console.log(`❌ Erreur message de réponse: ${replyError.message}`);
      return;
    }
    
    console.log('✅ Message de réponse envoyé:', {
      id: replyMessage.id,
      content: replyMessage.content.substring(0, 50) + '...',
      sender_id: replyMessage.sender_id,
      receiver_id: replyMessage.receiver_id
    });
    console.log('');

    // 9. Simuler une réponse de l'éditeur
    console.log('9️⃣ Simulation d\'une réponse de l\'éditeur...');
    
    const { data: publisherReply, error: publisherReplyError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: publisher.id, // Éditeur
        receiver_id: advertiser.id, // Annonceur
        content: 'Parfait ! L\'article sera rédigé dans les 2-3 prochains jours ouvrables. Je vous tiendrai informé de l\'avancement.',
        message_type: 'text',
        related_purchase_request_id: createdRequest.id
      })
      .select()
      .single();
    
    if (publisherReplyError) {
      console.log(`❌ Erreur réponse éditeur: ${publisherReplyError.message}`);
      return;
    }
    
    console.log('✅ Réponse de l\'éditeur envoyée:', {
      id: publisherReply.id,
      content: publisherReply.content.substring(0, 50) + '...',
      sender_id: publisherReply.sender_id,
      receiver_id: publisherReply.receiver_id
    });
    console.log('');

    // 10. Vérification finale de la conversation
    console.log('🔟 Vérification finale de la conversation...');
    
    const { data: finalConversation, error: finalConvError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages:conversation_messages(*)
      `)
      .eq('id', conversation.id)
      .single();
    
    if (finalConvError) {
      console.log(`❌ Erreur vérification finale: ${finalConvError.message}`);
      return;
    }
    
    console.log('✅ Vérification réussie !');
    console.log('📊 Résumé de la conversation:');
    console.log(`   - Conversation ID: ${finalConversation.id}`);
    console.log(`   - Sujet: ${finalConversation.subject}`);
    console.log(`   - Nombre de messages: ${finalConversation.messages.length}`);
    console.log(`   - Annonceur: ${advertiser.email}`);
    console.log(`   - Éditeur: ${publisher.email}`);
    console.log('');

    // 11. Afficher tous les messages de la conversation
    console.log('📨 Messages de la conversation:');
    finalConversation.messages.forEach((msg, index) => {
      const sender = msg.sender_id === advertiser.id ? 'Annonceur' : 'Éditeur';
      console.log(`   ${index + 1}. [${sender}] ${msg.content}`);
    });
    console.log('');

    console.log('🎉 TEST RÉUSSI ! Conversation créée et fonctionnelle entre:');
    console.log(`   📧 Annonceur: ${advertiser.email}`);
    console.log(`   📧 Éditeur: ${publisher.email}`);
    console.log(`   🔗 Demande ID: ${createdRequest.id}`);
    console.log(`   💬 Conversation ID: ${conversation.id}`);
    console.log('');
    console.log('✅ Cette conversation devrait maintenant être visible dans l\'interface frontend !');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
  }
}

// Exécuter le test
testSpecificUsers();
