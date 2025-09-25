// Test simple des notifications
console.log('🔍 Test des notifications...\n');

// Simuler le chargement des conversations
async function testNotificationLogic() {
  console.log('1. Test de la logique de chargement des notifications...');
  
  // Simuler des données de conversation
  const mockConversations = [
    {
      id: 'conv-1',
      advertiser_id: 'user-1',
      publisher_id: 'user-2',
      unread_count_advertiser: 3,
      unread_count_publisher: 1
    },
    {
      id: 'conv-2',
      advertiser_id: 'user-2',
      publisher_id: 'user-1',
      unread_count_advertiser: 0,
      unread_count_publisher: 2
    }
  ];

  // Test avec user-1 (advertiser dans conv-1, publisher dans conv-2)
  const testUserId = 'user-1';
  let totalUnread = 0;
  
  mockConversations.forEach(conv => {
    if (conv.advertiser_id === testUserId) {
      totalUnread += conv.unread_count_advertiser || 0;
      console.log(`  - Conversation ${conv.id}: Advertiser avec ${conv.unread_count_advertiser} messages non lus`);
    } else if (conv.publisher_id === testUserId) {
      totalUnread += conv.unread_count_publisher || 0;
      console.log(`  - Conversation ${conv.id}: Publisher avec ${conv.unread_count_publisher} messages non lus`);
    }
  });

  console.log(`✅ Total messages non lus pour ${testUserId}: ${totalUnread}`);
  
  // Test avec user-2
  const testUserId2 = 'user-2';
  let totalUnread2 = 0;
  
  mockConversations.forEach(conv => {
    if (conv.advertiser_id === testUserId2) {
      totalUnread2 += conv.unread_count_advertiser || 0;
    } else if (conv.publisher_id === testUserId2) {
      totalUnread2 += conv.unread_count_publisher || 0;
    }
  });

  console.log(`✅ Total messages non lus pour ${testUserId2}: ${totalUnread2}`);
  
  console.log('\n2. Test de l\'affichage des badges...');
  console.log(`   Badge pour ${testUserId}: ${totalUnread > 0 ? totalUnread : 'Aucun'}`);
  console.log(`   Badge pour ${testUserId2}: ${totalUnread2 > 0 ? totalUnread2 : 'Aucun'}`);
  
  console.log('\n3. Vérification de la logique conditionnelle...');
  console.log(`   Badge affiché pour ${testUserId}: ${totalUnread > 0 ? 'Oui' : 'Non'}`);
  console.log(`   Badge affiché pour ${testUserId2}: ${totalUnread2 > 0 ? 'Oui' : 'Non'}`);
}

testNotificationLogic();
