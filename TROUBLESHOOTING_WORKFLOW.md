# Guide de Dépannage - Workflow de Confirmation

## 🚨 Problèmes Courants et Solutions

### 1. Erreur 404 lors de la création de notification

**Symptôme :**
```
Failed to load resource: the server responded with a status of 404 ()
Error creating notification: Object
```

**Cause :** La fonction RPC `create_notification` n'existe pas dans la base de données.

**Solution :**
1. Appliquer la migration `20250121000045_fix_notifications_table.sql`
2. Vérifier que la table `notifications` existe et a la bonne structure
3. La fonction `createNotification` a été corrigée pour utiliser directement l'insertion

### 2. Fonction SQL non trouvée

**Symptôme :**
```
Error accepting purchase request: function does not exist
```

**Cause :** Les fonctions SQL du workflow ne sont pas déployées.

**Solution :**
1. Appliquer la migration `20250121000044_workflow_confirmation_system.sql`
2. Vérifier que les fonctions suivantes existent :
   - `accept_purchase_request(UUID, TEXT)`
   - `confirm_link_placement(UUID)`
   - `auto_confirm_expired_requests()`

### 3. Erreur de permissions RLS

**Symptôme :**
```
Error: new row violates row-level security policy
```

**Cause :** Les politiques RLS bloquent l'insertion.

**Solution :**
1. Vérifier que l'utilisateur est authentifié
2. S'assurer que les politiques RLS sont correctement configurées
3. Pour les notifications, utiliser un utilisateur avec les bonnes permissions

### 4. Tâches cron qui ne s'exécutent pas

**Symptôme :**
```
Tâches cron programmées mais pas d'exécution
```

**Cause :** Les tâches cron ne sont pas démarrées ou il y a une erreur.

**Solution :**
1. Vérifier que `startCronJobs()` est appelé dans `App.tsx`
2. Vérifier les logs de la console pour les erreurs
3. Tester manuellement l'exécution des tâches cron

## 🔧 Scripts de Diagnostic

### Test des Notifications
```bash
node test-notifications.js
```

### Test du Workflow Corrigé
```bash
node test-workflow-fixed.js
```

### Vérification de la Base de Données
```sql
-- Vérifier que la table notifications existe
SELECT * FROM information_schema.tables WHERE table_name = 'notifications';

-- Vérifier que les fonctions existent
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('accept_purchase_request', 'confirm_link_placement', 'auto_confirm_expired_requests');

-- Vérifier la structure de la table notifications
\d notifications;
```

## 📋 Checklist de Vérification

### Base de Données
- [ ] Migration `20250121000044_workflow_confirmation_system.sql` appliquée
- [ ] Migration `20250121000045_fix_notifications_table.sql` appliquée
- [ ] Table `notifications` existe et a la bonne structure
- [ ] Fonctions SQL créées et fonctionnelles
- [ ] Politiques RLS configurées correctement

### Application
- [ ] Fonction `createNotification` corrigée
- [ ] Imports corrects dans tous les fichiers
- [ ] Types TypeScript mis à jour
- [ ] Routes ajoutées pour les nouvelles pages
- [ ] Navigation mise à jour

### Tests
- [ ] Application se compile sans erreurs
- [ ] Notifications se créent correctement
- [ ] Workflow fonctionne end-to-end
- [ ] Tâches cron s'exécutent périodiquement

## 🚀 Déploiement

### Étapes de Déploiement
1. **Appliquer les migrations SQL**
   ```bash
   # Si vous utilisez Supabase CLI
   npx supabase db push
   
   # Ou appliquer manuellement dans le dashboard Supabase
   ```

2. **Vérifier la compilation**
   ```bash
   npm run build
   ```

3. **Tester les fonctionnalités**
   - Créer une demande d'achat
   - Accepter la demande en tant qu'éditeur
   - Confirmer le lien en tant qu'annonceur
   - Vérifier les notifications

4. **Monitorer les logs**
   - Vérifier que les tâches cron s'exécutent
   - Surveiller les erreurs dans la console
   - Tester la confirmation automatique

## 🐛 Debugging

### Logs Utiles
```javascript
// Activer les logs détaillés
console.log('Debug - Request data:', requestData);
console.log('Debug - Response:', response);
console.log('Debug - Error:', error);
```

### Vérifications en Base
```sql
-- Vérifier les demandes en attente
SELECT * FROM link_purchase_requests WHERE status = 'pending_confirmation';

-- Vérifier les notifications récentes
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Vérifier les transactions récentes
SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 10;
```

## 📞 Support

### En cas de problème persistant
1. Vérifier les logs de la console
2. Tester avec les scripts de diagnostic
3. Vérifier la configuration de la base de données
4. S'assurer que toutes les migrations sont appliquées

### Informations à fournir
- Messages d'erreur complets
- Logs de la console
- Version de l'application
- Configuration de la base de données
- Étapes pour reproduire le problème
