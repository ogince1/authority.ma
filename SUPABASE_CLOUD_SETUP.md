# Guide de Configuration Supabase Cloud

## 🎯 Objectif
Configurer votre application pour se connecter à votre projet Supabase sur le cloud au lieu de l'instance locale.

## 📋 Étapes de Configuration

### 1. Récupérer les Informations de votre Projet Supabase

1. **Connectez-vous à Supabase Dashboard**
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Connectez-vous avec votre compte

2. **Sélectionnez votre Projet**
   - Choisissez le projet que vous voulez utiliser

3. **Récupérez les Clés API**
   - Allez dans **Settings** > **API**
   - Copiez les informations suivantes :
     - **Project URL** (ex: `https://abcdefghijklmnop.supabase.co`)
     - **anon public** key (clé publique anonyme)
     - **service_role** key (clé de service, optionnelle)

### 2. Configurer les Variables d'Environnement

#### Option A: Utiliser le Script Automatique
```bash
./setup-supabase-cloud.sh
```

#### Option B: Configuration Manuelle

1. **Créer le fichier .env**
```bash
touch .env
```

2. **Ajouter les variables d'environnement**
```env
# Configuration Supabase Cloud
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-ici
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-ici
```

### 3. Synchroniser la Base de Données

#### Option A: Synchroniser le Cloud vers Local
```bash
# Récupérer le schéma depuis le cloud
supabase db pull

# Appliquer les migrations locales
supabase db push
```

#### Option B: Synchroniser le Local vers Cloud
```bash
# Pousser les migrations locales vers le cloud
supabase db push
```

### 4. Tester la Connexion

1. **Démarrer l'application**
```bash
npm run dev
```

2. **Vérifier la connexion**
   - Ouvrez les outils de développement du navigateur
   - Allez dans l'onglet Network
   - Vérifiez que les requêtes vont vers votre URL Supabase cloud

## 🔄 Basculer entre Local et Cloud

### Pour utiliser le Cloud
```env
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-ici
```

### Pour utiliser le Local
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## 🛠️ Commandes Utiles

### Gestion des Migrations
```bash
# Voir le statut des migrations
supabase migration list

# Créer une nouvelle migration
supabase migration new nom_de_la_migration

# Appliquer les migrations
supabase db push

# Réinitialiser la base de données
supabase db reset
```

### Gestion des Données
```bash
# Sauvegarder les données
supabase db dump > backup.sql

# Restaurer les données
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

### Gestion du Projet
```bash
# Lier le projet local au cloud
supabase link --project-ref votre-projet-id

# Voir les informations du projet
supabase status

# Démarrer l'environnement local
supabase start

# Arrêter l'environnement local
supabase stop
```

## 🚨 Dépannage

### Problème: "Missing Supabase environment variables"
- Vérifiez que le fichier `.env` existe
- Vérifiez que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies
- Redémarrez le serveur de développement

### Problème: "Invalid API key"
- Vérifiez que vous avez copié la bonne clé depuis le dashboard Supabase
- Assurez-vous qu'il n'y a pas d'espaces supplémentaires

### Problème: "Connection refused"
- Vérifiez que votre URL Supabase est correcte
- Vérifiez votre connexion internet
- Vérifiez que votre projet Supabase est actif

### Problème: "Database schema mismatch"
- Synchronisez votre schéma local avec le cloud : `supabase db pull`
- Ou poussez vos migrations vers le cloud : `supabase db push`

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide de Migration](https://supabase.com/docs/guides/cli/local-development)
- [Configuration des Variables d'Environnement](https://supabase.com/docs/guides/getting-started/local-development#env-file)

## 🔐 Sécurité

⚠️ **Important**: Ne commitez jamais vos clés API dans le repository Git !

- Ajoutez `.env` à votre `.gitignore`
- Utilisez des variables d'environnement pour la production
- Régénérez vos clés si elles sont compromises
