# Authority.ma - Plateforme de Vente de Liens au Maroc

## 🎯 **Vue d'ensemble**

**Authority.ma** est la première plateforme marocaine dédiée à la vente et à l'achat de liens de qualité pour améliorer le SEO. Notre mission est de connecter les **annonceurs** (ceux qui veulent acheter des liens) avec les **éditeurs** (propriétaires de sites web qui vendent des emplacements de liens).

## 🔄 **Transformation du Projet**

Ce projet a été transformé d'une plateforme d'investissement en projets digitaux/réels vers une plateforme de vente de liens :

### **Ancien Modèle :**
- **Investisseurs** → Achetaient des projets/startups
- **Entrepreneurs** → Vendaient leurs projets/startups

### **Nouveau Modèle :**
- **Annonceurs** → Acheteurs de liens (pour améliorer leur SEO)
- **Éditeurs** → Vendeurs de liens (propriétaires de sites web)

## 🏗️ **Architecture Technique**

### **Stack Technologique**
- **Frontend :** React + TypeScript + Vite
- **Styling :** Tailwind CSS
- **Base de données :** Supabase (PostgreSQL)
- **Authentification :** Supabase Auth
- **Déploiement :** Vercel/Netlify
- **Animations :** Framer Motion
- **Icônes :** Lucide React

### **Structure de la Base de Données**

#### **Tables Principales :**

1. **`users`** - Utilisateurs de la plateforme
   - Rôles : `advertiser`, `publisher`, `admin`
   - Informations personnelles et professionnelles

2. **`websites`** - Sites web des éditeurs
   - Métriques SEO (trafic, autorité, backlinks)
   - Informations de contact
   - Capacité d'accueil de liens

3. **`link_listings`** - Annonces de liens
   - Types : dofollow, nofollow, sponsored, UGC
   - Positions : header, footer, sidebar, content, menu, popup
   - Prix et conditions

4. **`link_purchase_requests`** - Demandes d'achat
   - Statuts : pending, accepted, rejected, negotiating
   - Négociations entre annonceurs et éditeurs

5. **`transactions`** - Transactions financières
   - Commission de la plateforme
   - Paiements sécurisés

6. **`reviews`** - Avis et évaluations
   - Système de notation 1-5 étoiles
   - Feedback entre utilisateurs

## 🚀 **Fonctionnalités Principales**

### **Pour les Annonceurs :**
- ✅ Recherche avancée de liens par type, position, niche
- ✅ Filtrage par métriques SEO (autorité, trafic)
- ✅ Système de négociation avec les éditeurs
- ✅ Suivi des performances des liens
- ✅ Paiements sécurisés

### **Pour les Éditeurs :**
- ✅ Création de profils de sites web détaillés
- ✅ Publication d'annonces de liens
- ✅ Gestion des demandes d'achat
- ✅ Système de paiement automatisé
- ✅ Tableau de bord analytique

### **Pour l'Administration :**
- ✅ Modération des sites web et annonces
- ✅ Gestion des utilisateurs
- ✅ Statistiques de la plateforme
- ✅ Support client

## 📊 **Types de Liens Supportés**

### **1. Liens Dofollow**
- Transmettent l'autorité SEO
- Idéaux pour améliorer le ranking
- Prix plus élevés

### **2. Liens Nofollow**
- Pour la visibilité et le trafic
- Pas d'impact SEO direct
- Prix plus abordables

### **3. Liens Sponsored**
- Liens publicitaires
- Conformes aux directives Google
- Tarification variable

### **4. Liens UGC (User Generated Content)**
- Contenu généré par les utilisateurs
- Commentaires, forums, etc.
- Prix compétitifs

## 🎨 **Interface Utilisateur**

### **Design System**
- **Couleurs principales :** Bleu (#2563eb) et dégradés
- **Typographie :** Inter (moderne et lisible)
- **Composants :** Tailwind CSS + composants personnalisés
- **Responsive :** Mobile-first design

### **Pages Principales**
1. **Page d'accueil** - Présentation de la plateforme
2. **Catalogue de liens** - Recherche et filtrage
3. **Détail d'un lien** - Informations complètes
4. **Dashboard utilisateur** - Gestion des comptes
5. **Blog** - Contenu SEO et actualités

## 🔧 **Installation et Configuration**

### **Prérequis**
- Node.js 18+
- npm ou yarn
- Compte Supabase

### **Installation**
```bash
# Cloner le repository
git clone https://github.com/ogince1/authority.ma.git
cd authority.ma

# Installer les dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env.local
```

### **Variables d'Environnement**
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

### **Base de Données**
```bash
# Exécuter les migrations Supabase
supabase db push

# Ou importer le fichier SQL directement
psql -h votre_host -U votre_user -d votre_db -f supabase/migrations/20250121000002_create_link_platform_tables.sql
```

### **Démarrage**
```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Preview de production
npm run preview
```

## 📈 **Métriques et Analytics**

### **KPIs Principaux**
- Nombre de sites web actifs
- Nombre de liens disponibles
- Taux de conversion des demandes
- Revenus de la plateforme
- Satisfaction utilisateur

### **Outils d'Analytics**
- Google Analytics 4
- Supabase Analytics
- Métriques personnalisées

## 🔒 **Sécurité**

### **Mesures Implémentées**
- Authentification Supabase
- Row Level Security (RLS)
- Validation des données
- Protection CSRF
- Chiffrement des données sensibles

### **Conformité**
- RGPD (Europe)
- Loi 09-08 (Maroc)
- Bonnes pratiques SEO

## 🚀 **Déploiement**

### **Environnements**
- **Développement :** Local avec Vite
- **Staging :** Vercel Preview
- **Production :** Vercel/Netlify

### **CI/CD**
- Déploiement automatique sur push
- Tests automatisés
- Build optimisé

## 📝 **Contribution**

### **Guidelines**
1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Créer une Pull Request

### **Standards de Code**
- TypeScript strict
- ESLint + Prettier
- Tests unitaires
- Documentation

## 📞 **Support**

### **Contact**
- **Email :** contact@authority.ma
- **Site web :** https://authority.ma
- **Documentation :** /docs

### **Communauté**
- **Discord :** [Lien Discord]
- **Twitter :** @authority_ma
- **LinkedIn :** Authority.ma

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 **Remerciements**

- **Supabase** pour l'infrastructure backend
- **Tailwind CSS** pour le framework CSS
- **Vite** pour l'outil de build
- **React** pour le framework frontend
- **Communauté open source** pour les contributions

---

**Développé avec ❤️ au Maroc 🇲🇦** 