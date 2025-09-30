import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessagingSystem() {
  console.log('🧪 Test du système de messagerie pour articles avec rédaction par la plateforme\n');

  try {
    // 1. Vérifier les tables nécessaires
    console.log('1️⃣ Vérification des tables...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.error('❌ Erreur lors de la vérification de la table conversations:', convError);
      return;
    }
    
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Erreur lors de la vérification de la table conversation_messages:', msgError);
      return;
    }
    
    console.log('✅ Tables conversations et conversation_messages accessibles\n');

    // 2. Chercher une demande avec content_option = 'platform'
    console.log('2️⃣ Recherche d\'une demande avec rédaction par la plateforme...');
    
    const { data: platformRequests, error: reqError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        advertiser:users!link_purchase_requests_user_id_fkey(*),
        publisher:users!link_purchase_requests_publisher_id_fkey(*)
      `)
      .eq('content_option', 'platform')
      .limit(1);
    
    if (reqError) {
      console.error('❌ Erreur lors de la recherche des demandes:', reqError);
      return;
    }
    
    if (!platformRequests || platformRequests.length === 0) {
      console.log('⚠️ Aucune demande avec rédaction par la plateforme trouvée');
      console.log('Création d\'une demande de test...');
      
      // Créer une demande de test
      const testRequest = {
        user_id: 'test-advertiser-id',
        publisher_id: 'test-publisher-id',
        anchor_text: 'Test Article Platform',
        target_url: 'https://example.com',
        content_option: 'platform',
        status: 'pending',
        extended_status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const { data: newRequest, error: createError } = await supabase
        .from('link_purchase_requests')
        .insert(testRequest)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erreur lors de la création de la demande de test:', createError);
        return;
      }
      
      console.log('✅ Demande de test créée:', newRequest.id);
      platformRequests.push(newRequest);
    }
    
    const request = platformRequests[0];
    console.log('✅ Demande trouvée:', {
      id: request.id,
      anchor_text: request.anchor_text,
      content_option: request.content_option,
      status: request.status,
      extended_status: request.extended_status
    });
    console.log('');

    // 3. Simuler l'acceptation de la demande (comme dans le code corrigé)
    console.log('3️⃣ Simulation de l\'acceptation de la demande...');
    
    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        extended_status: 'accepted_waiting_article',
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);
    
    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du statut:', updateError);
      return;
    }
    
    console.log('✅ Statut mis à jour vers "accepted_waiting_article"\n');

    // 4. Créer une conversation (comme dans le code corrigé)
    console.log('4️⃣ Création d\'une conversation...');
    
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        purchase_request_id: request.id,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        subject: `Demande acceptée - ${request.anchor_text}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (conversationError) {
      console.error('❌ Erreur lors de la création de la conversation:', conversationError);
      return;
    }
    
    console.log('✅ Conversation créée:', {
      id: conversation.id,
      subject: conversation.subject,
      advertiser_id: conversation.advertiser_id,
      publisher_id: conversation.publisher_id
    });
    console.log('');

    // 5. Ajouter un message initial
    console.log('5️⃣ Ajout du message initial...');
    
    const { data: message, error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: request.publisher_id,
        receiver_id: request.user_id,
        content: `Bonjour ! J'ai accepté votre demande pour le lien "${request.anchor_text}". L'équipe va maintenant rédiger l'article pour vous.`,
        message_type: 'text',
        related_purchase_request_id: request.id
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Erreur lors de la création du message initial:', messageError);
      return;
    }
    
    console.log('✅ Message initial créé:', {
      id: message.id,
      content: message.content.substring(0, 50) + '...',
      sender_id: message.sender_id,
      receiver_id: message.receiver_id
    });
    console.log('');

    // 6. Vérifier que la conversation et le message existent
    console.log('6️⃣ Vérification finale...');
    
    const { data: finalConversation, error: finalConvError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages:conversation_messages(*)
      `)
      .eq('id', conversation.id)
      .single();
    
    if (finalConvError) {
      console.error('❌ Erreur lors de la vérification finale:', finalConvError);
      return;
    }
    
    console.log('✅ Vérification réussie !');
    console.log('📊 Résumé:');
    console.log(`   - Conversation ID: ${finalConversation.id}`);
    console.log(`   - Nombre de messages: ${finalConversation.messages.length}`);
    console.log(`   - Sujet: ${finalConversation.subject}`);
    console.log(`   - Statut de la demande: ${request.extended_status}`);
    console.log('');

    // 7. Test d'envoi d'un message de réponse
    console.log('7️⃣ Test d\'envoi d\'un message de réponse...');
    
    const { data: replyMessage, error: replyError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: request.user_id, // L'annonceur répond
        receiver_id: request.publisher_id, // À l'éditeur
        content: 'Merci pour l\'acceptation ! J\'attends l\'article avec impatience.',
        message_type: 'text',
        related_purchase_request_id: request.id
      })
      .select()
      .single();
    
    if (replyError) {
      console.error('❌ Erreur lors de l\'envoi du message de réponse:', replyError);
      return;
    }
    
    console.log('✅ Message de réponse envoyé:', {
      id: replyMessage.id,
      content: replyMessage.content,
      sender_id: replyMessage.sender_id,
      receiver_id: replyMessage.receiver_id
    });
    console.log('');

    console.log('🎉 TEST RÉUSSI ! Le système de messagerie fonctionne correctement pour les articles avec rédaction par la plateforme.');
    console.log('');
    console.log('📋 Résumé du test:');
    console.log('   ✅ Tables accessibles');
    console.log('   ✅ Demande avec content_option="platform" trouvée/créée');
    console.log('   ✅ Statut mis à jour vers "accepted_waiting_article"');
    console.log('   ✅ Conversation créée automatiquement');
    console.log('   ✅ Message initial envoyé');
    console.log('   ✅ Message de réponse envoyé');
    console.log('   ✅ Communication bidirectionnelle fonctionnelle');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
  }
}

// Exécuter le test
testMessagingSystem();
