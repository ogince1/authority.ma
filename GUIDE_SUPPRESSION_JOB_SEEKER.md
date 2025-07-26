# Guide de Suppression du Rôle "Job Seeker" - Base de Données

## 🗑️ Suppression Complète du Rôle "Chercheur d'Opportunités"

Ce guide vous explique comment supprimer complètement le rôle "job_seeker" de votre base de données Supabase.

## 📋 Ce qui va être fait

### 1. **Mise à jour des Utilisateurs Existants**
- Tous les utilisateurs avec le rôle `job_seeker` seront convertis en `entrepreneur`
- Le champ `updated_at` sera mis à jour avec la date actuelle

### 2. **Vérifications**
- Confirmation qu'aucun utilisateur n'a plus le rôle `job_seeker`
- Affichage de la nouvelle distribution des rôles

## 🚀 Méthodes d'Application

### Option 1: Via Supabase CLI (Recommandé)

```bash
# Appliquer la migration
supabase db push

# Ou si vous utilisez les migrations locales
supabase migration up
```

### Option 2: Via l'Interface Supabase

1. Allez dans votre projet Supabase
2. Naviguez vers **SQL Editor**
3. Copiez et exécutez le contenu de `remove_job_seeker_role.sql`

### Option 3: Via psql (si vous avez accès direct)

```bash
psql -h your-project-ref.supabase.co -U postgres -d postgres -f remove_job_seeker_role.sql
```

## 📁 Fichiers Fournis

1. **`remove_job_seeker_role.sql`** - Script SQL complet pour suppression manuelle
2. **`supabase/migrations/20250121000001_remove_job_seeker_role.sql`** - Migration Supabase versionnée

## ⚠️ Important

### **Avant d'exécuter :**
- **Sauvegarde** : Faites une sauvegarde de votre base de données
- **Vérification** : Vérifiez combien d'utilisateurs ont le rôle `job_seeker`
- **Communication** : Informez les utilisateurs concernés du changement

### **Impact :**
- Les utilisateurs `job_seeker` deviendront `entrepreneur`
- Ils auront accès au dashboard entrepreneur
- Leurs données seront préservées

## 🔍 Vérification Préalable

Avant d'exécuter le script, vérifiez combien d'utilisateurs seront affectés :

```sql
-- Vérifier combien d'utilisateurs ont le rôle job_seeker
SELECT 
  'Utilisateurs avec le rôle job_seeker:' as info,
  COUNT(*) as count
FROM users 
WHERE role = 'job_seeker';

-- Voir la liste des utilisateurs concernés
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM users 
WHERE role = 'job_seeker'
ORDER BY created_at DESC;
```

## ✅ Vérification Post-Exécution

Après l'exécution, vérifiez que tout s'est bien passé :

```sql
-- Vérifier qu'il ne reste plus d'utilisateurs job_seeker
SELECT 
  'Utilisateurs restants avec le rôle job_seeker:' as info,
  COUNT(*) as count
FROM users 
WHERE role = 'job_seeker';

-- Vérifier la nouvelle distribution des rôles
SELECT 
  'Distribution des rôles:' as info,
  role,
  COUNT(*) as count
FROM users 
GROUP BY role 
ORDER BY count DESC;
```

## 🔄 Rollback

Si vous devez annuler ces changements :

```sql
-- Remettre les utilisateurs en job_seeker (si vous avez sauvegardé les IDs)
UPDATE users 
SET 
  role = 'job_seeker',
  updated_at = NOW()
WHERE id IN ('user_id_1', 'user_id_2', ...);
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs Supabase
2. Restaurez la sauvegarde si nécessaire
3. Contactez le support si le problème persiste

## 🎯 Résultat Final

Après l'exécution, votre application aura seulement 2 rôles :
- 👨‍💼 **Entrepreneur** - Créer des projets
- 💰 **Investisseur** - Investir dans des projets

Le rôle "Chercheur d'opportunités" sera complètement supprimé de la base de données. 