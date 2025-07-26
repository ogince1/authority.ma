# Environment Setup Guide

## 🔧 Configuration des Variables d'Environnement

Ce guide vous explique comment configurer les variables d'environnement nécessaires pour faire fonctionner l'application.

## 📋 Variables Requises

### 1. **Supabase Configuration**

Vous devez créer un fichier `.env` à la racine du projet avec les variables suivantes :

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🚀 Comment Obtenir Vos Credentials Supabase

### Étape 1: Accéder à votre Dashboard Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet

### Étape 2: Trouver vos Credentials
1. Dans le menu de gauche, cliquez sur **Settings**
2. Cliquez sur **API**
3. Vous verrez deux sections importantes :
   - **Project URL** → C'est votre `VITE_SUPABASE_URL`
   - **anon public** → C'est votre `VITE_SUPABASE_ANON_KEY`

### Étape 3: Créer le fichier .env
1. Copiez le fichier `.env.example` vers `.env`
2. Remplacez les valeurs par vos vraies credentials

```bash
cp .env.example .env
```

3. Éditez le fichier `.env` avec vos vraies valeurs

## 📁 Structure du Fichier .env

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Additional environment variables
# VITE_APP_NAME=GoHaya
# VITE_APP_URL=https://gohaya.com
# VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

## ⚠️ Important

- **Ne jamais commiter** le fichier `.env` dans Git
- Le fichier `.env` est déjà dans `.gitignore`
- Utilisez toujours `.env.example` comme modèle
- Gardez vos credentials secrets et sécurisés

## 🔍 Vérification

Après avoir configuré vos variables d'environnement :

1. Redémarrez votre serveur de développement
2. Vérifiez que l'application se connecte à Supabase
3. Testez l'authentification et les fonctionnalités

## 🆘 Dépannage

Si vous rencontrez des erreurs :

1. **Vérifiez que le fichier `.env` existe** à la racine du projet
2. **Vérifiez que les variables sont correctement nommées** (avec le préfixe `VITE_`)
3. **Redémarrez le serveur de développement** après avoir modifié `.env`
4. **Vérifiez vos credentials Supabase** dans le dashboard

## 📞 Support

En cas de problème, vérifiez :
- Les logs de la console du navigateur
- Les logs du serveur de développement
- La configuration de votre projet Supabase 