# Guide de Suppression du Système de Chat - Base de Données

## 🗑️ Suppression Complète du Système de Chat

Ce guide vous explique comment supprimer complètement le système de chat de votre base de données Supabase.

## 📋 Éléments à Supprimer

### 1. **Tables**
- `chat_messages` - Table principale des messages de chat

### 2. **Types**
- `chat_sender` - Enum pour définir le type d'expéditeur (user/admin)

### 3. **Index**
- `idx_chat_messages_user_id` - Index sur l'ID utilisateur
- `idx_chat_messages_created_at` - Index sur la date de création
- `idx_chat_messages_read` - Index sur le statut de lecture

### 4. **Policies RLS (Row Level Security)**
- Policies pour les utilisateurs (lecture/écriture de leurs messages)
- Policies pour les administrateurs (accès complet)

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
3. Copiez et exécutez le contenu de `remove_chat_database.sql`

### Option 3: Via psql (si vous avez accès direct)

```bash
psql -h your-project-ref.supabase.co -U postgres -d postgres -f remove_chat_database.sql
```

## 📁 Fichiers Fournis

1. **`remove_chat_database.sql`** - Script SQL complet pour suppression manuelle
2. **`supabase/migrations/20250121000000_remove_chat_system.sql`** - Migration Supabase versionnée

## ✅ Vérification

Après l'exécution, vous pouvez vérifier que tout a été supprimé en exécutant :

```sql
-- Vérifier qu'il ne reste plus de tables chat
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%chat%' AND table_schema = 'public';

-- Vérifier qu'il ne reste plus de types chat
SELECT typname FROM pg_type WHERE typname LIKE '%chat%';

-- Vérifier qu'il ne reste plus d'index chat
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE '%chat%' AND schemaname = 'public';
```

## ⚠️ Important

- **Sauvegarde** : Faites une sauvegarde de votre base de données avant d'exécuter ces scripts
- **Données** : Toutes les données de chat existantes seront **définitivement supprimées**
- **Test** : Testez d'abord sur un environnement de développement

## 🔄 Rollback

Si vous devez annuler ces changements, vous devrez :
1. Restaurer la sauvegarde de la base de données
2. Ou recréer manuellement les tables, types et policies

## 📞 Support

En cas de problème, vérifiez les logs Supabase ou contactez le support. 