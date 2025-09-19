# 🔧 Guide de Configuration des Variables d'Environnement

## 📋 **Vue d'ensemble**

Ce guide vous explique comment configurer les variables d'environnement pour votre projet **Back.ma**.

## 🔐 **Types de Fichiers d'Environnement**

### **1. `.env.example`** (Template)
- **Usage** : Template partagé avec l'équipe
- **Git** : ✅ Commité dans le repository
- **Contenu** : Variables sans valeurs sensibles

### **2. `.env.local`** (Configuration Locale)
- **Usage** : Configuration spécifique à votre machine
- **Git** : ❌ **NE JAMAIS** commité (sécurité)
- **Contenu** : Variables avec vos vraies valeurs

### **3. `.env.production`** (Production)
- **Usage** : Configuration pour la production
- **Git** : ❌ **NE JAMAIS** commité
- **Contenu** : Variables de production

## 🚀 **Installation Rapide**

### **Option 1 : Script Automatique**
```bash
# Exécuter le script de configuration
./setup-env.sh
```

### **Option 2 : Configuration Manuelle**
```bash
# Copier le template
cp env.example .env.local

# Éditer le fichier avec vos valeurs
nano .env.local
```

## 🔧 **Configuration pour Développement Local**

### **1. Variables Supabase (Obligatoires)**
```bash
# URL de Supabase local
VITE_SUPABASE_URL=http://127.0.0.1:54321

# Clé anonyme Supabase local
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Clé de service (pour les opérations admin)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### **2. Variables Application**
```bash
# URL de l'application
VITE_APP_URL=http://localhost:3000

# Mode de l'application
NODE_ENV=development
```

## 🌐 **Configuration pour Production**

### **1. Variables Supabase Production**
```bash
# URL de votre projet Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Clé anonyme de production
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Clé de service de production
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### **2. Variables de Paiement**
```bash
# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
```

### **3. Variables Email**
```bash
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔍 **Vérification de la Configuration**

### **1. Tester la Connexion Supabase**
```bash
# Démarrer Supabase local
supabase start

# Vérifier le statut
supabase status
```

### **2. Tester l'Application**
```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm run dev
```

### **3. Vérifier les Variables**
```javascript
// Dans votre code
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('App URL:', import.meta.env.VITE_APP_URL);
```

## 🛡️ **Sécurité**

### **❌ Ne JAMAIS commiter :**
- `.env.local`
- `.env.production`
- Fichiers contenant des clés API
- Mots de passe
- Clés de service

### **✅ Peut être commité :**
- `.env.example`
- `env.example`
- Templates sans valeurs sensibles

## 🔄 **Gestion des Environnements**

### **Développement**
```bash
# Variables de développement
NODE_ENV=development
VITE_APP_URL=http://localhost:3000
```

### **Staging**
```bash
# Variables de staging
NODE_ENV=staging
VITE_APP_URL=https://staging.back.ma
```

### **Production**
```bash
# Variables de production
NODE_ENV=production
VITE_APP_URL=https://back.ma
```

## 🚨 **Dépannage**

### **Problème : Variables non chargées**
```bash
# Vérifier que le fichier existe
ls -la .env.local

# Vérifier le format (pas d'espaces autour du =)
VITE_SUPABASE_URL=http://127.0.0.1:54321
```

### **Problème : Connexion Supabase échoue**
```bash
# Vérifier que Supabase est démarré
supabase status

# Redémarrer si nécessaire
supabase stop
supabase start
```

### **Problème : Variables Vite non reconnues**
```bash
# Redémarrer le serveur de développement
npm run dev

# Vérifier le préfixe VITE_ pour les variables côté client
VITE_SUPABASE_URL=...
```

## 📚 **Ressources Utiles**

- [Documentation Vite - Variables d'Environnement](https://vitejs.dev/guide/env-and-mode.html)
- [Documentation Supabase - Configuration](https://supabase.com/docs/guides/getting-started/environment-variables)
- [Guide de Sécurité des Variables d'Environnement](https://12factor.net/config)

## 🤝 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez ce guide
2. Consultez la documentation officielle
3. Contactez l'équipe de développement 