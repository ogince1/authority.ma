// Templates d'email étendus pour Back.ma
// Tous les templates avec charte graphique et logo texte

export const EXTENDED_EMAIL_TEMPLATES = {
  // ===== STATUTS DE COMMANDES =====
  ADVERTISER_ORDER_ACCEPTED: {
    id: 'advertiser-order-accepted',
    name: 'advertiser-order-accepted',
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
</html>`,
    variables: ['user_name', 'order_id', 'sites_count', 'total_amount', 'dashboard_url']
  },

  ADVERTISER_ORDER_REJECTED: {
    id: 'advertiser-order-rejected',
    name: 'advertiser-order-rejected',
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
</html>`,
    variables: ['user_name', 'order_id', 'rejection_reason', 'refund_amount', 'dashboard_url']
  },

  // ===== PAIEMENTS ÉDITEURS =====
  EDITOR_PAYMENT_RECEIVED: {
    id: 'editor-payment-received',
    name: 'editor-payment-received',
    subject: '💰 Paiement reçu - {{amount}} MAD - Back.ma',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Paiement Reçu</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .payment-icon { text-align: center; margin-bottom: 30px; }
    .payment-icon .icon { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px; }
    .greeting { font-size: 24px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; text-align: center; }
    .amount-section { background: #e8f5e8; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4CAF50; text-align: center; }
    .amount-section h3 { margin: 0 0 15px 0; color: #2e7d32; font-size: 18px; }
    .amount { font-size: 48px; font-weight: 700; color: #2e7d32; margin: 20px 0; }
    .payment-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .payment-details h4 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
    .payment-details ul { margin: 0; padding-left: 20px; }
    .payment-details li { margin: 8px 0; color: #555; }
    .cta-section { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; transition: transform 0.2s ease; }
    .button:hover { transform: translateY(-2px); }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
    .footer .logo { font-size: 24px; margin-bottom: 15px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .amount { font-size: 36px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BACK.MA</div>
      <h1>💰 Paiement Reçu</h1>
    </div>
    
    <div class="content">
      <div class="payment-icon">
        <div class="icon">💳</div>
      </div>
      
      <div class="greeting">Félicitations {{user_name}} !</div>
      
      <p style="text-align: center; font-size: 18px; color: #555; margin-bottom: 30px;">
        Vous avez reçu un nouveau paiement pour vos services d'éditeur !
      </p>
      
      <div class="amount-section">
        <h3>💰 Montant reçu</h3>
        <div class="amount">{{amount}} MAD</div>
      </div>
      
      <div class="payment-details">
        <h4>📋 Détails du paiement</h4>
        <ul>
          <li><strong>ID de commande :</strong> {{order_id}}</li>
          <li><strong>Méthode de paiement :</strong> {{payment_method}}</li>
          <li><strong>Annonceur :</strong> {{advertiser_name}}</li>
          <li><strong>Date :</strong> {{payment_date}}</li>
        </ul>
      </div>
      
      <div class="cta-section">
        <a href="{{dashboard_url}}" class="button">Voir mes gains</a>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Continuez à proposer des liens de qualité pour maximiser vos revenus !
      </p>
    </div>
    
    <div class="footer">
      <div class="logo">BACK.MA</div>
      <p><strong>Back.ma</strong> - Votre partenaire SEO de confiance</p>
      <p>Plateforme de liens de qualité pour améliorer votre référencement</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['user_name', 'amount', 'order_id', 'payment_method', 'advertiser_name', 'payment_date', 'dashboard_url']
  }
};

// Fonction pour fusionner les templates étendus avec les templates existants
export function mergeEmailTemplates(existingTemplates: any) {
  return {
    ...existingTemplates,
    ...EXTENDED_EMAIL_TEMPLATES
  };
}
