# 🚀 Guide de Démarrage Rapide - Back.ma

## 📋 **Prérequis**

- Node.js 18+ installé
- Compte Supabase créé
- Git installé

## ⚡ **Installation Express (5 minutes)**

### 1. **Cloner le projet**
```bash
git clone https://github.com/ogince1/back.ma.git
cd back.ma
```

### 2. **Installer les dépendances**
```bash
npm install
```

### 3. **Configurer l'environnement**
```bash
# Créer le fichier .env.local
cp .env.example .env.local

# Éditer le fichier avec vos clés Supabase
nano .env.local
```

### 4. **Configurer Supabase**

#### A. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et clé anon

#### B. Configurer la base de données
```bash
# Option 1: Via l'interface Supabase
# Allez dans SQL Editor et exécutez le contenu de :
# supabase/migrations/20250121000002_create_link_platform_tables.sql

# Option 2: Via CLI Supabase
supabase init
supabase db push
```

### 5. **Démarrer le projet**
```bash
npm run dev
```

Votre site sera accessible sur : http://localhost:5173

## 🎯 **Fonctionnalités Testées**

### ✅ **Pages Principales**
- [x] Page d'accueil avec présentation de la plateforme
- [x] Catalogue de liens avec filtres avancés
- [x] Page de vente de liens pour les éditeurs
- [x] Navigation responsive

### ✅ **Base de Données**
- [x] Tables créées et configurées
- [x] Relations entre les entités
- [x] Sécurité RLS activée
- [x] Index pour les performances

### ✅ **Types TypeScript**
- [x] Interfaces pour tous les modèles
- [x] Types pour les enums
- [x] Validation des données

## 🔧 **Configuration Avancée**

### **Variables d'Environnement Requises**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### **Structure de la Base de Données**
- **users** - Utilisateurs (annonceurs, éditeurs, admins)
- **websites** - Sites web des éditeurs
- **link_listings** - Annonces de liens
- **link_purchase_requests** - Demandes d'achat
- **transactions** - Transactions financières
- **reviews** - Avis et évaluations

## 🚀 **Prochaines Étapes**

### **Phase 1 - MVP (Actuelle)**
- [x] Interface utilisateur de base
- [x] Structure de base de données
- [x] Navigation et routing

### **Phase 2 - Fonctionnalités Core**
- [ ] Authentification complète
- [ ] CRUD pour les sites web
- [ ] CRUD pour les annonces de liens
- [ ] Système de demandes d'achat

### **Phase 3 - Monétisation**
- [ ] Intégration paiements (Stripe)
- [ ] Système de commission
- [ ] Facturation automatique

### **Phase 4 - Optimisation**
- [ ] Analytics avancés
- [ ] SEO optimisé
- [ ] Performance monitoring

## 🐛 **Dépannage**

### **Erreurs Courantes**

#### **"Cannot find module"**
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

#### **Erreurs Supabase**
```bash
# Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### **Erreurs TypeScript**
```bash
# Vérifier la configuration
npx tsc --noEmit
```

## 📞 **Support**

- **Documentation complète :** [README.md](./README.md)
- **Issues GitHub :** [GitHub Issues](https://github.com/ogince1/back.ma/issues)
- **Email :** contact@back.ma

## 🎉 **Félicitations !**

Votre plateforme Back.ma est maintenant opérationnelle ! 

**Prochaines actions recommandées :**
1. Tester toutes les pages
2. Configurer votre domaine
3. Ajouter du contenu de test
4. Configurer les analytics

---

**Développé avec ❤️ au Maroc 🇲🇦** 