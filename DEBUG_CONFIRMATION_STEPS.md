# 🔍 Guide de Débogage - Problème de Confirmation de Liens

## 🎯 Problème Identifié
L'annonceur ne voit rien dans "Confirmation Liens" après que l'éditeur ait accepté la demande.

## 📋 Étapes de Débogage

### 1. **Vérification de la Base de Données (Supabase Cloud)**

Exécutez ces requêtes SQL dans l'éditeur SQL de Supabase Cloud :

```sql
-- Vérifier les statuts disponibles
SELECT unnest(enum_range(NULL::link_purchase_status)) as status;

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'link_purchase_requests' 
ORDER BY ordinal_position;

-- Vérifier les demandes avec status pending_confirmation
SELECT 
  id, 
  user_id, 
  publisher_id, 
  status, 
  accepted_at, 
  confirmation_deadline,
  created_at
FROM link_purchase_requests 
WHERE status = 'pending_confirmation'
ORDER BY created_at DESC;

-- Vérifier toutes les demandes récentes
SELECT 
  id, 
  user_id, 
  publisher_id, 
  status, 
  accepted_at, 
  confirmation_deadline,
  created_at
FROM link_purchase_requests 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. **Vérification de la Migration**

Assurez-vous que la migration `20250121000044_workflow_confirmation_system.sql` a été appliquée :

```sql
-- Vérifier si la fonction accept_purchase_request existe
SELECT 
  routine_name, 
  routine_type, 
  data_type
FROM information_schema.routines 
WHERE routine_name = 'accept_purchase_request';
```

### 3. **Test dans le Navigateur**

1. **Ouvrez la console du navigateur** (F12)
2. **Allez sur** `/dashboard/link-confirmation`
3. **Copiez et collez** le contenu de `test-browser-debug.js`
4. **Exécutez** `runAllTests()`

### 4. **Vérification du Workflow**

#### Étape 1: Annonceur passe commande
- ✅ Demande créée avec status `pending`
- ✅ Compte annonceur débité

#### Étape 2: Éditeur accepte la demande
- ✅ Status changé à `pending_confirmation`
- ✅ `accepted_at` défini
- ✅ `confirmation_deadline` défini (48h)
- ✅ Notification envoyée à l'annonceur

#### Étape 3: Annonceur voit la demande
- ❌ **PROBLÈME ICI** - L'annonceur ne voit pas la demande

### 5. **Points de Vérification**

#### A. Vérifier que l'éditeur a bien accepté
```sql
SELECT 
  id, 
  status, 
  accepted_at, 
  confirmation_deadline
FROM link_purchase_requests 
WHERE id = 'ID_DE_LA_DEMANDE';
```

#### B. Vérifier que le status est correct
Le status doit être `pending_confirmation`, pas `accepted`.

#### C. Vérifier la fonction getPendingConfirmationRequests
Dans la console du navigateur :
```javascript
const { getPendingConfirmationRequests, getCurrentUser } = await import('./src/lib/supabase.ts');
const user = await getCurrentUser();
const requests = await getPendingConfirmationRequests(user.id);
console.log('Demandes en attente:', requests);
```

### 6. **Causes Possibles**

1. **Migration non appliquée** - Les nouveaux statuts n'existent pas
2. **Fonction accept_purchase_request défaillante** - Le status ne change pas
3. **Problème de permissions RLS** - L'annonceur ne peut pas voir ses demandes
4. **Erreur dans getPendingConfirmationRequests** - La requête échoue
5. **Problème de cache** - Les données ne sont pas rafraîchies

### 7. **Solutions**

#### Solution 1: Vérifier la migration
```sql
-- Appliquer la migration si nécessaire
-- Voir le fichier: supabase/migrations/20250121000044_workflow_confirmation_system.sql
```

#### Solution 2: Vérifier les permissions RLS
```sql
-- Vérifier les politiques RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'link_purchase_requests';
```

#### Solution 3: Tester manuellement
```sql
-- Créer une demande de test
INSERT INTO link_purchase_requests (
  user_id, 
  publisher_id, 
  link_listing_id, 
  target_url, 
  anchor_text, 
  proposed_price, 
  status
) VALUES (
  'USER_ID_ANNOUNCEUR',
  'USER_ID_EDITEUR', 
  'LINK_LISTING_ID',
  'https://example.com',
  'Test Link',
  100,
  'pending_confirmation'
);
```

### 8. **Logs à Vérifier**

1. **Console du navigateur** - Erreurs JavaScript
2. **Network tab** - Requêtes API qui échouent
3. **Supabase logs** - Erreurs de base de données
4. **Application logs** - Erreurs dans les fonctions

### 9. **Test Complet**

1. **Créer une nouvelle commande** en tant qu'annonceur
2. **Accepter la demande** en tant qu'éditeur
3. **Vérifier dans la base de données** que le status est `pending_confirmation`
4. **Se reconnecter en tant qu'annonceur**
5. **Aller sur** `/dashboard/link-confirmation`
6. **Vérifier que la demande s'affiche**

### 10. **Fichiers de Test Créés**

- `debug-confirmation-issue.js` - Script de débogage général
- `test-supabase-queries.sql` - Requêtes SQL de test
- `test-browser-debug.js` - Tests dans le navigateur

---

## 🎯 Résultat Attendu

Après le débogage, l'annonceur devrait voir :
- ✅ La demande dans "Confirmation Liens"
- ✅ Le titre du lien
- ✅ L'URL cible
- ✅ Le délai de confirmation (48h)
- ✅ Le bouton "Confirmer le Lien"

---

*Guide créé le 21 janvier 2025*
