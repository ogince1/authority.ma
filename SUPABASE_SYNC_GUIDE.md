# 🚀 Guide de Nettoyage et Synchronisation Supabase

## 📋 **Scripts Disponibles**

J'ai créé deux scripts pour automatiser le processus :

### **1. 🧹 `clean-only.sh` - Nettoyage Simple**
Nettoie seulement Supabase local sans synchronisation.

### **2. 🔄 `clean-and-sync.sh` - Nettoyage + Synchronisation**
Nettoie Supabase local ET récupère les données du cloud.

## 🎯 **Comment Utiliser les Scripts**

### **Option 1 : Nettoyage Simple**

```bash
# Rendre le script exécutable
chmod +x clean-only.sh

# Exécuter le nettoyage
./clean-only.sh
```

**Ce script va :**
- ✅ Arrêter Supabase local
- ✅ Supprimer tous les conteneurs Docker
- ✅ Supprimer tous les volumes
- ✅ Nettoyer Docker
- ✅ Supprimer les migrations problématiques

### **Option 2 : Nettoyage + Synchronisation Cloud**

```bash
# Rendre le script exécutable
chmod +x clean-and-sync.sh

# Exécuter le nettoyage + synchronisation
./clean-and-sync.sh
```

**Ce script va :**
- ✅ Faire tout le nettoyage de l'option 1
- ✅ Vous demander votre Project ID Supabase cloud
- ✅ Lier votre projet local au cloud
- ✅ Récupérer le schéma du cloud
- ✅ Démarrer Supabase avec le nouveau schéma

## 🔧 **Étapes Manuelles (si vous préférez)**

### **Étape 1 : Nettoyage**
```bash
# Arrêter Supabase
supabase stop

# Supprimer conteneurs
docker rm -f supabase_db_platformelink
docker rm -f supabase_api_platformelink
docker rm -f supabase_studio_platformelink
docker rm -f supabase_realtime_platformelink
docker rm -f supabase_storage_platformelink
docker rm -f supabase_inbucket_platformelink

# Supprimer volumes
docker volume rm supabase_db_platformelink
docker volume rm supabase_storage_platformelink

# Nettoyer Docker
docker system prune -f

# Supprimer migrations problématiques
rm supabase/migrations/20250121000006_fix_payment_system.sql
rm supabase/migrations/20250121000007_fix_purchase_requests.sql
rm supabase/migrations/20250121000016_fix_rls_duplicates.sql
```

### **Étape 2 : Synchronisation Cloud**
```bash
# Lier le projet cloud
supabase link --project-ref your-project-id

# Récupérer le schéma
supabase db pull

# Démarrer
supabase start
```

## 🎯 **Recommandation**

**Utilisez `clean-and-sync.sh`** si vous avez un projet Supabase cloud.
**Utilisez `clean-only.sh`** si vous voulez juste nettoyer et repartir de zéro localement.

## 🚨 **En Cas de Problème**

### **Problème : Script non exécutable**
```bash
chmod +x clean-only.sh
chmod +x clean-and-sync.sh
```

### **Problème : Docker pas démarré**
```bash
open -a Docker
```

### **Problème : Project ID incorrect**
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Settings → General → Project ID

### **Problème : Erreur de liaison**
```bash
# Dé-lier et re-lier
supabase unlink
supabase link --project-ref your-project-id
```

## ✅ **Vérification**

Après exécution des scripts, vérifiez que :

1. **Supabase Studio** : http://127.0.0.1:54323
2. **API** : http://127.0.0.1:54321
3. **Base de données** : postgresql://postgres:postgres@127.0.0.1:54322/postgres

## 🎉 **Résultat Attendu**

- ✅ Environnement local complètement propre
- ✅ Schéma synchronisé avec le cloud (si option 2)
- ✅ Aucun conflit de migration
- ✅ Supabase prêt à utiliser

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez que Docker est démarré
2. Vérifiez votre Project ID
3. Consultez les logs d'erreur
4. Contactez l'équipe de développement 