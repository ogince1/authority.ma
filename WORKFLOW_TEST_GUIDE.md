# Guide de Test du Workflow de Confirmation des Liens

## 🎯 Objectif
Tester le nouveau système de workflow où :
1. L'annonceur passe une commande (compte non débité immédiatement)
2. L'éditeur reçoit la demande
3. Si l'éditeur accepte, l'annonceur doit confirmer le placement
4. Une fois confirmé, le crédit est transféré à l'éditeur
5. Si pas de confirmation dans les 48h, confirmation automatique

## 🧪 Scripts de Test Disponibles

### 1. Test Complet du Workflow
```bash
node test-complete-workflow.js
```
**Ce que fait ce script :**
- Crée des utilisateurs de test (annonceur + éditeur)
- Crée un site web et un lien
- Simule une demande d'achat
- Teste l'acceptation par l'éditeur
- Teste la confirmation par l'annonceur
- Vérifie la création de la transaction
- Teste la confirmation automatique

### 2. Test de la Confirmation Automatique
```bash
node test-auto-confirmation.js
```
**Ce que fait ce script :**
- Crée des demandes avec délais expirés et valides
- Exécute la confirmation automatique
- Vérifie que seules les demandes expirées sont traitées

### 3. Test Interface Utilisateur
Ouvrir `test-ui-workflow.html` dans un navigateur pour tester manuellement :
- Accepter une demande (éditeur)
- Confirmer un lien (annonceur)
- Exécuter la confirmation automatique (admin)
- Vérifier le statut d'une demande

## 🔧 Configuration Requise

### Variables d'Environnement
Assurez-vous que ces variables sont définies :
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Migration de Base de Données
La migration `20250121000044_workflow_confirmation_system.sql` doit être appliquée :
```sql
-- Nouveaux statuts
'pending_confirmation', 'confirmed', 'auto_confirmed'

-- Nouveaux champs
accepted_at, confirmation_deadline, confirmed_at, auto_confirmed_at, payment_transaction_id

-- Nouvelles fonctions
accept_purchase_request(), confirm_link_placement(), auto_confirm_expired_requests()
```

## 📋 Étapes de Test Manuel

### Test 1: Workflow Normal
1. **Créer une commande** via l'interface "Achat Rapide"
2. **Vérifier** que le compte annonceur n'est pas débité
3. **Se connecter en tant qu'éditeur** et aller dans "Demandes Reçues"
4. **Accepter la demande** en fournissant l'URL du lien placé
5. **Vérifier** que le statut passe à "pending_confirmation"
6. **Se connecter en tant qu'annonceur** et aller dans "Confirmation Liens"
7. **Confirmer le placement** du lien
8. **Vérifier** que le paiement est effectué et le statut passe à "confirmed"

### Test 2: Confirmation Automatique
1. **Créer une demande** et la faire accepter par l'éditeur
2. **Modifier manuellement** le `confirmation_deadline` dans la base de données pour qu'il soit dans le passé
3. **Exécuter** la confirmation automatique via l'interface admin
4. **Vérifier** que le statut passe à "auto_confirmed" et que le paiement est effectué

### Test 3: Interface Admin
1. **Se connecter en tant qu'admin**
2. **Aller dans "Confirmation Auto"**
3. **Vérifier** les statistiques des demandes en attente
4. **Exécuter manuellement** la confirmation automatique
5. **Vérifier** que les demandes expirées sont traitées

## 🐛 Points de Vérification

### Base de Données
- [ ] Table `link_purchase_requests` a les nouveaux champs
- [ ] Contraintes CHECK pour les nouveaux statuts
- [ ] Fonctions SQL créées et fonctionnelles
- [ ] Index sur `confirmation_deadline` créé

### Interface Utilisateur
- [ ] Menu "Confirmation Liens" visible pour les annonceurs
- [ ] Page de confirmation des liens fonctionnelle
- [ ] Affichage du temps restant avant expiration
- [ ] Boutons de confirmation et vérification

### Interface Admin
- [ ] Menu "Confirmation Auto" visible pour les admins
- [ ] Statistiques des demandes en attente
- [ ] Bouton d'exécution manuelle de la confirmation automatique
- [ ] Affichage des demandes expirées

### Notifications
- [ ] Notification envoyée à l'annonceur quand l'éditeur accepte
- [ ] Notification envoyée à l'éditeur quand l'annonceur confirme
- [ ] Notifications pour les confirmations automatiques

## 🚨 Gestion d'Erreurs

### Erreurs Communes
1. **"Fonction n'existe pas"** → Migration non appliquée
2. **"Solde insuffisant"** → Vérifier le solde de l'annonceur
3. **"Demande non trouvée"** → Vérifier l'ID de la demande
4. **"Délai dépassé"** → Vérifier la date de confirmation

### Solutions
- Appliquer la migration manquante
- Recharger le compte de l'annonceur
- Vérifier les IDs dans la base de données
- Ajuster les dates de test

## 📊 Métriques de Succès

### Tests Automatisés
- [ ] 100% des étapes du workflow passent
- [ ] Aucune erreur dans les logs
- [ ] Transactions créées correctement
- [ ] Statuts mis à jour correctement

### Tests Manuels
- [ ] Interface intuitive et responsive
- [ ] Notifications reçues
- [ ] Temps de réponse acceptable
- [ ] Gestion d'erreurs claire

## 🔄 Maintenance

### Tâches Cron
- Vérifier que les tâches cron s'exécutent toutes les heures
- Monitorer les logs d'exécution
- Vérifier que les confirmations automatiques fonctionnent

### Base de Données
- Nettoyer les données de test périodiquement
- Monitorer les performances des requêtes
- Vérifier l'intégrité des données

## 📝 Notes de Développement

### Améliorations Futures
- Interface de monitoring des tâches cron
- Alertes pour les demandes qui approchent de l'expiration
- Rapports de performance du workflow
- Intégration avec des systèmes de notification externes

### Sécurité
- Vérifier les permissions RLS
- Valider les entrées utilisateur
- Protéger les fonctions SQL sensibles
- Logs d'audit pour les transactions
