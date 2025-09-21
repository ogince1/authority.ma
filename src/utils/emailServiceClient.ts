// Service email côté client utilisant l'API Brevo Transactional
// Compatible navigateur (pas de modules Node.js)

// Configuration
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Templates d'email avec variables
const EMAIL_TEMPLATES = {
  // Email de bienvenue pour les éditeurs
  EDITOR_WELCOME: {
    subject: '🎉 Bienvenue sur Back.ma - Votre compte éditeur est prêt !',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenue sur Back.ma</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { margin-bottom: 20px; }
          .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .footer .logo img { height: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <h1>🎉 Bienvenue {{user_name}} !</h1>
          </div>
          <div class="content">
            <div class="greeting">Votre compte éditeur est maintenant actif !</div>
            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>Ajouter vos sites web</li>
              <li>Recevoir des demandes de liens</li>
              <li>Gérer vos revenus</li>
            </ul>
            <div style="text-align: center;">
              <a href="{{dashboard_url}}" class="cta-button">Accéder à mon dashboard</a>
            </div>
          </div>
          <div class="footer">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <p><strong>Back.ma</strong> - Votre partenaire SEO</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Email de bienvenue pour les annonceurs
  ADVERTISER_WELCOME: {
    subject: '🚀 Bienvenue sur Back.ma - Commencez votre stratégie SEO !',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenue sur Back.ma</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { margin-bottom: 20px; }
          .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .footer .logo img { height: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <h1>🚀 Bienvenue {{user_name}} !</h1>
          </div>
          <div class="content">
            <div class="greeting">Votre compte annonceur est prêt !</div>
            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>Recharger votre solde</li>
              <li>Acheter des liens de qualité</li>
              <li>Améliorer votre référencement</li>
            </ul>
            <div style="text-align: center;">
              <a href="{{dashboard_url}}" class="cta-button">Commencer maintenant</a>
            </div>
          </div>
          <div class="footer">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <p><strong>Back.ma</strong> - Votre partenaire SEO</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Email de nouvelle demande pour les éditeurs
  EDITOR_NEW_REQUEST: {
    subject: '💼 Nouvelle demande de lien pour {{site_name}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouvelle demande</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { margin-bottom: 20px; }
          .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .footer .logo img { height: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <h1>💼 Nouvelle demande !</h1>
          </div>
          <div class="content">
            <div class="greeting">Bonjour {{user_name}} !</div>
            <p>Vous avez reçu une nouvelle demande de lien pour <strong>{{site_name}}</strong></p>
            <p><strong>Prix proposé :</strong> {{proposed_price}} MAD</p>
            <p><strong>ID de la demande :</strong> {{request_id}}</p>
            <div style="text-align: center;">
              <a href="{{dashboard_url}}" class="cta-button">Voir la demande</a>
            </div>
          </div>
          <div class="footer">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <p><strong>Back.ma</strong> - Votre partenaire SEO</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Email de site approuvé pour les éditeurs
  EDITOR_SITE_APPROVED: {
    subject: '✅ Votre site {{site_name}} a été approuvé !',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Site approuvé</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { margin-bottom: 20px; }
          .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .footer .logo img { height: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <h1>✅ Site approuvé !</h1>
          </div>
          <div class="content">
            <div class="greeting">Félicitations {{user_name}} !</div>
            <p>Votre site <strong>{{site_name}}</strong> a été approuvé et est maintenant disponible pour recevoir des demandes de liens.</p>
            <p><strong>URL :</strong> {{site_url}}</p>
            <div style="text-align: center;">
              <a href="{{dashboard_url}}" class="cta-button">Gérer mes sites</a>
            </div>
          </div>
          <div class="footer">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <p><strong>Back.ma</strong> - Votre partenaire SEO</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Email de site rejeté pour les éditeurs
  EDITOR_SITE_REJECTED: {
    subject: '❌ Votre site {{site_name}} nécessite des modifications',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Site rejeté</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { margin-bottom: 20px; }
          .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .footer .logo img { height: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <h1>❌ Modifications nécessaires</h1>
          </div>
          <div class="content">
            <div class="greeting">Bonjour {{user_name}},</div>
            <p>Votre site <strong>{{site_name}}</strong> nécessite quelques modifications avant d'être approuvé.</p>
            <p><strong>Raison :</strong> {{rejection_reason}}</p>
            <div style="text-align: center;">
              <a href="{{dashboard_url}}" class="cta-button">Modifier mon site</a>
              <a href="{{support_url}}" class="cta-button">Contacter le support</a>
            </div>
          </div>
          <div class="footer">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <p><strong>Back.ma</strong> - Votre partenaire SEO</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Email de commande passée pour les annonceurs
  ADVERTISER_ORDER_PLACED: {
    subject: '🛒 Commande confirmée - {{order_id}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Commande confirmée</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { margin-bottom: 20px; }
          .logo img { height: 60px; width: auto; filter: brightness(0) invert(1); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .footer .logo img { height: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <h1>🛒 Commande confirmée !</h1>
          </div>
          <div class="content">
            <div class="greeting">Merci {{user_name}} !</div>
            <p>Votre commande <strong>{{order_id}}</strong> a été confirmée avec succès.</p>
            <p><strong>Total :</strong> {{total_amount}} MAD</p>
            <p><strong>Sites :</strong> {{sites_count}} lien(s)</p>
            <div style="text-align: center;">
              <a href="{{dashboard_url}}" class="cta-button">Suivre ma commande</a>
            </div>
          </div>
          <div class="footer">
            <div class="logo">
              <img src="https://back.ma/logo-simple.svg" alt="Back.ma" />
            </div>
            <p><strong>Back.ma</strong> - Votre partenaire SEO</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Email de recharge de solde pour les annonceurs
  ADVERTISER_BALANCE_ADDED: {
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
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat; opacity: 0.3; }
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
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .secondary-button { background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); }
    .info-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
    .info-section h4 { margin: 0 0 10px 0; color: #1976d2; font-size: 16px; }
    .info-section p { margin: 5px 0; color: #555; font-size: 14px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { margin-bottom: 15px; }
    .footer .logo img { height: 40px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .footer .social { margin-top: 20px; }
    .footer .social a { color: white; text-decoration: none; margin: 0 10px; opacity: 0.7; }
    .footer .social a:hover { opacity: 1; }
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
        <a href="{{buy_links_url}}" class="button secondary-button">Acheter des liens</a>
      </div>
      
      <div class="info-section">
        <h4>💡 Que pouvez-vous faire maintenant ?</h4>
        <p>• Achetez des liens de qualité pour améliorer votre SEO</p>
        <p>• Ciblez les sites les plus pertinents pour votre secteur</p>
        <p>• Suivez vos performances en temps réel</p>
        <p>• Gérez vos campagnes depuis votre dashboard</p>
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
      <div class="social">
        <a href="https://back.ma">Site Web</a> |
        <a href="mailto:contact@back.ma">Contact</a> |
        <a href="{{dashboard_url}}">Dashboard</a>
      </div>
      <p style="font-size: 12px; opacity: 0.6; margin-top: 15px;">
        Cet email a été envoyé automatiquement suite à votre recharge de solde.
      </p>
    </div>
  </div>
</body>
</html>`
  }
};

// Fonction pour remplacer les variables dans le contenu
function replaceVariables(content: string, variables: Record<string, any>): string {
  let result = content;
  for (const key in variables) {
    const value = variables[key] !== undefined ? String(variables[key]) : '';
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Fonction pour envoyer un email via l'API Brevo
async function sendEmail(to: string, subject: string, htmlContent: string, tags: string[] = []): Promise<boolean> {
  try {
    if (!BREVO_API_KEY) {
      console.error('Clé API Brevo manquante');
      return false;
    }

    const emailData = {
      sender: {
        email: 'contact@ogince.ma',
        name: 'Back.ma'
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: htmlContent,
      tags: tags
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Email envoyé avec succès:', result.messageId);
      return true;
    } else {
      const errorData = await response.json();
      console.error('Erreur API Brevo:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
}

// Fonction pour envoyer un email avec template
export async function sendTemplateEmail(
  templateKey: keyof typeof EMAIL_TEMPLATES,
  to: string,
  variables: Record<string, any> = {},
  tags: string[] = []
): Promise<boolean> {
  try {
    const template = EMAIL_TEMPLATES[templateKey];
    if (!template) {
      console.error(`Template ${templateKey} non trouvé`);
      return false;
    }

    const subject = replaceVariables(template.subject, variables);
    const htmlContent = replaceVariables(template.htmlContent, variables);

    return await sendEmail(to, subject, htmlContent, tags);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du template email:', error);
    return false;
  }
}

// Export du service email client
export const emailServiceClient = {
  sendEmail,
  sendTemplateEmail
};

export default emailServiceClient;
