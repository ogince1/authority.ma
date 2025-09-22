// Service email côté client utilisant l'API Brevo
import { supabase } from '../lib/supabase';

// Types pour les emails
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  tags?: string[];
}

// Templates d'emails prédéfinis
export const EMAIL_TEMPLATES: { [key: string]: EmailTemplate } = {
  ADVERTISER_WELCOME: {
    id: 'advertiser-welcome',
    name: 'advertiser-welcome',
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
</html>`,
    variables: ['user_name', 'dashboard_url']
  },
  EDITOR_WELCOME: {
    id: 'editor-welcome',
    name: 'editor-welcome',
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
</html>`,
    variables: ['user_name', 'dashboard_url']
  },
  EDITOR_SITE_APPROVED: {
    id: 'editor-site-approved',
    name: 'editor-site-approved',
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
</html>`,
    variables: ['user_name', 'site_name', 'site_url', 'dashboard_url']
  },
  EDITOR_NEW_REQUEST: {
    id: 'editor-new-request',
    name: 'editor-new-request',
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
</html>`,
    variables: ['user_name', 'site_name', 'request_id', 'proposed_price', 'dashboard_url']
  },
  ADVERTISER_ORDER_PLACED: {
    id: 'advertiser-order-placed',
    name: 'advertiser-order-placed',
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
</html>`,
    variables: ['user_name', 'order_id', 'total_amount', 'sites_count', 'dashboard_url']
  },
  ADVERTISER_BALANCE_ADDED: {
    id: 'advertiser-balance-added',
    name: 'advertiser-balance-added',
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
</html>`,
    variables: ['user_name', 'amount', 'new_balance', 'transaction_date', 'transaction_id', 'dashboard_url', 'buy_links_url']
  }
};

class EmailServiceClient {
  private brevoApiKey: string;
  private brevoApiUrl = 'https://api.brevo.com/v3';

  constructor() {
    // En production, toujours utiliser les fonctions serverless
    // En développement, utiliser la clé locale si disponible
    this.brevoApiKey = window.location.hostname.includes('localhost') 
      ? (import.meta.env.VITE_BREVO_KEY || '') 
      : '';
    
    if (!this.brevoApiKey && window.location.hostname.includes('localhost')) {
      console.warn('VITE_BREVO_KEY not found for local development');
    }
  }

  private replaceVariables(content: string, variables: { [key: string]: string | number }): string {
    let result = content;
    for (const key in variables) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(variables[key]));
    }
    return result;
  }

  private async sendViaBrevoAPI(data: EmailData): Promise<boolean> {
    // Toujours utiliser les fonctions serverless en production (Netlify/Vercel)
    if (!window.location.hostname.includes('localhost')) {
      try {
        const response = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template: 'ADVERTISER_BALANCE_ADDED',
            email: data.to,
            variables: {
              user_name: 'Utilisateur',
              amount: '500',
              new_balance: '1200',
              transaction_date: new Date().toLocaleString('fr-FR'),
              transaction_id: 'NETLIFY-' + Date.now(),
              dashboard_url: window.location.origin + '/dashboard/balance',
              buy_links_url: window.location.origin + '/buy-links'
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Email sent via Netlify function:', result);
          return true;
        } else {
          const error = await response.json();
          console.error('Netlify function error:', error);
          return false;
        }
      } catch (error) {
        console.error('Error sending email via Netlify function:', error);
        return false;
      }
    }

    // En développement local seulement, utiliser l'API Brevo directement
    if (!this.brevoApiKey) {
      console.error('Brevo API key not configured for local development');
      return false;
    }

    try {
      const response = await fetch(`${this.brevoApiUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { email: data.from || 'contact@ogince.ma', name: 'Back.ma' },
          to: [{ email: data.to }],
          subject: data.subject,
          htmlContent: data.html,
          textContent: data.text,
          tags: data.tags || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Brevo API error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('Email sent via Brevo API:', result);
      return true;
    } catch (error) {
      console.error('Error sending email via Brevo API:', error);
      return false;
    }
  }

  public async sendEmail(data: EmailData): Promise<boolean> {
    const success = await this.sendViaBrevoAPI(data);
    
    if (success) {
      // Log email history
      await this.logEmailHistory(data.to, data.subject, 'custom', 'sent', data.tags);
    } else {
      await this.logEmailHistory(data.to, data.subject, 'custom', 'failed', data.tags, 'Failed to send via Brevo API');
    }
    
    return success;
  }

  public async sendTemplateEmail(
    templateKey: keyof typeof EMAIL_TEMPLATES,
    recipientEmail: string,
    variables: { [key: string]: string | number },
    tags?: string[]
  ): Promise<boolean> {
    const template = EMAIL_TEMPLATES[templateKey];
    if (!template) {
      console.error(`Template ${String(templateKey)} not found`);
      return false;
    }

    const subject = this.replaceVariables(template.subject, variables);
    const html = this.replaceVariables(template.htmlContent, variables);

    const emailData: EmailData = {
      to: recipientEmail,
      subject: subject,
      html: html,
      from: 'contact@ogince.ma',
      tags: tags
    };

    return await this.sendEmail(emailData);
  }

  private async logEmailHistory(
    recipientEmail: string,
    subject: string,
    templateName: string,
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced',
    tags?: string[],
    errorMessage?: string
  ) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      const userId = user?.id || null;

      await supabase.from('email_history').insert({
        user_id: userId,
        email_type: tags ? tags[0] : 'unknown',
        subject: subject,
        recipient_email: recipientEmail,
        template_name: templateName,
        status: status,
        sent_at: new Date().toISOString(),
        metadata: { tags },
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Error logging email history:', error);
    }
  }
}

// Instance singleton
export const emailServiceClient = new EmailServiceClient();
