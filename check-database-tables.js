import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseTables() {
  console.log('🔍 Vérification des tables de la base de données\n');

  const tablesToCheck = [
    'conversations',
    'conversation_messages', 
    'link_purchase_requests',
    'users',
    'websites',
    'link_listings',
    'notifications'
  ];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`📋 Vérification de la table: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: Accessible (${data ? data.length : 0} enregistrements trouvés)`);
      }
    } catch (err) {
      console.log(`❌ Table ${tableName}: Erreur - ${err.message}`);
    }
    console.log('');
  }

  // Vérification spécifique des tables de messagerie
  console.log('💬 Vérification détaillée des tables de messagerie...\n');

  try {
    // Vérifier la structure de la table conversations
    console.log('📊 Structure de la table conversations:');
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.log(`❌ Erreur conversations: ${convError.message}`);
    } else {
      console.log('✅ Table conversations accessible');
      if (convData && convData.length > 0) {
        console.log('📋 Colonnes disponibles:', Object.keys(convData[0]));
      }
    }
    console.log('');

    // Vérifier la structure de la table conversation_messages
    console.log('📊 Structure de la table conversation_messages:');
    const { data: msgData, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .limit(1);
    
    if (msgError) {
      console.log(`❌ Erreur conversation_messages: ${msgError.message}`);
    } else {
      console.log('✅ Table conversation_messages accessible');
      if (msgData && msgData.length > 0) {
        console.log('📋 Colonnes disponibles:', Object.keys(msgData[0]));
      }
    }
    console.log('');

    // Vérifier les demandes d'achat avec content_option = 'platform'
    console.log('🔍 Recherche des demandes avec rédaction par la plateforme:');
    const { data: platformRequests, error: reqError } = await supabase
      .from('link_purchase_requests')
      .select('id, anchor_text, content_option, status, extended_status, created_at')
      .eq('content_option', 'platform')
      .limit(5);
    
    if (reqError) {
      console.log(`❌ Erreur lors de la recherche: ${reqError.message}`);
    } else {
      console.log(`✅ ${platformRequests ? platformRequests.length : 0} demandes avec rédaction par la plateforme trouvées`);
      if (platformRequests && platformRequests.length > 0) {
        console.log('📋 Exemples:');
        platformRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. ID: ${req.id}, Texte: ${req.anchor_text}, Statut: ${req.status}/${req.extended_status}`);
        });
      }
    }
    console.log('');

    // Vérifier les conversations existantes
    console.log('💬 Conversations existantes:');
    const { data: existingConv, error: existingConvError } = await supabase
      .from('conversations')
      .select('id, subject, advertiser_id, publisher_id, created_at')
      .limit(5);
    
    if (existingConvError) {
      console.log(`❌ Erreur conversations existantes: ${existingConvError.message}`);
    } else {
      console.log(`✅ ${existingConv ? existingConv.length : 0} conversations existantes`);
      if (existingConv && existingConv.length > 0) {
        console.log('📋 Exemples:');
        existingConv.forEach((conv, index) => {
          console.log(`   ${index + 1}. ID: ${conv.id}, Sujet: ${conv.subject}, Créée: ${conv.created_at}`);
        });
      }
    }
    console.log('');

    // Vérifier les messages existants
    console.log('📨 Messages existants:');
    const { data: existingMsg, error: existingMsgError } = await supabase
      .from('conversation_messages')
      .select('id, content, sender_id, receiver_id, created_at')
      .limit(5);
    
    if (existingMsgError) {
      console.log(`❌ Erreur messages existants: ${existingMsgError.message}`);
    } else {
      console.log(`✅ ${existingMsg ? existingMsg.length : 0} messages existants`);
      if (existingMsg && existingMsg.length > 0) {
        console.log('📋 Exemples:');
        existingMsg.forEach((msg, index) => {
          console.log(`   ${index + 1}. ID: ${msg.id}, Contenu: ${msg.content.substring(0, 50)}..., Créé: ${msg.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkDatabaseTables();
