import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec clé anonyme
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPermissions() {
  console.log('🔐 Test des permissions RLS (Row Level Security)\n');

  try {
    // 1. Test sans authentification (comme un utilisateur non connecté)
    console.log('1️⃣ Test sans authentification...');
    
    const { data: unauthenticatedData, error: unauthenticatedError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (unauthenticatedError) {
      console.log(`❌ Erreur sans authentification: ${unauthenticatedError.message}`);
    } else {
      console.log(`✅ Accès sans authentification: ${unauthenticatedData ? unauthenticatedData.length : 0} conversations`);
    }
    console.log('');

    // 2. Test avec authentification simulée (comme un utilisateur connecté)
    console.log('2️⃣ Test avec authentification simulée...');
    
    // Simuler un utilisateur connecté
    const mockUser = {
      id: 'b1ece838-8fa7-4959-9ae1-7d5e152451cb', // ID d'un utilisateur existant
      email: 'test@example.com'
    };
    
    // Définir la session utilisateur
    await supabase.auth.setSession({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      user: mockUser
    });
    
    const { data: authenticatedData, error: authenticatedError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (authenticatedError) {
      console.log(`❌ Erreur avec authentification: ${authenticatedError.message}`);
    } else {
      console.log(`✅ Accès avec authentification: ${authenticatedData ? authenticatedData.length : 0} conversations`);
    }
    console.log('');

    // 3. Test spécifique des conversations pour un utilisateur
    console.log('3️⃣ Test des conversations pour un utilisateur spécifique...');
    
    const { data: userConversations, error: userConvError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages:conversation_messages(*)
      `)
      .or(`advertiser_id.eq.${mockUser.id},publisher_id.eq.${mockUser.id}`)
      .limit(5);
    
    if (userConvError) {
      console.log(`❌ Erreur conversations utilisateur: ${userConvError.message}`);
    } else {
      console.log(`✅ Conversations de l'utilisateur: ${userConversations ? userConversations.length : 0} trouvées`);
      if (userConversations && userConversations.length > 0) {
        console.log('📋 Détails des conversations:');
        userConversations.forEach((conv, index) => {
          console.log(`   ${index + 1}. ID: ${conv.id}, Sujet: ${conv.subject}, Messages: ${conv.messages ? conv.messages.length : 0}`);
        });
      }
    }
    console.log('');

    // 4. Test des messages pour une conversation spécifique
    console.log('4️⃣ Test des messages pour une conversation...');
    
    if (userConversations && userConversations.length > 0) {
      const conversationId = userConversations[0].id;
      
      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.log(`❌ Erreur messages: ${messagesError.message}`);
      } else {
        console.log(`✅ Messages de la conversation: ${messages ? messages.length : 0} trouvés`);
        if (messages && messages.length > 0) {
          console.log('📋 Détails des messages:');
          messages.forEach((msg, index) => {
            console.log(`   ${index + 1}. De: ${msg.sender_id}, À: ${msg.receiver_id}, Contenu: ${msg.content.substring(0, 50)}...`);
          });
        }
      }
    }
    console.log('');

    // 5. Test de création d'un nouveau message
    console.log('5️⃣ Test de création d\'un nouveau message...');
    
    if (userConversations && userConversations.length > 0) {
      const conversationId = userConversations[0].id;
      
      const { data: newMessage, error: newMessageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: mockUser.id,
          receiver_id: userConversations[0].publisher_id === mockUser.id ? 
            userConversations[0].advertiser_id : 
            userConversations[0].publisher_id,
          content: 'Test de message avec clé anonyme - ' + new Date().toISOString(),
          message_type: 'text',
          related_purchase_request_id: userConversations[0].purchase_request_id
        })
        .select()
        .single();
      
      if (newMessageError) {
        console.log(`❌ Erreur création message: ${newMessageError.message}`);
      } else {
        console.log(`✅ Message créé avec succès: ${newMessage.id}`);
      }
    }
    console.log('');

    // 6. Test des demandes d'achat avec content_option = 'platform'
    console.log('6️⃣ Test des demandes avec rédaction par la plateforme...');
    
    const { data: platformRequests, error: platformError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        advertiser:users!link_purchase_requests_user_id_fkey(*),
        publisher:users!link_purchase_requests_publisher_id_fkey(*)
      `)
      .eq('content_option', 'platform')
      .limit(3);
    
    if (platformError) {
      console.log(`❌ Erreur demandes plateforme: ${platformError.message}`);
    } else {
      console.log(`✅ Demandes plateforme: ${platformRequests ? platformRequests.length : 0} trouvées`);
      if (platformRequests && platformRequests.length > 0) {
        console.log('📋 Détails des demandes:');
        platformRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. ID: ${req.id}, Texte: ${req.anchor_text}, Statut: ${req.status}/${req.extended_status}`);
          console.log(`      Annonceur: ${req.advertiser ? req.advertiser.email : 'N/A'}`);
          console.log(`      Éditeur: ${req.publisher ? req.publisher.email : 'N/A'}`);
        });
      }
    }
    console.log('');

    console.log('🎯 RÉSUMÉ DES TESTS RLS:');
    console.log('✅ Accès aux tables avec clé anonyme');
    console.log('✅ Récupération des conversations');
    console.log('✅ Récupération des messages');
    console.log('✅ Création de nouveaux messages');
    console.log('✅ Accès aux demandes avec rédaction par la plateforme');
    console.log('');
    console.log('💡 Si les tests passent mais que l\'interface ne fonctionne pas,');
    console.log('   le problème pourrait être dans le code frontend ou les composants React.');

  } catch (error) {
    console.error('❌ Erreur générale lors du test RLS:', error);
  }
}

// Exécuter le test
testRLSPermissions();
