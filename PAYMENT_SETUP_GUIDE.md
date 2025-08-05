# 🏦 Guide de Configuration des Paiements

Ce guide vous explique comment configurer PayPal et Stripe pour activer les vrais paiements sur votre plateforme Authority.ma.

## 📋 Prérequis

- Compte PayPal Business
- Compte Stripe
- Domaine configuré (pour la production)
- Certificat SSL (pour la production)

---

## 🔵 Configuration PayPal

### 1. Créer un compte PayPal Business

1. Allez sur [paypal.com](https://www.paypal.com)
2. Cliquez sur "Créer un compte"
3. Sélectionnez "Compte Business"
4. Remplissez les informations requises
5. Vérifiez votre compte

### 2. Obtenir les clés API

#### Mode Sandbox (Test)
1. Connectez-vous à [developer.paypal.com](https://developer.paypal.com)
2. Allez dans "Apps & Credentials"
3. Cliquez sur "Create App"
4. Nommez votre app (ex: "Authority.ma Test")
5. Sélectionnez "Business" comme type
6. Copiez le **Client ID** et **Secret**

#### Mode Production
1. Dans votre compte PayPal Business
2. Allez dans "Outils" > "API"
3. Cliquez sur "Gérer les API"
4. Activez l'API REST
5. Copiez le **Client ID** et **Secret**

### 3. Configurer les variables d'environnement

```bash
# Dans votre fichier .env.local
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
VITE_PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
VITE_PAYPAL_MODE=sandbox  # ou 'live' pour la production
```

---

## 💳 Configuration Stripe

### 1. Créer un compte Stripe

1. Allez sur [stripe.com](https://stripe.com)
2. Cliquez sur "Commencer"
3. Remplissez les informations de votre entreprise
4. Vérifiez votre compte

### 2. Obtenir les clés API

#### Mode Test
1. Connectez-vous à votre [dashboard Stripe](https://dashboard.stripe.com)
2. Assurez-vous d'être en mode "Test"
3. Allez dans "Developers" > "API keys"
4. Copiez la **Publishable key** et **Secret key**

#### Mode Production
1. Basculez en mode "Live"
2. Allez dans "Developers" > "API keys"
3. Copiez la **Publishable key** et **Secret key**

### 3. Configurer les variables d'environnement

```bash
# Dans votre fichier .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

---

## 🔧 Configuration de l'Application

### 1. Installer les dépendances

```bash
npm install @stripe/stripe-js
```

### 2. Mettre à jour le fichier .env.local

Copiez le contenu de `env.example` vers `.env.local` et remplissez vos vraies clés :

```bash
cp env.example .env.local
```

### 3. Configurer les webhooks (Production)

#### PayPal Webhooks
1. Dans votre dashboard PayPal Developer
2. Allez dans "Webhooks"
3. Ajoutez une URL : `https://votre-domaine.com/api/paypal-webhook`
4. Sélectionnez les événements :
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`

#### Stripe Webhooks
1. Dans votre dashboard Stripe
2. Allez dans "Developers" > "Webhooks"
3. Ajoutez une URL : `https://votre-domaine.com/api/stripe-webhook`
4. Sélectionnez les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

---

## 🧪 Test des Paiements

### Mode Test PayPal
- Email : `sb-1234567890@business.example.com`
- Mot de passe : `123456789`

### Mode Test Stripe
Utilisez ces cartes de test :
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **CVV** : `123`
- **Date** : `12/25`

---

## 🚀 Déploiement en Production

### 1. Changer les modes
```bash
VITE_PAYPAL_MODE=live
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_SECRET_KEY=sk_live_...
```

### 2. Configurer le domaine
- Ajoutez votre domaine dans les paramètres PayPal
- Configurez les webhooks avec votre vrai domaine
- Assurez-vous d'avoir un certificat SSL

### 3. Tester en production
- Faites un petit test avec un vrai paiement
- Vérifiez que les webhooks fonctionnent
- Surveillez les logs pour détecter les erreurs

---

## 🔒 Sécurité

### Bonnes pratiques
1. **Ne jamais** exposer les clés secrètes côté client
2. Utilisez HTTPS en production
3. Validez tous les paiements côté serveur
4. Implémentez une protection contre les attaques CSRF
5. Surveillez les tentatives de fraude

### Variables sensibles
```bash
# ❌ Ne jamais exposer côté client
VITE_PAYPAL_CLIENT_SECRET=xxx
VITE_STRIPE_SECRET_KEY=xxx

# ✅ OK côté client
VITE_PAYPAL_CLIENT_ID=xxx
VITE_STRIPE_PUBLISHABLE_KEY=xxx
```

---

## 🐛 Dépannage

### Erreurs courantes

#### PayPal
- **"Invalid Client ID"** : Vérifiez votre Client ID
- **"Currency not supported"** : Assurez-vous que MAD est supporté
- **"Sandbox mode"** : Vérifiez le mode dans vos variables

#### Stripe
- **"Invalid API key"** : Vérifiez votre clé publique
- **"Card declined"** : Utilisez les cartes de test appropriées
- **"Currency not supported"** : Vérifiez que MAD est activé

### Logs utiles
```bash
# Vérifier les variables d'environnement
console.log('PayPal Client ID:', process.env.VITE_PAYPAL_CLIENT_ID);
console.log('Stripe Key:', process.env.VITE_STRIPE_PUBLISHABLE_KEY);

# Vérifier les paiements
console.log('Payment Status:', paymentStatus);
console.log('Payment ID:', paymentId);
```

---

## 📞 Support

- **PayPal Developer Support** : [developer.paypal.com/support](https://developer.paypal.com/support)
- **Stripe Support** : [support.stripe.com](https://support.stripe.com)
- **Documentation PayPal** : [developer.paypal.com/docs](https://developer.paypal.com/docs)
- **Documentation Stripe** : [stripe.com/docs](https://stripe.com/docs)

---

## ✅ Checklist de Configuration

- [ ] Compte PayPal Business créé
- [ ] Compte Stripe créé
- [ ] Clés API obtenues (test et production)
- [ ] Variables d'environnement configurées
- [ ] Webhooks configurés (production)
- [ ] Tests effectués en mode sandbox
- [ ] Certificat SSL installé (production)
- [ ] Domaines configurés
- [ ] Monitoring mis en place

Une fois cette configuration terminée, vos utilisateurs pourront effectuer de vrais paiements via PayPal et Stripe ! 🎉 