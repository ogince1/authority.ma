import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MzEsImV4cCI6MjA1MDU1MDgzMX0.8K8vQJ8vQJ8vQJ8vQJ8vQJ8vQJ8vQJ8vQJ8vQJ8vQJ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifications() {
  console.log('🔍 Test des notifications...\n');

  try {
    // 1. Vérifier les conversations existantes
    console.log('1. Vérification des conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, advertiser_id, publisher_id, unread_count_advertiser, unread_count_publisher, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (convError) {
      console.error('❌ Erreur lors de la récupération des conversations:', convError);
      return;
    }

    console.log(`✅ ${conversations?.length || 0} conversations trouvées`);
    
    if (conversations && conversations.length > 0) {
      console.log('\n📋 Détails des conversations:');
      conversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. ID: ${conv.id.slice(0, 8)}...`);
        console.log(`     Advertiser: ${conv.advertiser_id.slice(0, 8)}... (non lus: ${conv.unread_count_advertiser || 0})`);
        console.log(`     Publisher: ${conv.publisher_id.slice(0, 8)}... (non lus: ${conv.unread_count_publisher || 0})`);
        console.log(`     Créé: ${new Date(conv.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 2. Vérifier les messages de conversation
    console.log('2. Vérification des messages de conversation...');
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('id, conversation_id, sender_id, receiver_id, read, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('❌ Erreur lors de la récupération des messages:', msgError);
    } else {
      console.log(`✅ ${messages?.length || 0} messages trouvés`);
      
      if (messages && messages.length > 0) {
        console.log('\n📨 Détails des messages:');
        messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. ID: ${msg.id.slice(0, 8)}...`);
          console.log(`     Conversation: ${msg.conversation_id.slice(0, 8)}...`);
          console.log(`     De: ${msg.sender_id.slice(0, 8)}... vers: ${msg.receiver_id.slice(0, 8)}...`);
          console.log(`     Lu: ${msg.read ? 'Oui' : 'Non'}`);
          console.log(`     Créé: ${new Date(msg.created_at).toLocaleString()}`);
          console.log('');
        });
      }
    }

    // 3. Test avec un utilisateur spécifique (si des conversations existent)
    if (conversations && conversations.length > 0) {
      const testUserId = conversations[0].advertiser_id;
      console.log(`3. Test avec l'utilisateur: ${testUserId.slice(0, 8)}...`);
      
      const { data: userConversations, error: userError } = await supabase
        .from('conversations')
        .select('advertiser_id, publisher_id, unread_count_advertiser, unread_count_publisher')
        .or(`advertiser_id.eq.${testUserId},publisher_id.eq.${testUserId}`);

      if (!userError && userConversations) {
        let totalUnread = 0;
        userConversations.forEach(conv => {
          if (conv.advertiser_id === testUserId) {
            totalUnread += conv.unread_count_advertiser || 0;
          } else if (conv.publisher_id === testUserId) {
            totalUnread += conv.unread_count_publisher || 0;
          }
        });
        
        console.log(`✅ Messages non lus pour cet utilisateur: ${totalUnread}`);
        console.log(`   Conversations: ${userConversations.length}`);
      }
    }

    // 4. Vérifier la structure des tables
    console.log('\n4. Vérification de la structure des tables...');
    
    // Test de la table conversations
    const { data: convTest, error: convTestError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convTestError) {
      console.error('❌ Erreur table conversations:', convTestError);
    } else {
      console.log('✅ Table conversations accessible');
    }

    // Test de la table conversation_messages
    const { data: msgTest, error: msgTestError } = await supabase
      .from('conversation_messages')
      .select('*')
      .limit(1);
    
    if (msgTestError) {
      console.error('❌ Erreur table conversation_messages:', msgTestError);
    } else {
      console.log('✅ Table conversation_messages accessible');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testNotifications();
