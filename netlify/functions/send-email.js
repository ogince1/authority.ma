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
      'EDITOR_SITE_REJECTED': {
        subject: '❌ Votre site {{site_name}} n\'a pas été approuvé',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Site Rejeté</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .rejection-reason { background: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Site non approuvé</h1>
    </div>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Malheureusement, votre site <strong>{{site_name}}</strong> n'a pas été approuvé pour figurer sur notre plateforme.</p>
      
      <div class="rejection-reason">
        <h3>📋 Raison du rejet :</h3>
        <p>{{rejection_reason}}</p>
      </div>
      
      <p>Ne vous découragez pas ! Vous pouvez :</p>
      <ul>
        <li>✅ Corriger les problèmes mentionnés</li>
        <li>🔄 Soumettre à nouveau votre site</li>
        <li>📞 Nous contacter pour plus d'informations</li>
      </ul>
      
      <p><a href="{{dashboard_url}}" class="button">Gérer mes sites</a></p>
      <p>Notre équipe est là pour vous aider à améliorer votre site !</p>
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
      
      // ===== AUTHENTIFICATION & SÉCURITÉ =====
      'PASSWORD_RESET': {
        subject: '🔒 Réinitialisation de votre mot de passe Back.ma',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Réinitialisation Mot de Passe</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .security-icon { text-align: center; margin-bottom: 30px; }
    .security-icon .icon { display: inline-block; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .reset-section { background: #fff3e0; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ff9800; }
    .reset-section h3 { margin: 0 0 15px 0; color: #e65100; font-size: 18px; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .warning-section { background: #ffebee; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f44336; }
    .warning-section h4 { margin: 0 0 10px 0; color: #c62828; font-size: 16px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>🔒 Réinitialisation de Mot de Passe</h1>
    </div>
    
    <div class="content">
      <div class="security-icon">
        <div class="icon">🔑</div>
      </div>
      
      <div class="greeting">Bonjour {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Nous avons reçu une demande de réinitialisation de votre mot de passe Back.ma.
      </p>
      
      <div class="reset-section">
        <h3>🔐 Réinitialiser votre mot de passe</h3>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe sécurisé :</p>
        <div class="cta-section">
          <a href="{{reset_url}}" class="button">Réinitialiser mon mot de passe</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 15px;">
          Ce lien expirera dans {{expires_in}} pour votre sécurité.
        </p>
      </div>
      
      <div class="warning-section">
        <h4>⚠️ Important</h4>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.</p>
        <p>Pour toute question, contactez-nous à {{support_email}}</p>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Cet email a été envoyé automatiquement pour votre sécurité.
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      },
      
      'EMAIL_VERIFICATION': {
        subject: '✅ Vérifiez votre adresse email - Back.ma',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vérification Email</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .verification-icon { text-align: center; margin-bottom: 30px; }
    .verification-icon .icon { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .verify-section { background: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4CAF50; }
    .verify-section h3 { margin: 0 0 15px 0; color: #2e7d32; font-size: 18px; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .info-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
    .info-section h4 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>✅ Vérification Email</h1>
    </div>
    
    <div class="content">
      <div class="verification-icon">
        <div class="icon">✉️</div>
      </div>
      
      <div class="greeting">Bienvenue {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Merci de vous être inscrit sur Back.ma ! Vérifiez votre adresse email pour activer votre compte.
      </p>
      
      <div class="verify-section">
        <h3>📧 Vérifiez votre adresse email</h3>
        <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte :</p>
        <div class="cta-section">
          <a href="{{verification_url}}" class="button">Vérifier mon email</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 15px;">
          Ce lien expirera dans {{expires_in}} pour votre sécurité.
        </p>
      </div>
      
      <div class="info-section">
        <h4>💡 Après vérification</h4>
        <p>Une fois votre email vérifié, vous pourrez :</p>
        <p>• Accéder à votre tableau de bord</p>
        <p>• Acheter des liens de qualité</p>
        <p>• Suivre vos performances SEO</p>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      },
      
      // ===== GESTION DU SOLDE =====
      'ADVERTISER_LOW_BALANCE': {
        subject: '⚠️ Solde faible - Rechargez votre compte Back.ma',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solde Faible</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .warning-icon { text-align: center; margin-bottom: 30px; }
    .warning-icon .icon { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .balance-section { background: #fff3e0; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ff9800; }
    .balance-section h3 { margin: 0 0 15px 0; color: #e65100; font-size: 18px; }
    .balance-amount { font-size: 36px; font-weight: 700; color: #e65100; text-align: center; margin: 20px 0; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .info-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
    .info-section h4 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .balance-amount { font-size: 28px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>⚠️ Solde Faible</h1>
    </div>
    
    <div class="content">
      <div class="warning-icon">
        <div class="icon">💰</div>
      </div>
      
      <div class="greeting">Bonjour {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Votre solde Back.ma est faible. Rechargez votre compte pour continuer vos achats de liens.
      </p>
      
      <div class="balance-section">
        <h3>💰 Votre solde actuel</h3>
        <div class="balance-amount">{{current_balance}} MAD</div>
        <p style="text-align: center; color: #666;">
          Solde minimum recommandé : {{minimum_balance}} MAD
        </p>
      </div>
      
      <div class="cta-section">
        <a href="{{top_up_url}}" class="button">Recharger mon compte</a>
      </div>
      
      <div class="info-section">
        <h4>💡 Pourquoi recharger maintenant ?</h4>
        <p>• Continuer vos achats de liens de qualité</p>
        <p>• Profiter des meilleures opportunités SEO</p>
        <p>• Éviter les interruptions dans vos campagnes</p>
        <p>• Maintenir vos positions de référencement</p>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Rechargez dès maintenant pour ne pas manquer les meilleures opportunités !
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      },
      
      'ADVERTISER_BALANCE_EMPTY': {
        subject: '🚨 Solde à zéro - Rechargez immédiatement votre compte Back.ma',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solde à Zéro</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .alert-icon { text-align: center; margin-bottom: 30px; }
    .alert-icon .icon { display: inline-block; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .empty-section { background: #ffebee; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f44336; }
    .empty-section h3 { margin: 0 0 15px 0; color: #c62828; font-size: 18px; }
    .zero-amount { font-size: 48px; font-weight: 700; color: #f44336; text-align: center; margin: 20px 0; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .urgent-section { background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800; }
    .urgent-section h4 { margin: 0 0 10px 0; color: #e65100; font-size: 16px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .zero-amount { font-size: 36px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>🚨 Solde à Zéro</h1>
    </div>
    
    <div class="content">
      <div class="alert-icon">
        <div class="icon">💳</div>
      </div>
      
      <div class="greeting">Bonjour {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        ⚠️ Votre solde Back.ma est maintenant à zéro. Rechargez immédiatement pour continuer vos achats.
      </p>
      
      <div class="empty-section">
        <h3>💳 Votre solde</h3>
        <div class="zero-amount">0 MAD</div>
        <p style="text-align: center; color: #666;">
          Dernière transaction : {{last_transaction_date}}
        </p>
      </div>
      
      <div class="cta-section">
        <a href="{{top_up_url}}" class="button">Recharger maintenant</a>
      </div>
      
      <div class="urgent-section">
        <h4>🚨 Action requise</h4>
        <p>Votre compte est maintenant vide. Pour continuer à :</p>
        <p>• Acheter des liens de qualité</p>
        <p>• Maintenir vos campagnes SEO</p>
        <p>• Profiter des nouvelles opportunités</p>
        <p><strong>Rechargez votre compte dès maintenant !</strong></p>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Ne manquez pas les meilleures opportunités de référencement !
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      },
      
      // ===== STATUTS DE COMMANDES =====
      'ADVERTISER_ORDER_ACCEPTED': {
        subject: '✅ Votre commande #{{order_id}} a été acceptée !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Commande Acceptée</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .success-icon { text-align: center; margin-bottom: 30px; }
    .success-icon .icon { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .order-section { background: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4CAF50; }
    .order-section h3 { margin: 0 0 15px 0; color: #2e7d32; font-size: 18px; }
    .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .order-details h4 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
    .order-details ul { margin: 0; padding-left: 20px; }
    .order-details li { margin: 8px 0; color: #555; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .info-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
    .info-section h4 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>✅ Commande Acceptée</h1>
    </div>
    
    <div class="content">
      <div class="success-icon">
        <div class="icon">🎉</div>
      </div>
      
      <div class="greeting">Excellente nouvelle {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Votre commande a été acceptée par l'éditeur. Votre lien sera bientôt placé !
      </p>
      
      <div class="order-section">
        <h3>📝 Commande acceptée</h3>
        <p>L'éditeur a accepté votre demande et va maintenant procéder au placement de votre lien.</p>
      </div>
      
      <div class="order-details">
        <h4>📋 Détails de la commande</h4>
        <ul>
          <li><strong>ID de commande :</strong> {{order_id}}</li>
          <li><strong>Nombre de sites :</strong> {{sites_count}}</li>
          <li><strong>Montant total :</strong> {{total_amount}} MAD</li>
          <li><strong>Statut :</strong> Acceptée</li>
        </ul>
      </div>
      
      <div class="cta-section">
        <a href="{{dashboard_url}}" class="button">Suivre ma commande</a>
      </div>
      
      <div class="info-section">
        <h4>⏰ Prochaines étapes</h4>
        <p>• L'éditeur va placer votre lien</p>
        <p>• Vous recevrez une notification une fois le lien publié</p>
        <p>• Vous pourrez suivre les performances depuis votre dashboard</p>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Merci pour votre confiance ! Notre équipe suit votre commande.
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      },
      
      'ADVERTISER_ORDER_REJECTED': {
        subject: '❌ Votre commande #{{order_id}} a été rejetée',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Commande Rejetée</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .rejection-icon { text-align: center; margin-bottom: 30px; }
    .rejection-icon .icon { display: inline-block; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .rejection-section { background: #ffebee; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f44336; }
    .rejection-section h3 { margin: 0 0 15px 0; color: #c62828; font-size: 18px; }
    .reason-section { background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800; }
    .reason-section h4 { margin: 0 0 10px 0; color: #e65100; font-size: 16px; }
    .refund-section { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    .refund-section h4 { margin: 0 0 10px 0; color: #2e7d32; font-size: 16px; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>❌ Commande Rejetée</h1>
    </div>
    
    <div class="content">
      <div class="rejection-icon">
        <div class="icon">😔</div>
      </div>
      
      <div class="greeting">Bonjour {{user_name}},</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Malheureusement, votre commande a été rejetée par l'éditeur.
      </p>
      
      <div class="rejection-section">
        <h3>❌ Commande rejetée</h3>
        <p>L'éditeur n'a pas pu accepter votre demande pour cette commande.</p>
      </div>
      
      <div class="reason-section">
        <h4>📋 Raison du rejet</h4>
        <p>{{rejection_reason}}</p>
      </div>
      
      <div class="refund-section">
        <h4>💰 Remboursement</h4>
        <p>Le montant de <strong>{{refund_amount}} MAD</strong> sera remboursé sur votre solde dans les 24h.</p>
        <p>Vous pouvez utiliser ce montant pour d'autres achats de liens.</p>
      </div>
      
      <div class="cta-section">
        <a href="{{dashboard_url}}" class="button">Voir d'autres opportunités</a>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Ne vous découragez pas ! Explorez nos autres opportunités de liens de qualité.
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`
      },
      
      'ADVERTISER_ORDER_COMPLETED': {
        subject: '🎉 Votre commande #{{order_id}} est terminée !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Commande Terminée</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .celebration-icon { text-align: center; margin-bottom: 30px; }
    .celebration-icon .icon { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .completion-section { background: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4CAF50; }
    .completion-section h3 { margin: 0 0 15px 0; color: #2e7d32; font-size: 18px; }
    .links-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .links-section h4 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
    .links-section ul { margin: 0; padding-left: 20px; }
    .links-section li { margin: 8px 0; color: #555; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .secondary-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .info-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
    .info-section h4 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>🎉 Commande Terminée</h1>
    </div>
    
    <div class="content">
      <div class="celebration-icon">
        <div class="icon">🚀</div>
      </div>
      
      <div class="greeting">Félicitations {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Votre commande a été complétée avec succès ! Vos liens sont maintenant en ligne.
      </p>
      
      <div class="completion-section">
        <h3>✅ Commande terminée</h3>
        <p>L'éditeur a terminé le placement de tous vos liens. Votre stratégie SEO est maintenant active !</p>
      </div>
      
      <div class="links-section">
        <h4>🔗 Liens placés</h4>
        <ul>
          <li><strong>Nombre de liens :</strong> {{links_placed}}</li>
          <li><strong>ID de commande :</strong> {{order_id}}</li>
          <li><strong>Montant total :</strong> {{total_amount}} MAD</li>
          <li><strong>Date de completion :</strong> {{completion_date}}</li>
        </ul>
      </div>
      
      <div class="cta-section">
        <a href="{{report_url}}" class="button">Voir le rapport</a>
        <a href="{{dashboard_url}}" class="button secondary-button">Mon dashboard</a>
      </div>
      
      <div class="info-section">
        <h4>📊 Prochaines étapes</h4>
        <p>• Surveillez les performances de vos liens</p>
        <p>• Consultez le rapport détaillé</p>
        <p>• Planifiez vos prochaines campagnes</p>
        <p>• Suivez l'évolution de votre référencement</p>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Merci pour votre confiance ! Continuez à développer votre présence en ligne.
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
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
      },
      'NEW_MESSAGE_NOTIFICATION': {
        subject: 'Nouveau message reçu - {{sender_name}} 📩',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nouveau message</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .message-box { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .sender-info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📩 Nouveau message reçu</h1>
      <p>Vous avez reçu un nouveau message de {{sender_name}}</p>
    </div>
    <div class="content">
      <div class="sender-info">
        <h3>👤 De : {{sender_name}}</h3>
        <p><strong>Demande :</strong> #{{request_id}}</p>
        <p><strong>Site web :</strong> {{website_title}}</p>
      </div>
      
      <div class="message-box">
        <h3>💬 Message :</h3>
        <p style="font-style: italic; color: #666; border-left: 3px solid #667eea; padding-left: 15px;">
          "{{message_content}}"
        </p>
      </div>
      
      <p>Répondez rapidement pour maintenir une communication fluide avec votre partenaire.</p>
      
      <div style="text-align: center;">
        <a href="{{conversation_url}}" class="button">💬 Voir la conversation</a>
      </div>
      
      <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
        <h4>💡 Conseil</h4>
        <p>Une communication rapide et claire améliore les chances d'acceptation de votre demande et renforce la relation avec l'éditeur.</p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      
      <p style="text-align: center; color: #666; font-size: 14px;">
        <strong>Back.ma</strong> - Votre partenaire SEO de confiance<br>
        Plateforme de liens de qualité pour améliorer votre référencement
      </p>
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
