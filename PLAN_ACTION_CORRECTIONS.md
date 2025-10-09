# 🎯 PLAN D'ACTION - CORRECTIONS ET AMÉLIORATIONS

**Date:** 8 Octobre 2025  
**Plateforme:** Authority.ma  
**Priorité:** Corrections avant mise en production

---

## 📋 RÉSUMÉ EXÉCUTIF

Ce document détaille les actions à entreprendre pour corriger les problèmes détectés lors de l'analyse complète de la plateforme Authority.ma.

**Score actuel:** 79/100  
**Score cible:** 95/100  
**Délai estimé:** 1-2 semaines

---

## 🔴 ACTIONS URGENTES (À faire cette semaine)

### 1. ❌ Corriger le problème `user_profiles`

**Problème:** La table `user_profiles` est référencée dans le code mais n'existe pas dans la base de données.

**Impact:** Moyen - Peut causer des erreurs lors de l'authentification

**Solution recommandée:**

#### Option A: Ne PAS créer la table (RECOMMANDÉ)
La table `users` contient déjà toutes les informations nécessaires (19 colonnes). Créer une table supplémentaire serait redondant.

**Actions:**
```bash
# 1. Rechercher toutes les références à user_profiles dans le code
cd /chemin/vers/projet
grep -r "user_profiles" src/
grep -r "userProfiles" src/
grep -r "user_profile" src/

# 2. Les supprimer ou les remplacer par "users"
```

**Fichiers potentiellement affectés:**
- `src/lib/supabase.ts`
- `src/components/Auth/AuthModal.tsx`
- `src/components/User/UserProfile.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`

#### Option B: Créer la table
Si vous avez vraiment besoin de séparer les données:

```bash
# Exécuter le script SQL fourni
psql -h lqldqgbpaxqaazfjzlsz.supabase.co -U postgres < fix-user-profiles-issue.sql
```

**✅ Critère de succès:**
- Aucune erreur dans la console lors de l'authentification
- Les profils utilisateurs s'affichent correctement
- Aucune référence à une table inexistante

---

### 2. ⚠️ Publier des Success Stories

**Problème:** La table `success_stories` est vide

**Impact:** Faible - Affecte le marketing et la crédibilité

**Actions:**

1. **Créer 5 success stories réelles ou fictives:**

```typescript
// Template pour chaque success story
{
  title: "Comment [Client] a augmenté son trafic de X%",
  client_name: "Nom du client",
  client_website: "https://exemple.com",
  excerpt: "Résumé en 2-3 phrases",
  content: "Contenu détaillé en markdown",
  results_summary: "Augmentation de 150% du trafic organique",
  metrics: {
    traffic_before: 1000,
    traffic_after: 2500,
    percentage_increase: 150,
    backlinks_added: 25,
    keyword_rankings: {
      top_3: 15,
      top_10: 45
    }
  },
  category: "SEO",
  tags: ["backlinks", "trafic", "seo"],
  status: "published"
}
```

2. **Exemples de success stories à créer:**
   - E-commerce marocain: +200% de trafic
   - Site immobilier: Première page Google en 3 mois
   - Blog lifestyle: De 500 à 5000 visiteurs/mois
   - Entreprise B2B: Génération de 50 leads qualifiés
   - Restaurant: +300% de réservations en ligne

**✅ Critère de succès:**
- 5 success stories publiées
- Affichage correct sur la page `/success-stories`
- Images et métriques incluses

---

### 3. 🧹 Nettoyer les données de test

**Problème:** Présence de données de test en production

**Impact:** Faible - Mais non professionnel

**Actions:**

```sql
-- 1. Identifier les comptes de test
SELECT id, name, email, role, created_at
FROM users
WHERE email LIKE '%test%'
   OR email LIKE '%example%'
   OR name LIKE '%Test%'
   OR name LIKE '%Demo%';

-- 2. Identifier les transactions de test
SELECT id, user_id, type, amount, description, created_at
FROM credit_transactions
WHERE description LIKE '%test%'
   OR description LIKE '%Test%';

-- 3. Supprimer les données de test (ATTENTION: Vérifier avant!)
-- NE PAS EXÉCUTER SANS VÉRIFICATION MANUELLE

-- DELETE FROM conversation_messages WHERE conversation_id IN (
--   SELECT id FROM conversations WHERE advertiser_id IN (
--     SELECT id FROM users WHERE email LIKE '%test%'
--   )
-- );

-- DELETE FROM conversations WHERE advertiser_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );

-- DELETE FROM credit_transactions WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );

-- DELETE FROM link_purchase_requests WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );

-- DELETE FROM link_listings WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );

-- DELETE FROM websites WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE '%test%'
-- );

-- DELETE FROM users WHERE email LIKE '%test%';
```

