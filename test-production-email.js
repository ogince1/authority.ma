// Test de l'envoi d'email en production via la fonction Netlify
console.log('🧪 Test d\'envoi d\'email de notification en production...\n');

// Test data
const testData = {
  template: 'NEW_MESSAGE_NOTIFICATION',
  email: 'test@example.com', // Remplacez par votre email pour tester
  variables: {
    sender_name: 'Test Sender',
    request_id: 'REQ12345',
    website_title: 'example.com',
    message_content: 'Ceci est un message de test pour vérifier l\'envoi d\'emails de notification.',
    conversation_url: 'https://back.ma/dashboard/purchase-requests'
  }
};

async function testProductionEmail() {
  try {
    console.log('📧 Test avec les données suivantes:');
    console.log(`   Template: ${testData.template}`);
    console.log(`   Email destinataire: ${testData.email}`);
    console.log(`   Variables:`, testData.variables);
    
    // Test en local (va échouer car pas de serveur Netlify)
    console.log('\n1. Test en local...');
    
    const localResponse = await fetch('http://localhost:8888/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    }).catch(() => null);

    if (localResponse) {
      console.log('✅ Serveur local Netlify détecté');
      const result = await localResponse.json();
      console.log('Résultat:', result);
    } else {
      console.log('❌ Serveur local Netlify non disponible');
    }

    // Instructions pour tester en production
    console.log('\n2. Pour tester en production sur Netlify:');
    console.log('   a. Déployez l\'application sur Netlify');
    console.log('   b. Utilisez cette commande curl:');
    console.log('   curl -X POST https://votre-site.netlify.app/.netlify/functions/send-email \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'' + JSON.stringify(testData, null, 2) + '\'');

    console.log('\n3. Vérification du template ajouté...');
    
    // Vérifier que le template NEW_MESSAGE_NOTIFICATION est présent
    const fs = await import('fs');
    const path = './netlify/functions/send-email.js';
    
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf8');
      
      if (content.includes('NEW_MESSAGE_NOTIFICATION')) {
        console.log('✅ Template NEW_MESSAGE_NOTIFICATION trouvé dans send-email.js');
        
        // Vérifier la structure du template
        const templateMatch = content.match(/\'NEW_MESSAGE_NOTIFICATION\':\s*\{[^}]+subject:[^}]+htmlContent:[^}]+\}/s);
        if (templateMatch) {
          console.log('✅ Structure du template valide');
        } else {
          console.log('❌ Structure du template incomplète');
        }
        
        // Vérifier les variables
        const variablesCheck = [
          'sender_name',
          'request_id', 
          'website_title',
          'message_content',
          'conversation_url'
        ];
        
        let allVariablesPresent = true;
        variablesCheck.forEach(variable => {
          if (content.includes(`{{${variable}}}`)) {
            console.log(`✅ Variable {{${variable}}} présente`);
          } else {
            console.log(`❌ Variable {{${variable}}} manquante`);
            allVariablesPresent = false;
          }
        });
        
        if (allVariablesPresent) {
          console.log('✅ Toutes les variables requises sont présentes');
        }
        
      } else {
        console.log('❌ Template NEW_MESSAGE_NOTIFICATION manquant dans send-email.js');
      }
    } else {
      console.log('❌ Fichier send-email.js non trouvé');
    }

    console.log('\n4. Prochaines étapes:');
    console.log('   - Assurez-vous que BREVO_KEY est défini dans les variables d\'environnement Netlify');
    console.log('   - Vérifiez que l\'IP de Netlify est autorisée dans Brevo');
    console.log('   - Testez l\'envoi depuis l\'interface utilisateur de l\'application');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testProductionEmail();
