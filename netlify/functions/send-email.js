// Netlify Function pour envoyer des emails
exports.handler = async (event, context) => {
  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Récupérer les données de la requête
    const { template, email, variables } = JSON.parse(event.body);
    
    // Clé API Brevo depuis les variables d'environnement Netlify
    const brevoApiKey = process.env.BREVO_KEY || process.env.BREVO_API_KEY;
    
    if (!brevoApiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Brevo API key not configured' })
      };
    }

    // Templates d'email complets
    const emailTemplates = {
      'ADVERTISER_WELCOME': {
        subject: 'Bienvenue sur Back.ma - Boostez votre SEO ! 🎯',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenue</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Bienvenue {{user_name}} !</h1>
    </div>
    <div class="content">
      <p>Votre compte annonceur est maintenant actif sur Back.ma !</p>
      <p>Vous pouvez maintenant :</p>
      <ul>
        <li>✅ Acheter des liens de qualité pour améliorer votre SEO</li>
        <li>📊 Suivre vos performances en temps réel</li>
        <li>🎯 Cibler les sites les plus pertinents pour votre secteur</li>
      </ul>
      <p><a href="{{dashboard_url}}" class="button">Accéder à mon tableau de bord</a></p>
      <p>Besoin d'aide ? Notre équipe est là pour vous accompagner !</p>
    </div>
  </div>
</body>
</html>`
      },
      'EDITOR_WELCOME': {
        subject: 'Bienvenue sur Back.ma - Votre compte éditeur est prêt ! 🚀',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenue</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Bienvenue {{user_name}} !</h1>
    </div>
    <div class="content">
      <p>Votre compte éditeur est maintenant actif sur Back.ma !</p>
      <p>Vous pouvez maintenant :</p>
      <ul>
        <li>📝 Lister vos sites web et articles</li>
        <li>💰 Recevoir des demandes de liens et générer des revenus</li>
        <li>📊 Suivre vos performances et revenus</li>
      </ul>
      <p><a href="{{dashboard_url}}" class="button">Accéder à mon tableau de bord</a></p>
      <p>Commencez par ajouter vos premiers sites !</p>
    </div>
  </div>
</body>
</html>`
      },
      'EDITOR_SITE_APPROVED': {
        subject: '✅ Votre site {{site_name}} a été approuvé !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Site Approuvé</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Félicitations {{user_name}} !</h1>
    </div>
    <div class="content">
      <p>Votre site <strong>{{site_name}}</strong> ({{site_url}}) a été approuvé et est maintenant visible sur la plateforme !</p>
      <p>Vous pouvez maintenant :</p>
      <ul>
        <li>📝 Ajouter des annonces de liens pour ce site</li>
        <li>💰 Recevoir des demandes d'achat</li>
        <li>📊 Suivre vos revenus</li>
      </ul>
      <p><a href="{{dashboard_url}}" class="button">Gérer mes sites</a></p>
    </div>
  </div>
</body>
</html>`
      },
      'EDITOR_NEW_REQUEST': {
        subject: '🔔 Nouvelle demande de lien reçue pour {{site_name}} !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nouvelle Demande</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .request-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nouvelle demande reçue !</h1>
    </div>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Vous avez reçu une nouvelle demande de lien pour votre site <strong>{{site_name}}</strong>.</p>
      <div class="request-details">
        <h3>📋 Détails de la demande :</h3>
        <ul>
          <li><strong>ID de la demande :</strong> {{request_id}}</li>
          <li><strong>Prix proposé :</strong> {{proposed_price}} MAD</li>
        </ul>
      </div>
      <p><a href="{{dashboard_url}}" class="button">Voir la demande</a></p>
      <p>Répondez rapidement pour maximiser vos chances de conclure !</p>
    </div>
  </div>
</body>
</html>`
      },
      'ADVERTISER_ORDER_PLACED': {
        subject: '📝 Votre commande #{{order_id}} a été enregistrée !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Commande Enregistrée</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Commande enregistrée !</h1>
    </div>
    <div class="content">
      <p>Merci {{user_name}} !</p>
      <p>Votre commande <strong>#{{order_id}}</strong> a été enregistrée avec succès.</p>
      <div class="order-details">
        <h3>📋 Détails de la commande :</h3>
        <ul>
          <li><strong>Montant total :</strong> {{total_amount}} MAD</li>
          <li><strong>Nombre de sites :</strong> {{sites_count}}</li>
        </ul>
      </div>
      <p><a href="{{dashboard_url}}" class="button">Suivre ma commande</a></p>
      <p>Nos éditeurs vont maintenant traiter votre demande. Vous recevrez des mises à jour par email.</p>
    </div>
  </div>
</body>
</html>`
      },
      'ADVERTISER_BALANCE_ADDED': {
        subject: '💰 Votre solde a été rechargé de {{amount}} MAD !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solde Rechargé</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; position: relative; }
    .logo { margin-bottom: 20px; position: relative; z-index: 1; }
    .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .success-icon { text-align: center; margin-bottom: 30px; }
    .success-icon .icon { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .amount-highlight { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; }
    .amount-highlight .amount { font-size: 36px; font-weight: 700; margin: 10px 0; }
    .amount-highlight .currency { font-size: 18px; opacity: 0.9; }
    .balance-details { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #667eea; }
    .balance-details h3 { margin: 0 0 15px 0; color: #2c3e50; font-size: 18px; }
    .balance-details ul { margin: 0; padding-left: 20px; }
    .balance-details li { margin: 8px 0; color: #555; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { margin-bottom: 15px; }
    .footer .logo img { height: 40px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .amount-highlight .amount { font-size: 28px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
      </div>
      <h1>💰 Solde Rechargé !</h1>
    </div>
    
    <div class="content">
      <div class="success-icon">
        <div class="icon">✓</div>
      </div>
      
      <div class="greeting">Bonjour {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Excellente nouvelle ! Votre solde Back.ma a été rechargé avec succès.
      </p>
      
      <div class="amount-highlight">
        <div class="currency">Montant ajouté</div>
        <div class="amount">{{amount}} MAD</div>
      </div>
      
      <div class="balance-details">
        <h3>📊 Détails de votre transaction</h3>
        <ul>
          <li><strong>Montant ajouté :</strong> {{amount}} MAD</li>
          <li><strong>Nouveau solde :</strong> {{new_balance}} MAD</li>
          <li><strong>Date :</strong> {{transaction_date}}</li>
          <li><strong>ID de transaction :</strong> {{transaction_id}}</li>
        </ul>
      </div>
      
      <div class="cta-section">
        <a href="{{dashboard_url}}" class="button">Voir mon solde</a>
        <a href="{{buy_links_url}}" class="button">Acheter des liens</a>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Merci pour votre confiance ! Notre équipe est là pour vous accompagner dans votre stratégie SEO.
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">
        <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
      </div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      }
    };

    // Récupérer le template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Template not found' })
      };
    }

    // Remplacer les variables dans le template
    let subject = emailTemplate.subject;
    let htmlContent = emailTemplate.htmlContent;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
    }

    // Envoyer l'email via Brevo
    const emailData = {
      sender: { 
        email: 'contact@ogince.ma', 
        name: 'Back.ma' 
      },
      to: [{ email }],
      subject,
      htmlContent,
      tags: ['balance_added', 'advertiser', 'transaction', 'netlify']
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          messageId: result.messageId 
        })
      };
    } else {
      const error = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to send email', 
          details: error.message 
        })
      };
    }

  } catch (error) {
    console.error('Error in send-email function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