**⚠️ ATTENTION:**
- Faire un backup complet AVANT de supprimer
- Vérifier manuellement chaque compte
- Ne pas supprimer les comptes réels

**✅ Critère de succès:**
- Aucun compte avec email "test" ou "example"
- Aucune transaction de test
- Base de données propre

---

### 4. 🔍 Vérifier les transactions en statut `pending`

**Problème:** Certaines transactions peuvent être bloquées en `pending`

**Impact:** Moyen - Affecte les utilisateurs et le cash-flow

**Actions:**

```sql
-- 1. Lister toutes les transactions pending de plus de 7 jours
SELECT 
  ct.id,
  ct.user_id,
  u.name,
  u.email,
  ct.type,
  ct.amount,
  ct.description,
  ct.created_at,
  DATE_PART('day', NOW() - ct.created_at) as days_pending
FROM credit_transactions ct
JOIN users u ON u.id = ct.user_id
WHERE ct.status = 'pending'
  AND ct.created_at < NOW() - INTERVAL '7 days'
ORDER BY ct.created_at ASC;

-- 2. Lister les balance_requests en attente
SELECT 
  br.id,
  br.user_name,
  br.user_email,
  br.type,
  br.amount,
  br.status,
  br.created_at,
  DATE_PART('day', NOW() - br.created_at) as days_pending
FROM balance_requests br
WHERE br.status = 'pending'
ORDER BY br.created_at ASC;

-- 3. Actions correctives (à adapter selon les cas)
-- Approuver les demandes valides
UPDATE balance_requests
SET 
  status = 'approved',
  processed_at = NOW(),
  processed_by = '[ADMIN_ID]'
WHERE id = '[REQUEST_ID]';

-- Compléter les transactions
UPDATE credit_transactions
SET 
  status = 'completed',
  completed_at = NOW()
WHERE id = '[TRANSACTION_ID]';
```

**✅ Critère de succès:**
- Aucune transaction pending de plus de 7 jours
- Tous les utilisateurs notifiés
- Documentation des raisons pour les rejets

---

## 🟡 ACTIONS IMPORTANTES (À faire ce mois-ci)

### 5. 🚀 Optimiser les performances de la base de données

**Actions:**

```sql
-- 1. Ajouter des index sur les colonnes fréquemment recherchées
CREATE INDEX IF NOT EXISTS idx_link_listings_status ON link_listings(status);
CREATE INDEX IF NOT EXISTS idx_link_listings_category ON link_listings(category);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_status ON link_purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_user_id ON link_purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_link_purchase_requests_publisher_id ON link_purchase_requests(publisher_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_conversations_advertiser_id ON conversations(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_conversations_publisher_id ON conversations(publisher_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 2. Analyser les requêtes lentes
-- (À faire via le dashboard Supabase)

-- 3. Nettoyer les données anciennes
-- Archiver les notifications de plus de 6 mois
UPDATE notifications
SET read = true
WHERE created_at < NOW() - INTERVAL '6 months';

-- Optionnel: Supprimer les notifications très anciennes
-- DELETE FROM notifications
-- WHERE created_at < NOW() - INTERVAL '1 year'
--   AND read = true;
```

**✅ Critère de succès:**
- Temps de chargement réduit de 30%
- Aucune requête > 1 seconde
- Index créés et utilisés

---

### 6. 📊 Implémenter un système de monitoring

**Actions:**

1. **Ajouter Sentry pour le suivi des erreurs:**

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "VOTRE_DSN_SENTRY",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

2. **Créer un dashboard de statistiques:**

```sql
-- Vue pour les statistiques admin
CREATE OR REPLACE VIEW admin_statistics AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'advertiser') as total_advertisers,
  (SELECT COUNT(*) FROM users WHERE role = 'publisher') as total_publishers,
  (SELECT COUNT(*) FROM websites WHERE status = 'active') as active_websites,
  (SELECT COUNT(*) FROM link_listings WHERE status = 'active') as active_listings,
  (SELECT COUNT(*) FROM link_purchase_requests WHERE status = 'pending') as pending_requests,
  (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE status = 'completed' AND type = 'purchase') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE status = 'completed' AND type = 'commission') as total_commissions,
  (SELECT COUNT(*) FROM conversations WHERE is_active = true) as active_conversations,
  (SELECT COUNT(*) FROM notifications WHERE read = false) as unread_notifications;
```

