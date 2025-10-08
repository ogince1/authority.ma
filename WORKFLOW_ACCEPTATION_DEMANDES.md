# 🔄 WORKFLOW D'ACCEPTATION DES DEMANDES DE LIENS

**Date:** 8 Octobre 2025  
**Plateforme:** Authority.ma  
**Type:** Documentation technique

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Workflow complet](#workflow-complet)
3. [Processus d'acceptation](#processus-dacceptation)
4. [Gestion des paiements](#gestion-des-paiements)
5. [Types de contenu](#types-de-contenu)
6. [Statuts des demandes](#statuts-des-demandes)
7. [Schémas détaillés](#schémas-détaillés)
8. [Code technique](#code-technique)

---

## 🎯 VUE D'ENSEMBLE

Le système d'acceptation des demandes entre **éditeurs** et **annonceurs** fonctionne avec un workflow automatisé qui gère:

- ✅ Validation des demandes par l'éditeur
- 💰 Paiement immédiat automatique
- 📧 Notifications en temps réel
- 💬 Messagerie intégrée
- 🔄 Suivi du statut

### Principe Clé

**PAIEMENT IMMÉDIAT À L'ACCEPTATION** - Plus de confirmation manuelle, tout est automatique!

---

## 🔄 WORKFLOW COMPLET

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW COMPLET                              │
└─────────────────────────────────────────────────────────────────┘

ÉTAPE 1: ANNONCEUR FAIT UNE DEMANDE
─────────────────────────────────────
👤 Annonceur
   │
   ├─ Parcourt marketplace
   ├─ Sélectionne un lien
   ├─ Remplit formulaire:
   │  • URL cible
   │  • Texte d'ancrage
   │  • Message (optionnel)
   │  • Type de contenu:
   │    - "platform": Rédaction par la plateforme (+90 MAD)
   │    - "custom": Contenu fourni par l'annonceur
   │
   └─ Soumet la demande
      │
      ├─ 💰 Son solde est GELÉ (réservé, pas encore débité)
      ├─ 📊 Status: "pending"
      └─ 🔔 Notification envoyée à l'éditeur

───────────────────────────────────────────────────────────────────

ÉTAPE 2: ÉDITEUR REÇOIT LA NOTIFICATION
────────────────────────────────────────
👨‍💼 Éditeur
   │
   ├─ 🔔 Reçoit notification
   ├─ 👀 Consulte la demande dans son dashboard
   ├─ 📋 Examine les détails:
   │  • URL cible de l'annonceur
   │  • Texte d'ancrage demandé
   │  • Message de l'annonceur
   │  • Prix proposé
   │  • Type de contenu
   │
   └─ Décision: ACCEPTER ou REJETER

───────────────────────────────────────────────────────────────────

ÉTAPE 3A: ÉDITEUR ACCEPTE (CAS NORMAL)
───────────────────────────────────────
👨‍💼 Éditeur clique sur "Accepter"
   │
   ├─ ⚡ PAIEMENT IMMÉDIAT ET AUTOMATIQUE:
   │  │
   │  ├─ 💸 Annonceur débité (ex: 200 MAD)
   │  │  └─ Transaction "purchase" créée
   │  │
   │  ├─ 💰 Éditeur crédité (ex: 170 MAD)
   │  │  └─ Transaction "commission" créée
   │  │
   │  └─ 🏢 Plateforme garde commission (ex: 30 MAD = 15%)
   │
   ├─ 📊 Status: "pending" → "accepted"
   ├─ 🔔 Notifications envoyées:
   │  ├─ Annonceur: "Demande acceptée, paiement effectué"
   │  └─ Éditeur: "Crédit ajouté à votre solde"
   │
   └─ 💬 Conversation créée automatiquement
      └─ Les deux parties peuvent échanger des messages

───────────────────────────────────────────────────────────────────

ÉTAPE 3B: ÉDITEUR ACCEPTE (AVEC RÉDACTION PLATEFORME)
──────────────────────────────────────────────────────
Si l'annonceur a choisi "Rédaction par la plateforme":

👨‍💼 Éditeur clique sur "Accepter"
   │
   ├─ ⚡ PAIEMENT IMMÉDIAT ET AUTOMATIQUE:
   │  │
   │  ├─ 💸 Annonceur débité (ex: 290 MAD)
   │  │  └─ 200 MAD lien + 90 MAD rédaction
   │  │
   │  ├─ 💰 Éditeur crédité (ex: 170 MAD)
   │  │  └─ Uniquement sa part sur le lien (200 - 30 commission)
   │  │
   │  └─ 🏢 Plateforme garde:
   │     ├─ 30 MAD commission (15% du lien)
   │     └─ 90 MAD rédaction
   │     = 120 MAD total
   │
   ├─ 📊 Status: "pending" → "accepted_waiting_article"
   ├─ 🔔 Notifications:
   │  ├─ Annonceur: "Acceptée, article en cours de rédaction"
   │  ├─ Éditeur: "Crédit ajouté, article sera fourni"
   │  └─ Admin: "Article à rédiger pour demande #XXX"
   │
   └─ 💬 Conversation créée
      └─ Message auto: "En attente de l'article de la plateforme"

───────────────────────────────────────────────────────────────────

ÉTAPE 4: PLACEMENT DU LIEN
───────────────────────────
👨‍💼 Éditeur
   │
   ├─ Place le lien sur son site
   ├─ Renseigne l'URL de placement:
   │  └─ Formulaire dans le dashboard
   │
   └─ Soumet l'URL
      │
      ├─ 📊 Champ "placement_url" mis à jour
      ├─ 📊 Champ "placed_at" enregistre la date
      ├─ 🔔 Notification à l'annonceur:
      │  └─ "Votre lien a été placé: [URL]"
      │
      └─ ✅ Validation URL automatique (périodique)
         └─ Vérification que le lien est toujours actif

───────────────────────────────────────────────────────────────────

ÉTAPE 5: REJET DE LA DEMANDE (OPTIONNEL)
─────────────────────────────────────────
Si l'éditeur refuse la demande:

👨‍💼 Éditeur clique sur "Rejeter"
   │
   ├─ 📊 Status: "pending" → "rejected"
   ├─ 💰 REMBOURSEMENT IMMÉDIAT de l'annonceur
   │  └─ Transaction "refund" créée
   │
   └─ 🔔 Notification à l'annonceur:
      └─ "Demande refusée, vous avez été remboursé"
```

---

## 💰 GESTION DES PAIEMENTS

### Principe Fondamental

**PAIEMENT IMMÉDIAT LORS DE L'ACCEPTATION**

Il n'y a **PLUS** de système de confirmation manuelle en 2 étapes. Tout est automatique dès que l'éditeur accepte.

### Répartition des Montants

#### Cas 1: Lien Simple (Sans rédaction)

```
Prix annoncé: 200 MAD
─────────────────────────────────────
💸 Annonceur débité:        200 MAD
💰 Éditeur crédité:         170 MAD (85%)
🏢 Plateforme (commission):  30 MAD (15%)
```

**Détail des transactions:**
```sql
-- Transaction 1: Débit annonceur
INSERT INTO credit_transactions (
  user_id,              -- ID annonceur
  type,                 -- 'purchase'
  amount,               -- -200
  description,          -- 'Achat de lien: [anchor_text]'
  related_purchase_request_id
)

-- Transaction 2: Crédit éditeur
INSERT INTO credit_transactions (
  user_id,              -- ID éditeur
  type,                 -- 'commission'
  amount,               -- +170
  description,          -- 'Commission pour lien: [anchor_text]'
  related_purchase_request_id
)
```

#### Cas 2: Lien avec Rédaction Plateforme

```
Prix affiché: 290 MAD (200 lien + 90 rédaction)
─────────────────────────────────────────────────
💸 Annonceur débité:        290 MAD
💰 Éditeur crédité:         170 MAD (85% de 200)
🏢 Plateforme reçoit:       120 MAD
   ├─ Commission lien:       30 MAD (15% de 200)
   └─ Rédaction article:     90 MAD

Calcul détaillé:
─────────────────
Prix total:              290 MAD
- Prix lien seul:        200 MAD
  ├─ Éditeur:           170 MAD (85%)
  └─ Commission:         30 MAD (15%)
- Prix rédaction:         90 MAD (100% plateforme)
```

**Détail des transactions:**
```sql
-- Transaction 1: Débit annonceur
INSERT INTO credit_transactions (
  user_id,              -- ID annonceur
  type,                 -- 'purchase'
  amount,               -- -290
  description,          -- 'Achat de lien + rédaction: [anchor_text]'
  related_purchase_request_id
)

-- Transaction 2: Crédit éditeur
INSERT INTO credit_transactions (
  user_id,              -- ID éditeur
  type,                 -- 'commission'
  amount,               -- +170 (uniquement la part du lien)
  description,          -- 'Commission pour lien: [anchor_text]'
  related_purchase_request_id
)

-- La plateforme garde automatiquement: 290 - 170 = 120 MAD
```

### Configuration de la Commission

La commission est configurable dans `platform_settings`:

```sql
SELECT setting_value 
FROM platform_settings 
WHERE setting_key = 'commission_rate';
-- Valeur par défaut: 15 (%)
```

Pour modifier:
```sql
UPDATE platform_settings 
SET setting_value = '20' 
WHERE setting_key = 'commission_rate';
```

---

## 📝 TYPES DE CONTENU

### 1. Contenu Personnalisé (`custom`)

**L'annonceur fournit son propre contenu**

- ✅ Pas de frais supplémentaires
- ✅ Contenu fourni dans `custom_content`
- ✅ L'éditeur place directement le lien

**Workflow:**
```
pending → accepted → (éditeur place le lien) → placement_url renseignée
```

### 2. Rédaction par la Plateforme (`platform`)

**La plateforme rédige l'article**

- 💰 +90 MAD de frais
- ✍️ Article rédigé par l'équipe
- 📝 Stocké dans `article_content`, `article_title`, `article_keywords`

**Workflow:**
```
pending → accepted_waiting_article → (admin rédige) → accepted → (éditeur place) → placement_url
```

**Champs utilisés:**
- `content_option`: 'platform' ou 'custom'
- `article_content`: Contenu rédigé
- `article_title`: Titre de l'article
- `article_keywords`: Mots-clés ciblés
- `writer_name`: Nom du rédacteur (admin)

---

## 📊 STATUTS DES DEMANDES

### Statuts Principaux

| Statut | Description | Qui peut le mettre | Actions possibles |
|--------|-------------|-------------------|-------------------|
| `pending` | En attente de réponse éditeur | Système (à la création) | Accepter, Rejeter |
| `accepted` | Acceptée, paiement effectué | Éditeur | Placer le lien, Messagerie |
| `accepted_waiting_article` | Acceptée, en attente d'article | Éditeur (si content_option='platform') | Admin rédige l'article |
| `rejected` | Refusée par l'éditeur | Éditeur | Aucune (remboursement fait) |
| `cancelled` | Annulée | Système/Admin | Aucune (remboursement fait) |

### Statuts Étendus (extended_status)

La colonne `extended_status` permet des statuts plus précis:

```sql
SELECT extended_status FROM link_purchase_requests;

-- Valeurs possibles:
accepted_waiting_article    -- Accepté, article en cours
article_completed           -- Article rédigé
link_placed                 -- Lien placé sur le site
link_validated              -- Lien vérifié et actif
link_broken                 -- Lien cassé/inactif
```

### Transitions de Statuts

```
┌────────┐
│ PENDING│
└───┬────┘
    │
    ├─ ACCEPTER ──► ┌──────────┐
    │               │ ACCEPTED │
    │               └────┬─────┘
    │                    │
    │                    ├─ Contenu custom ────► Placement
    │                    │
    │                    └─ Rédaction plateforme ──► ┌────────────────────────┐
    │                                                 │ACCEPTED_WAITING_ARTICLE│
    │                                                 └───────┬────────────────┘
    │                                                         │
    │                                                         ├─ Admin rédige
    │                                                         │
    │                                                         └─► ACCEPTED ──► Placement
    │
    └─ REJETER ───► ┌──────────┐
                    │ REJECTED │
                    └──────────┘
                    (+ Remboursement)
```

---

## 🔧 CODE TECHNIQUE

### Fonction d'Acceptation (Backend)

**Fichier:** `src/lib/supabase.ts`

```typescript
export const acceptPurchaseRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Récupérer la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Demande non trouvée');
    }

    // 2. Vérifier le statut
    if (request.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    // 3. Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'accepted',
        response_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 4. CALCUL DES MONTANTS
    const settings = await getPlatformSettings();
    const commissionRate = (settings.commission_rate || 15) / 100; // 15% par défaut
    
    // Vérifier si rédaction par plateforme
    const isPlatformContent = request.content_option === 'platform';
    const platformContentRevenue = isPlatformContent ? 90 : 0;
    
    // Commission calculée UNIQUEMENT sur le prix du lien
    const linkPrice = isPlatformContent 
      ? request.proposed_price - 90  // Enlever les 90 MAD de rédaction
      : request.proposed_price;
    
    const commissionAmount = linkPrice * commissionRate;
    const publisherCommission = linkPrice - commissionAmount;
    const platformNetAmount = commissionAmount + platformContentRevenue;
    
    console.log(`💰 Prix du lien: ${linkPrice.toFixed(2)} MAD`);
    console.log(`💰 Commission: ${commissionAmount.toFixed(2)} MAD`);
    console.log(`💰 Rédaction: ${platformContentRevenue.toFixed(2)} MAD`);
    console.log(`💰 Éditeur reçoit: ${publisherCommission.toFixed(2)} MAD`);
    console.log(`💰 Plateforme reçoit: ${platformNetAmount.toFixed(2)} MAD`);
    
    // 5. DÉBITER L'ANNONCEUR
    await createCreditTransaction({
      user_id: request.user_id, // Annonceur
      type: 'purchase',
      amount: request.proposed_price,
      description: `Achat de lien: ${request.anchor_text}`,
      related_purchase_request_id: requestId
    });
    
    // 6. CRÉDITER L'ÉDITEUR
    await createCreditTransaction({
      user_id: request.publisher_id, // Éditeur
      type: 'commission',
      amount: publisherCommission,
      description: `Commission pour lien: ${request.anchor_text}`,
      related_purchase_request_id: requestId
    });

    // 7. NOTIFICATION
    await createNotification({
      user_id: request.user_id,
      type: 'success',
      message: `Votre demande pour le lien "${request.anchor_text}" a été acceptée et le paiement effectué.`,
      action_type: 'link_purchase',
      action_id: requestId
    });

    return { success: true };
  } catch (error) {
    console.error('Error accepting purchase request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'acceptation'
    };
  }
};
```

### Composant Frontend (Éditeur)

**Fichier:** `src/components/User/PurchaseRequestsPublisher.tsx`

```typescript
const handleAcceptRequest = async (requestId: string) => {
  try {
    const request = requests.find(r => r.id === requestId);
    let newStatus: string;
    
    // Déterminer le statut selon le type de contenu
    if (request?.content_option === 'platform') {
      // Rédaction par plateforme → statut spécial
      newStatus = 'accepted_waiting_article';
      
      const { error } = await supabase
        .from('link_purchase_requests')
        .update({
          extended_status: newStatus,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) throw error;

      // Créer conversation automatiquement
      await createConversation(requestId, request);
      
      toast.success('Demande acceptée ! En attente de rédaction d\'article.');
    } else {
      // Contenu personnalisé → acceptation simple
      const result = await acceptPurchaseRequest(requestId);
      
      if (result.success) {
        toast.success('Demande acceptée et paiement effectué !');
      } else {
        throw new Error(result.error);
      }
    }
    
    // Recharger les demandes
    await loadRequests();
  } catch (error) {
    console.error('Error accepting request:', error);
    toast.error('Erreur lors de l\'acceptation');
  }
};
```

---

## 💬 SYSTÈME DE MESSAGERIE

### Création Automatique de Conversation

Lors de l'acceptation d'une demande, une conversation est automatiquement créée:

```typescript
// Créer la conversation
const { data: conversation } = await supabase
  .from('conversations')
  .insert({
    purchase_request_id: requestId,
    advertiser_id: request.user_id,
    publisher_id: request.publisher_id,
    subject: `Demande acceptée - ${request.anchor_text}`,
    created_at: new Date().toISOString()
  })
  .select()
  .single();

// Ajouter un message initial
await supabase
  .from('conversation_messages')
  .insert({
    conversation_id: conversation.id,
    sender_id: request.publisher_id, // Éditeur
    receiver_id: request.user_id, // Annonceur
    content: `Bonjour ! J'ai accepté votre demande pour le lien "${request.anchor_text}".`,
    message_type: 'text',
    related_purchase_request_id: requestId
  });
```

### Compteurs de Messages Non Lus

Les compteurs sont automatiquement mis à jour:

```sql
-- Table conversations
unread_count_advertiser  -- Messages non lus par l'annonceur
unread_count_publisher   -- Messages non lus par l'éditeur
```

---

## 📧 NOTIFICATIONS

### Types de Notifications Envoyées

#### À l'acceptation:

**Pour l'annonceur:**
```
✅ Titre: "Demande acceptée"
Message: "Votre demande pour le lien '[anchor_text]' a été acceptée et le paiement effectué."
Type: success
Action: Voir la demande
```

**Pour l'éditeur:**
```
💰 Titre: "Crédit ajouté"
Message: "Vous avez reçu [montant] MAD pour le lien '[anchor_text]'."
Type: success
Action: Voir mon solde
```

#### Au placement du lien:

**Pour l'annonceur:**
```
🔗 Titre: "Lien placé"
Message: "Votre lien a été placé sur [website_url] à l'adresse: [placement_url]"
Type: success
Action: Voir le lien
```

#### Au rejet:

**Pour l'annonceur:**
```
❌ Titre: "Demande refusée"
Message: "Votre demande a été refusée. Vous avez été remboursé de [montant] MAD."
Type: info
Action: Chercher un autre site
```

---

## 🔍 VALIDATION DU LIEN

### Vérification Automatique

La plateforme vérifie périodiquement que les liens placés sont toujours actifs:

**Champs de validation:**
```sql
url_validation_status      -- 'valid', 'invalid', 'pending'
url_validation_date        -- Dernière vérification
url_validation_notes       -- Notes de validation
last_check_date           -- Dernier check
check_frequency_days      -- Fréquence (défaut: 30 jours)
is_active                 -- Lien actif ou non
```

**Processus:**
1. Vérification automatique tous les 30 jours
2. Si le lien est cassé → notification à l'annonceur et l'éditeur
3. Si non corrigé dans X jours → remboursement possible

---

## 📊 RÉSUMÉ DES TABLES IMPLIQUÉES

### Tables Principales

```sql
-- 1. link_purchase_requests
-- Stocke toutes les demandes d'achat
CREATE TABLE link_purchase_requests (
  id UUID PRIMARY KEY,
  link_listing_id UUID REFERENCES link_listings,
  user_id UUID REFERENCES users,           -- Annonceur
  publisher_id UUID REFERENCES users,      -- Éditeur
  target_url TEXT,
  anchor_text TEXT,
  proposed_price DECIMAL,
  status TEXT,                             -- pending, accepted, rejected
  extended_status TEXT,                    -- Statuts détaillés
  content_option TEXT,                     -- 'platform' ou 'custom'
  custom_content TEXT,                     -- Contenu fourni
  article_content TEXT,                    -- Article rédigé
  article_title TEXT,
  article_keywords TEXT[],
  placement_url TEXT,                      -- URL où le lien est placé
  placed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 2. credit_transactions
-- Historique de toutes les transactions financières
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  type TEXT,                               -- purchase, commission, refund
  amount DECIMAL,
  description TEXT,
  related_purchase_request_id UUID,
  balance_before DECIMAL,
  balance_after DECIMAL,
  status TEXT,                             -- pending, completed
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- 3. conversations
-- Conversations entre annonceurs et éditeurs
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  purchase_request_id UUID REFERENCES link_purchase_requests,
  advertiser_id UUID REFERENCES users,
  publisher_id UUID REFERENCES users,
  subject TEXT,
  last_message_at TIMESTAMP,
  is_active BOOLEAN,
  unread_count_advertiser INTEGER,
  unread_count_publisher INTEGER,
  created_at TIMESTAMP
);

-- 4. conversation_messages
-- Messages échangés
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations,
  sender_id UUID REFERENCES users,
  receiver_id UUID REFERENCES users,
  content TEXT,
  message_type TEXT,                       -- text, system, notification
  is_read BOOLEAN,
  read_at TIMESTAMP,
  created_at TIMESTAMP
);

-- 5. notifications
-- Notifications utilisateurs
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  title TEXT,
  message TEXT,
  type TEXT,                               -- success, error, info, warning
  read BOOLEAN,
  action_type TEXT,                        -- link_purchase, payment, etc.
  action_id UUID,
  created_at TIMESTAMP
);
```

---

## 🎯 POINTS CLÉS À RETENIR

### ✅ Ce qui fonctionne:

1. **Paiement immédiat automatique** lors de l'acceptation
2. **Commission configurable** (défaut: 15%)
3. **Deux types de contenu** (custom / platform)
4. **Messagerie intégrée** par demande
5. **Notifications temps réel**
6. **Validation URL automatique**
7. **Remboursement automatique** en cas de rejet

### 🔧 Processus Simplifié:

```
Annonceur fait demande
   ↓
Éditeur reçoit notification
   ↓
Éditeur accepte
   ↓
💰 PAIEMENT AUTOMATIQUE
   ├─ Annonceur débité
   ├─ Éditeur crédité
   └─ Plateforme garde commission
   ↓
Éditeur place le lien
   ↓
✅ Mission accomplie
```

### 📊 Statistiques Actuelles:

D'après l'analyse de la base de données:
- **109 demandes** traitées
- **312 transactions** effectuées
- **70 conversations** actives
- **83 messages** échangés

---

## 🚀 AMÉLIORATIONS POSSIBLES

### Court Terme:
1. ✅ Dashboard avec graphiques des demandes
2. ✅ Export CSV des transactions
3. ✅ Rappels automatiques si lien non placé après X jours

### Moyen Terme:
4. ⚠️ Système de pénalités si lien retiré
5. ⚠️ Programme de fidélité (réductions après X achats)
6. ⚠️ Système d'avis/notes éditeurs

### Long Terme:
7. 🔮 Machine learning pour suggérer les meilleurs sites
8. 🔮 API publique pour intégration externe
9. 🔮 Application mobile

---

## 📞 SUPPORT

Pour toute question sur ce workflow:

- 📧 Email: support@authority.ma
- 💬 Chat: Widget Brevo
- 📚 Documentation: `/docs/`

---

**📅 Document créé le:** 8 Octobre 2025  
**🔄 Dernière mise à jour:** 8 Octobre 2025  
**✍️ Auteur:** Documentation technique Authority.ma  
**📊 Version:** 1.0