**✅ Critère de succès:**
- Sentry configuré et fonctionnel
- Dashboard admin avec statistiques
- Alertes automatiques pour les erreurs

---

### 7. 📝 Créer la documentation

**Actions:**

1. **Guide utilisateur (Annonceur):**
   - Comment créer un compte
   - Comment acheter un lien
   - Comment utiliser la messagerie
   - Comment gérer son solde

2. **Guide utilisateur (Éditeur):**
   - Comment ajouter un site web
   - Comment créer une annonce de lien
   - Comment accepter/rejeter des demandes
   - Comment retirer ses gains

3. **Guide administrateur:**
   - Comment valider les sites web
   - Comment gérer les utilisateurs
   - Comment traiter les demandes de retrait
   - Comment modérer le contenu

4. **Documentation technique:**
   - Architecture de la plateforme
   - Structure de la base de données
   - API endpoints
   - Guide de déploiement

**Fichiers à créer:**
- `docs/guide-annonceur.md`
- `docs/guide-editeur.md`
- `docs/guide-admin.md`
- `docs/technical-documentation.md`

**✅ Critère de succès:**
- 4 guides complets créés
- Captures d'écran incluses
- Vidéos tutorielles (optionnel)

---

### 8. 🧪 Implémenter des tests

**Actions:**

```bash
# 1. Installer les dépendances de test
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom

# 2. Configurer Vitest
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

**Tests prioritaires:**
- Authentification
- Création de site web
- Achat de lien
- Workflow complet
- Système de crédit

**✅ Critère de succès:**
- 50+ tests unitaires
- 10+ tests d'intégration
- Couverture > 60%

---

## 🟢 AMÉLIORATIONS FUTURES (3-6 mois)

### 9. 📱 Application Mobile

**Technologies:**
- React Native
- Expo
- ou PWA (Progressive Web App)

**Fonctionnalités:**
- Navigation marketplace
- Notifications push
- Messagerie temps réel
- Gestion du compte

---

### 10. 🔌 API Publique

**Endpoints à créer:**
```
GET    /api/v1/websites
GET    /api/v1/websites/:id
GET    /api/v1/links
GET    /api/v1/links/:id
POST   /api/v1/purchase-requests
GET    /api/v1/user/balance
POST   /api/v1/user/deposit
```

**Documentation:**
- OpenAPI/Swagger
- Exemples de code
- Rate limiting
- Authentication (API keys)

---

### 11. 🎁 Programme de Fidélité

**Système de points:**
- 1 point = 1 MAD dépensé
- Paliers: Bronze, Silver, Gold, Platinum
- Réductions selon le palier
- Bonus parrainage

**Avantages:**
- Commissions réduites
- Support prioritaire
- Accès à des liens exclusifs
- Badge sur le profil

---

### 12. ⭐ Système d'Avis et Notes

**Fonctionnalités:**
- Note éditeur (1-5 étoiles)
- Note annonceur (1-5 étoiles)
- Commentaires
- Réponse aux avis
- Modération

---

## 📊 SUIVI DES ACTIONS

### Checklist Court Terme (Cette semaine)

- [ ] Corriger le problème user_profiles
- [ ] Publier 5 success stories
- [ ] Nettoyer les données de test
- [ ] Vérifier les transactions pending

### Checklist Moyen Terme (Ce mois)

- [ ] Optimiser la base de données
- [ ] Implémenter monitoring (Sentry)
- [ ] Créer la documentation
- [ ] Ajouter des tests

### Checklist Long Terme (3-6 mois)

- [ ] Application mobile
- [ ] API publique
- [ ] Programme de fidélité
- [ ] Système d'avis

---

## 🎯 OBJECTIFS DE SCORE

```
Actuel:  79/100
Après corrections urgentes:     85/100  (+6)
Après actions importantes:      92/100  (+7)
Après améliorations futures:    98/100  (+6)
```

---

## 📞 CONTACT & SUPPORT

Pour toute question sur ce plan d'action:
- 📧 Email: support@authority.ma
- 💬 Chat: Widget Brevo sur le site

---

**Dernière mise à jour:** 8 Octobre 2025  
**Prochaine révision:** Dans 2 semaines
