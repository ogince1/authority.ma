# 🏗️ ANALYSE COMPLÈTE - Authority.ma (Back.ma)
## Architecture Frontend + Supabase + Processus Complets

---

## 📋 **TABLE DES MATIÈRES**

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Base de Données Supabase](#base-de-données-supabase)
4. [Flux Utilisateurs](#flux-utilisateurs)
5. [Système de Paiement](#système-de-paiement)
6. [Systèmes Additionnels](#systèmes-additionnels)
7. [Dashboard Admin](#dashboard-admin)

---

## 🎯 **VUE D'ENSEMBLE**

### **Concept de la Plateforme**

**Authority.ma** (anciennement Back.ma) est une **plateforme marocaine de netlinking** qui connecte:
- 🏢 **Annonceurs** : Entreprises qui veulent acheter des backlinks pour améliorer leur SEO
- 📰 **Éditeurs** : Propriétaires de sites web qui vendent des emplacements de liens

### **Stack Technologique**

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND                                                   │
│  ├─ React 18 + TypeScript                                   │
│  ├─ Vite (build tool)                                       │
│  ├─ Tailwind CSS (styling)                                  │
│  ├─ Framer Motion (animations)                              │
│  ├─ React Router (navigation)                               │
│  └─ Lucide React (icons)                                    │
├─────────────────────────────────────────────────────────────┤
│  BACKEND (SUPABASE)                                          │
│  ├─ PostgreSQL (database)                                   │
│  ├─ Supabase Auth (authentification)                        │
│  ├─ Row Level Security (RLS policies)                       │
│  ├─ Triggers & Functions (business logic)                   │
│  └─ Storage (images)                                        │
├─────────────────────────────────────────────────────────────┤
│  SERVICES EXTERNES                                           │
│  ├─ Brevo (emails transactionnels)                          │
│  ├─ PayPal (paiements en ligne)                             │
│  ├─ Stripe (paiements par carte)                            │
│  └─ Google Analytics (tracking)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Structure du Frontend**

```
src/
├── components/
│   ├── Admin/          → Dashboard administrateur
│   ├── Auth/           → Inscription / Connexion
│   ├── Cart/           → Panier d'achat
│   ├── Links/          → Gestion des liens
│   ├── Payment/        → Système de paiement
│   ├── Publisher/      → Dashboard éditeur
│   ├── User/           → Dashboard utilisateur
│   └── Websites/       → Gestion des sites web
│
├── pages/              → Pages de l'application
│   ├── HomePage.tsx
│   ├── LinksPage.tsx
│   ├── UserDashboardPage.tsx
│   └── ...
│
├── lib/
│   └── supabase.ts     → Toutes les fonctions API Supabase
│
├── utils/              → Utilitaires
│   ├── emailServiceClient.ts
│   ├── analytics.ts
│   └── categories.ts
│
└── types/
    └── index.ts        → Définitions TypeScript
```

### **Flux de Données**

```
┌──────────────┐      API Calls       ┌──────────────┐
│              │ ──────────────────>   │              │
│   FRONTEND   │                       │   SUPABASE   │
│   (React)    │ <────────────────────   (PostgreSQL) │
│              │      Real-time        │              │
└──────────────┘                       └──────────────┘
       │                                       │
       │                                       │
       ├─> User Actions                        ├─> Triggers
       ├─> Forms                               ├─> Functions
       ├─> Validations                         ├─> RLS Policies
       └─> UI Updates                          └─> Notifications
```

---

## 🗄️ **BASE DE DONNÉES SUPABASE**

### **Tables Principales (26 tables)**

#### **1️⃣ Gestion des Utilisateurs**

```sql
┌─────────────────────────────────────────────────────────────┐
│  TABLE: users                                               │
├─────────────────────────────────────────────────────────────┤
│  Colonnes principales:                                       │
│  ├─ id (UUID)                  → Identifiant unique         │
│  ├─ email (TEXT)               → Email de connexion         │
│  ├─ name (TEXT)                → Nom complet                │
│  ├─ role (TEXT)                → advertiser | publisher     │
│  ├─ balance (NUMERIC)          → Solde en MAD              │
│  ├─ phone (TEXT)               → Téléphone                  │
│  ├─ bank_account_info (JSONB) → Infos bancaires            │
│  ├─ paypal_email (TEXT)        → Email PayPal              │
│  └─ created_at (TIMESTAMP)     → Date d'inscription         │
└─────────────────────────────────────────────────────────────┘
```

**Trigger important:** `handle_new_user()` 
- Crée automatiquement un profil dans `users` après inscription dans `auth.users`

#### **2️⃣ Sites Web des Éditeurs**

```sql
┌─────────────────────────────────────────────────────────────┐
│  TABLE: websites                                            │
├─────────────────────────────────────────────────────────────┤
│  Informations:                                               │
│  ├─ id, user_id (publisher)                                 │
│  ├─ title, url, description                                 │
│  ├─ Métriques SEO:                                          │
│  │   ├─ domain_authority (DA)                               │
│  │   ├─ trust_flow (TF)                                     │
│  │   ├─ monthly_traffic                                     │
│  │   ├─ keywords_ranking                                    │
│  │   └─ spam_score                                          │
│  ├─ category (niche)                                        │
│  ├─ language                                                │
│  ├─ Prix:                                                    │
│  │   ├─ link_price (prix lien existant)                    │
│  │   └─ new_article_price (prix nouvel article)            │
│  └─ status (active | pending | rejected)                    │
└─────────────────────────────────────────────────────────────┘
```

#### **3️⃣ Annonces de Liens**

```sql
┌─────────────────────────────────────────────────────────────┐
│  TABLE: link_listings                                       │
├─────────────────────────────────────────────────────────────┤
│  Détails du lien:                                            │
│  ├─ id, website_id, user_id (publisher)                     │
│  ├─ title, description                                      │
│  ├─ link_type:                                              │
│  │   └─ dofollow | nofollow | sponsored | ugc              │
│  ├─ link_position:                                          │
│  │   └─ header | footer | sidebar | content | menu         │
│  ├─ price (MAD)                                             │
│  ├─ max_links (capacité)                                    │
│  ├─ delivery_time (jours)                                   │
│  └─ status (available | sold_out | inactive)                │
└─────────────────────────────────────────────────────────────┘
```

#### **4️⃣ Demandes d'Achat**

```sql
┌─────────────────────────────────────────────────────────────┐
│  TABLE: link_purchase_requests                              │
├─────────────────────────────────────────────────────────────┤
│  Cycle de vie d'une demande:                                │
│  ├─ id                                                      │
│  ├─ user_id (annonceur)                                     │
│  ├─ publisher_id (éditeur)                                  │
│  ├─ link_listing_id                                         │
│  ├─ Détails de la demande:                                  │
│  │   ├─ target_url (URL à lier)                            │
│  │   ├─ anchor_text (texte d'ancrage)                      │
│  │   ├─ proposed_price                                     │
│  │   ├─ content_option:                                     │
│  │   │   ├─ platform (90 MAD - rédaction par plateforme)   │
│  │   │   └─ custom (contenu fourni par annonceur)          │
│  │   └─ custom_content                                     │
│  ├─ Status workflow:                                        │
│  │   ├─ pending         → En attente éditeur              │
│  │   ├─ accepted        → Acceptée par éditeur            │
│  │   ├─ rejected        → Refusée                         │
│  │   └─ cancelled       → Annulée par annonceur           │
│  ├─ placed_url (URL où le lien a été placé)                │
│  └─ Timestamps: created_at, accepted_at, etc.              │
└─────────────────────────────────────────────────────────────┘
```

#### **5️⃣ Transactions Financières**

```sql
┌─────────────────────────────────────────────────────────────┐
│  TABLE: credit_transactions                                 │
├─────────────────────────────────────────────────────────────┤
│  Types de transactions:                                      │
│  ├─ CRÉDITS (+):                                            │
│  │   ├─ deposit          → Ajout de fonds                   │
│  │   ├─ refund           → Remboursement                    │
│  │   ├─ commission       → Paiement éditeur                │
│  │   ├─ payment_received → Paiement reçu                    │
│  │   └─ earn             → Gains divers                     │
│  ├─ DÉBITS (-):                                             │
│  │   ├─ purchase         → Achat de lien                    │
│  │   ├─ withdrawal       → Retrait de fonds                 │
│  │   └─ payment_sent     → Paiement envoyé                  │
│  └─ Colonnes:                                               │
│      ├─ user_id, type, amount                               │
│      ├─ balance_before, balance_after                       │
│      ├─ description                                         │
│      ├─ related_purchase_request_id                        │
│      └─ status (completed | pending | failed)               │
└─────────────────────────────────────────────────────────────┘
```

**Trigger automatique:** `check_balance_before_transaction()`
- Vérifie le solde avant chaque transaction
- Calcule automatiquement `balance_before` et `balance_after`
- Empêche les soldes négatifs

#### **6️⃣ Autres Tables Importantes**

```
┌─────────────────────────────────────────────────────────┐
│  conversations          → Messagerie entre utilisateurs │
│  conversation_messages  → Messages de la conversation   │
│  notifications          → Notifications utilisateurs    │
│  email_preferences      → Préférences emails            │
│  balance_requests       → Demandes ajout/retrait fonds │
│  services               → Services additionnels         │
│  service_requests       → Demandes de services          │
│  blog_posts             → Articles de blog              │
│  success_stories        → Success stories               │
│  review_exchange_*      → Système d'échange d'avis     │
└─────────────────────────────────────────────────────────┘
```

---

## 👤 **FLUX UTILISATEURS COMPLETS**

### **FLUX 1: Inscription**

```
┌──────────────────────────────────────────────────────────────┐
│  INSCRIPTION D'UN NOUVEL UTILISATEUR                         │
└──────────────────────────────────────────────────────────────┘

1️⃣ Utilisateur remplit le formulaire (/register)
   ├─ Nom complet
   ├─ Email
   ├─ Mot de passe
   └─ Rôle: Éditeur OU Annonceur

2️⃣ Frontend: signUpWithEmail()
   └─ Appel: supabase.auth.signUp({
       email, password,
       options: { data: { name, role } }
     })

3️⃣ Supabase Auth: Création dans auth.users
   └─ user_metadata contient: { name, role }

4️⃣ TRIGGER AUTOMATIQUE: handle_new_user()
   └─ Insertion dans public.users:
       ├─ id = auth.user.id
       ├─ name = metadata.name
       ├─ email = auth.email
       ├─ role = metadata.role
       └─ balance = 0.00

5️⃣ TRIGGER AUTOMATIQUE: create_review_credits_for_user()
   └─ Insertion dans review_exchange_credits:
       └─ credits_balance = 4 (crédits gratuits)

6️⃣ Email de vérification envoyé (Brevo)
   └─ Template selon rôle:
       ├─ EDITOR_WELCOME (éditeur)
       └─ ADVERTISER_WELCOME (annonceur)

7️⃣ Utilisateur connecté automatiquement
   └─ Redirection vers /dashboard

✅ RÉSULTAT:
   ├─ Compte créé dans auth.users
   ├─ Profil créé dans users
   ├─ 4 crédits d'avis offerts
   └─ Rôle correctement assigné
```

### **FLUX 2: Ajout d'un Site Web (Éditeur)**

```
┌──────────────────────────────────────────────────────────────┐
│  AJOUT D'UN SITE WEB PAR UN ÉDITEUR                         │
└──────────────────────────────────────────────────────────────┘

1️⃣ Éditeur va sur /dashboard/websites
   └─ Clique sur "Ajouter un site"

2️⃣ Formulaire: WebsiteForm.tsx
   ├─ Informations de base:
   │   ├─ Titre du site
   │   ├─ URL
   │   ├─ Description
   │   ├─ Catégorie (ex: Technologie, Santé...)
   │   └─ Langue
   ├─ Métriques SEO:
   │   ├─ Domain Authority (DA)
   │   ├─ Trust Flow (TF)
   │   ├─ Trafic mensuel
   │   ├─ Nombre de mots-clés
   │   └─ Spam Score
   └─ Prix:
       ├─ Prix lien existant
       └─ Prix nouvel article (avec rédaction)

3️⃣ Soumission du formulaire
   └─ Frontend: createWebsite() dans supabase.ts
       └─ INSERT INTO websites

4️⃣ Validation & RLS Policy
   ├─ Vérification: user_id = auth.uid()
   └─ Status: 'active' (ou 'pending' si modération)

5️⃣ Redirection vers liste des sites
   └─ Toast de confirmation

✅ RÉSULTAT:
   └─ Site ajouté et visible dans le catalogue
```

### **FLUX 3: Création d'une Annonce de Lien (Éditeur)**

```
┌──────────────────────────────────────────────────────────────┐
│  CRÉATION D'UNE ANNONCE DE LIEN                              │
└──────────────────────────────────────────────────────────────┘

1️⃣ Éditeur sélectionne un de ses sites
   └─ Clique sur "Créer une annonce"

2️⃣ Formulaire: LinkListingForm.tsx
   ├─ Sélection du site (websites dropdown)
   ├─ Détails du lien:
   │   ├─ Titre de l'offre
   │   ├─ Description
   │   ├─ Type: dofollow/nofollow/sponsored/ugc
   │   └─ Position: header/content/footer/sidebar
   ├─ Tarification:
   │   ├─ Prix (MAD)
   │   └─ Délai de livraison (jours)
   └─ Capacité:
       └─ Nombre max de liens acceptables

3️⃣ Soumission
   └─ INSERT INTO link_listings
       ├─ website_id = selected_website.id
       ├─ user_id = current_user.id
       └─ status = 'available'

✅ RÉSULTAT:
   └─ Annonce visible dans le catalogue public
```

### **FLUX 4: Achat de Lien (Annonceur) - PROCESSUS COMPLET**

```
┌──────────────────────────────────────────────────────────────┐
│  ACHAT D'UN LIEN - FLUX COMPLET DE A À Z                     │
└──────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════
PHASE 1: RECHERCHE ET SÉLECTION
══════════════════════════════════════════════════════════════

1️⃣ Annonceur browse le catalogue (/liens)
   └─ Filtres disponibles:
       ├─ Catégorie
       ├─ Type de lien
       ├─ Métriques SEO (DA, TF, trafic)
       └─ Budget (min-max)

2️⃣ Sélection d'un lien
   └─ Clique sur "Voir détails"
       └─ Page: /lien/:id
           ├─ Toutes les infos du site
           ├─ Métriques détaillées
           └─ Prix et conditions

3️⃣ Ajout au panier
   └─ Bouton "Ajouter au panier"
       ├─ Quantité (si plusieurs liens possibles)
       ├─ URL cible (où pointer le lien)
       └─ Texte d'ancrage

══════════════════════════════════════════════════════════════
PHASE 2: CONFIGURATION & VALIDATION PANIER
══════════════════════════════════════════════════════════════

4️⃣ Page panier (/panier)
   Components: CartPage.tsx / NewCartPage.tsx
   
   ├─ Affichage des items:
   │   └─ Pour chaque lien:
   │       ├─ Titre du site
   │       ├─ Prix
   │       ├─ URL cible
   │       ├─ Texte d'ancrage
   │       └─ Option contenu:
   │           ├─ Platform (+90 MAD) → Rédaction par équipe
   │           └─ Custom → Contenu fourni par annonceur
   │
   ├─ Éditeur de contenu (si Custom):
   │   └─ RichTextEditor.tsx
   │       └─ Éditeur WYSIWYG pour rédiger l'article
   │
   ├─ Calcul du total:
   │   └─ Total = Σ (prix_lien + option_contenu)
   │
   └─ Vérification du solde:
       ├─ Solde actuel de l'annonceur
       ├─ Montant requis
       └─ ❌ Bloque si solde insuffisant

5️⃣ Validation du panier
   └─ Bouton "Valider la commande"
       └─ Conditions:
           ✅ Solde suffisant
           ✅ Tous les champs remplis
           ✅ URLs valides

══════════════════════════════════════════════════════════════
PHASE 3: CRÉATION DES DEMANDES (BACKEND)
══════════════════════════════════════════════════════════════

6️⃣ Traitement des achats
   Function: processPurchases() dans CartPage.tsx
   
   Pour chaque item du panier:
   
   A. Vérification des données
      ├─ publisher_id existe
      ├─ link_listing_id valide
      └─ target_url valide

   B. Création de la demande
      └─ createLinkPurchaseRequest()
          └─ INSERT INTO link_purchase_requests:
              ├─ link_listing_id
              ├─ user_id (annonceur)
              ├─ publisher_id (éditeur)
              ├─ target_url
              ├─ anchor_text
              ├─ proposed_price
              ├─ content_option ('platform' | 'custom')
              ├─ custom_content (si fourni)
              ├─ status = 'pending'
              └─ created_at = NOW()

   C. Email de notification à l'éditeur
      └─ Brevo: Template EDITOR_NEW_REQUEST
          ├─ Nom de l'éditeur
          ├─ Détails de la demande
          ├─ Prix proposé
          └─ Lien vers dashboard

   D. Notification in-app
      └─ INSERT INTO notifications
          ├─ user_id = publisher_id
          ├─ type = 'new_request'
          └─ message = "Nouvelle demande reçue"

7️⃣ Réponse au frontend
   └─ Toast: "X demandes créées avec succès"
   └─ Vider le panier
   └─ Redirection vers /dashboard/demandes

══════════════════════════════════════════════════════════════
PHASE 4: ACCEPTATION PAR L'ÉDITEUR
══════════════════════════════════════════════════════════════

8️⃣ Éditeur reçoit notification
   ├─ Email (Brevo)
   ├─ Notification in-app (cloche)
   └─ Badge sur menu "Demandes"

9️⃣ Éditeur consulte la demande
   Page: PurchaseRequestsPublisher.tsx
   
   └─ Liste des demandes:
       ├─ Status: pending
       ├─ Détails affichés:
       │   ├─ Nom annonceur
       │   ├─ URL cible
       │   ├─ Texte d'ancrage
       │   ├─ Prix proposé
       │   └─ Option contenu
       │
       └─ Actions possibles:
           ├─ Accepter
           ├─ Rejeter
           └─ Négocier (messagerie)

🔟 Éditeur accepte
   Button: "Accepter"
   
   ├─ Modal de confirmation:
   │   └─ Optionnel: URL où le lien sera placé
   │
   └─ Soumission:
       Function: acceptPurchaseRequest(requestId)

══════════════════════════════════════════════════════════════
PHASE 5: TRAITEMENT DU PAIEMENT (BACKEND)
══════════════════════════════════════════════════════════════

1️⃣1️⃣ Backend: acceptPurchaseRequest()
    Fichier: src/lib/supabase.ts (ligne ~1966)

    A. Récupération de la demande
       └─ SELECT * FROM link_purchase_requests
           WHERE id = requestId AND status = 'pending'

    B. Calcul des montants
       ├─ Prix total = request.proposed_price
       ├─ Si content_option = 'platform':
       │   ├─ Prix lien = proposed_price - 90
       │   └─ Bénéfice plateforme rédaction = 90 MAD
       ├─ Sinon:
       │   └─ Prix lien = proposed_price
       │
       ├─ Commission plateforme:
       │   └─ commission_rate = 15% (configurable)
       │   └─ commission = prix_lien × 0.15
       │
       └─ Montant éditeur:
           └─ publisher_amount = prix_lien - commission

       Exemple avec article de 140 MAD (rédaction plateforme):
       ├─ Prix total: 140 MAD
       ├─ Bénéfice rédaction: 90 MAD
       ├─ Prix lien seul: 50 MAD
       ├─ Commission 15%: 7.50 MAD
       ├─ Montant éditeur: 42.50 MAD
       └─ Bénéfice total plateforme: 97.50 MAD (90 + 7.50)

    C. DÉBIT DE L'ANNONCEUR
       └─ createCreditTransaction({
           user_id: request.user_id,    // Annonceur
           type: 'purchase',             // Type DÉBIT
           amount: request.proposed_price,
           description: "Achat de lien: [anchor_text]"
         })
       
       Trigger automatique: check_balance_before_transaction()
       ├─ Vérifie solde >= amount
       ├─ balance_before = solde_actuel
       ├─ balance_after = solde_actuel - amount
       └─ UPDATE users SET balance = balance_after

    D. CRÉDIT DE L'ÉDITEUR
       └─ createCreditTransaction({
           user_id: request.publisher_id, // Éditeur
           type: 'commission',            // Type CRÉDIT
           amount: publisher_amount,
           description: "Commission pour lien"
         })
       
       Trigger: check_balance_before_transaction()
       ├─ balance_before = solde_actuel
       ├─ balance_after = solde_actuel + amount
       └─ UPDATE users SET balance = balance_after

    E. Update de la demande
       └─ UPDATE link_purchase_requests SET:
           ├─ status = 'accepted'
           ├─ response_date = NOW()
           └─ updated_at = NOW()

    F. Notifications
       ├─ Notification annonceur:
       │   └─ "Demande acceptée, paiement effectué"
       │
       └─ Notification éditeur:
           └─ "Vous avez reçu X MAD"

1️⃣2️⃣ Réponse au frontend
    └─ Toast: "Demande acceptée avec succès"
    └─ Refresh de la liste des demandes

══════════════════════════════════════════════════════════════
PHASE 6: PLACEMENT DU LIEN
══════════════════════════════════════════════════════════════

1️⃣3️⃣ Éditeur place le lien sur son site
    ├─ Si content_option = 'platform':
    │   └─ Équipe plateforme rédige l'article
    │   └─ Envoie l'article à l'éditeur
    │
    └─ Si content_option = 'custom':
        └─ Éditeur utilise le contenu fourni

1️⃣4️⃣ Éditeur confirme le placement
    ├─ Input: URL où le lien a été placé
    └─ Soumission
    
    └─ UPDATE link_purchase_requests SET:
        ├─ placed_url = "https://site.com/article"
        └─ updated_at = NOW()

══════════════════════════════════════════════════════════════
RÉSULTAT FINAL
══════════════════════════════════════════════════════════════

✅ Annonceur:
   ├─ Débité de 140 MAD
   ├─ Reçu son backlink
   └─ Peut voir la demande dans "Mes achats"

✅ Éditeur:
   ├─ Crédité de 42.50 MAD
   ├─ Publié l'article avec lien
   └─ Peut retirer ses revenus

✅ Plateforme:
   ├─ Commission: 7.50 MAD
   ├─ Bénéfice rédaction: 90 MAD
   └─ Total: 97.50 MAD

✅ Données enregistrées:
   ├─ 2 transactions dans credit_transactions
   ├─ 1 demande dans link_purchase_requests (status: accepted)
   ├─ 2 notifications créées
   └─ Emails envoyés
```

---

## 💰 **SYSTÈME DE PAIEMENT DÉTAILLÉ**

### **Types de Transactions**

```
┌──────────────────────────────────────────────────────────────┐
│  TYPES DE TRANSACTIONS CRÉDIT                                │
├──────────────────────────────────────────────────────────────┤
│  Type           │ Description                │ Utilisateur   │
│─────────────────┼────────────────────────────┼───────────────│
│  deposit        │ Ajout de fonds             │ Annonceur     │
│  refund         │ Remboursement              │ Les deux      │
│  commission     │ Paiement pour lien vendu   │ Éditeur       │
│  payment_received │ Paiement reçu            │ Les deux      │
│  earn           │ Gains divers               │ Les deux      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  TYPES DE TRANSACTIONS DÉBIT                                 │
├──────────────────────────────────────────────────────────────┤
│  Type           │ Description                │ Utilisateur   │
│─────────────────┼────────────────────────────┼───────────────│
│  purchase       │ Achat de lien              │ Annonceur     │
│  withdrawal     │ Retrait de revenus         │ Éditeur       │
│  payment_sent   │ Paiement envoyé            │ Les deux      │
└──────────────────────────────────────────────────────────────┘
```

### **Workflow Ajout de Fonds (Annonceur)**

```
1️⃣ Annonceur: Dashboard → Mon Solde → Ajouter des fonds

2️⃣ Choix de la méthode:
   ├─ A. Virement bancaire
   │   ├─ Affichage info bancaire Back SAS
   │   ├─ Montant à virer
   │   ├─ Référence obligatoire: email
   │   └─ Submit → Demande envoyée à l'admin
   │       └─ INSERT INTO balance_requests:
   │           ├─ type = 'add_funds'
   │           ├─ status = 'pending'
   │           └─ payment_method = 'bank_transfer'
   │
   ├─ B. PayPal
   │   └─ Component: PayPalPayment.tsx
   │       ├─ Génération du paiement PayPal
   │       ├─ Redirection vers PayPal
   │       ├─ Callback après paiement
   │       └─ Si succès:
   │           └─ INSERT INTO credit_transactions:
   │               ├─ type = 'deposit'
   │               ├─ amount = montant_payé
   │               └─ status = 'completed'
   │           └─ Solde mis à jour automatiquement
   │
   └─ C. Carte bancaire (Stripe)
       └─ Component: StripePayment.tsx
           └─ Même processus que PayPal

3️⃣ Admin valide (si virement)
   └─ Dashboard Admin → Demandes de Balance
       └─ Approuve:
           ├─ INSERT INTO credit_transactions
           ├─ UPDATE users SET balance = balance + amount
           └─ Notification annonceur

✅ Résultat: Solde augmenté, utilisateur peut acheter
```

### **Workflow Retrait de Fonds (Éditeur)**

```
1️⃣ Éditeur: Dashboard → Mon Solde → Retirer mes revenus

2️⃣ Formulaire de retrait:
   ├─ Montant à retirer
   ├─ Commission 20% déduite automatiquement
   ├─ Calculateur temps réel:
   │   └─ Montant net = montant - (montant × 0.20)
   ├─ Méthode de paiement:
   │   ├─ Virement bancaire (IBAN requis)
   │   └─ PayPal (email requis)
   └─ Informations bancaires:
       └─ Component: PublisherPaymentSettings.tsx
           ├─ IBAN / RIB
           ├─ SWIFT / BIC
           └─ Email PayPal

3️⃣ Soumission
   └─ INSERT INTO balance_requests:
       ├─ type = 'withdraw'
       ├─ amount = montant_brut
       ├─ net_amount = montant_net (après commission)
       ├─ status = 'pending'
       ├─ payment_method = choix
       └─ publisher_payment_info = infos bancaires

4️⃣ Admin valide
   ├─ Vérification des infos bancaires
   ├─ Traitement du paiement externe
   └─ Approve:
       ├─ INSERT INTO credit_transactions:
       │   ├─ type = 'withdrawal'
       │   └─ amount = montant_brut
       ├─ UPDATE users SET balance = balance - montant_brut
       └─ Notification éditeur

✅ Résultat: Fonds transférés vers compte bancaire/PayPal
```

---

## 📧 **SYSTÈME DE NOTIFICATIONS & EMAILS**

### **Architecture Email (Brevo)**

```
┌──────────────────────────────────────────────────────────────┐
│  EMAILS TRANSACTIONNELS (Brevo)                              │
├──────────────────────────────────────────────────────────────┤
│  Template                │ Déclencheur                        │
│──────────────────────────┼────────────────────────────────────│
│  EMAIL_VERIFICATION      │ Nouvelle inscription               │
│  EDITOR_WELCOME          │ Inscription éditeur                │
│  ADVERTISER_WELCOME      │ Inscription annonceur              │
│  EDITOR_NEW_REQUEST      │ Nouvelle demande reçue             │
│  REQUEST_ACCEPTED        │ Demande acceptée                   │
│  REQUEST_REJECTED        │ Demande rejetée                    │
│  BALANCE_UPDATED         │ Solde modifié                      │
│  PAYMENT_RECEIVED        │ Paiement reçu                      │
└──────────────────────────────────────────────────────────────┘
```

**Fichier:** `src/utils/emailServiceClient.ts`

### **Notifications In-App**

```
TABLE: notifications
├─ user_id           → Destinataire
├─ type              → Type de notification
├─ message           → Texte du message
├─ action_type       → Type d'action
├─ action_id         → ID de l'objet concerné
├─ is_read           → Lu ou non
└─ created_at        → Date

Component: Header.tsx
└─ Badge sur l'icône cloche
    └─ Compte des notifications non lues
        └─ Real-time updates via Supabase
```

---

## 🔄 **SYSTÈME D'ÉCHANGE D'AVIS**

```
┌──────────────────────────────────────────────────────────────┐
│  SYSTÈME D'ÉCHANGE D'AVIS Google My Business & Trustpilot    │
└──────────────────────────────────────────────────────────────┘

Concept: Échange 1 pour 1 avec commission 1 crédit

1️⃣ Créer une demande d'avis (Coût: 2 crédits)
   ├─ Platform: Google My Business ou Trustpilot
   ├─ Nom de l'entreprise
   ├─ URL du profil
   └─ Instructions optionnelles

2️⃣ Demande dans le pool
   └─ Status: available
   └─ Expire après 7 jours si non prise

3️⃣ Autre utilisateur prend la demande
   └─ Status: in_progress
   └─ 24h pour laisser l'avis

4️⃣ Reviewer laisse l'avis
   ├─ Upload screenshot
   ├─ Copie du texte de l'avis
   └─ Status: pending_validation

5️⃣ Demandeur valide
   ├─ Vérifie que l'avis est bien visible
   └─ Si OK:
       ├─ Status: completed
       ├─ Reviewer: +1 crédit
       └─ Demandeur: +1 avis reçu
   └─ Si KO:
       ├─ Status: rejected
       └─ Demandeur remboursé (2 crédits)

Tables:
├─ review_exchange_requests     → Demandes d'avis
├─ review_exchange_credits      → Crédits des utilisateurs
└─ review_exchange_transactions → Historique

Component: ReviewExchangeDashboard.tsx
```

---

## 🎛️ **DASHBOARD ADMIN**

```
┌──────────────────────────────────────────────────────────────┐
│  FONCTIONNALITÉS ADMIN (/admin)                              │
├──────────────────────────────────────────────────────────────┤
│  1. Gestion des Utilisateurs                                 │
│     └─ UsersManagement.tsx                                   │
│         ├─ Liste de tous les utilisateurs                     │
│         ├─ Filtres par rôle                                   │
│         ├─ Modifier solde                                     │
│         └─ Suspendre / Activer compte                         │
│                                                               │
│  2. Gestion des Sites Web                                    │
│     └─ WebsitesManagement.tsx                                │
│         ├─ Valider nouveaux sites                             │
│         ├─ Vérifier métriques SEO                             │
│         └─ Approuver / Rejeter                                │
│                                                               │
│  3. Demandes de Balance                                      │
│     └─ BalanceRequestsManagement.tsx                         │
│         ├─ Ajouts de fonds (annonceurs)                       │
│         ├─ Retraits (éditeurs)                                │
│         ├─ Vérifier justificatifs                             │
│         └─ Approuver / Rejeter avec notes                     │
│                                                               │
│  4. Transactions                                             │
│     └─ TransactionsManagement.tsx                            │
│         ├─ Historique complet                                 │
│         ├─ Filtres avancés                                    │
│         └─ Export CSV                                         │
│                                                               │
│  5. Demandes d'Achat                                         │
│     └─ PurchaseRequestsManagement.tsx                        │
│         ├─ Toutes les demandes                                │
│         ├─ Résoudre litiges                                   │
│         └─ Statistiques                                       │
│                                                               │
│  6. Services                                                 │
│     └─ ServicesManagement.tsx                                │
│         ├─ Créer/Modifier services                            │
│         └─ Gérer demandes de services                         │
│                                                               │
│  7. Blog                                                     │
│     └─ BlogForm.tsx / BlogList.tsx                           │
│         ├─ Créer articles                                     │
│         ├─ Éditeur WYSIWYG                                    │
│         └─ Publier / Dépublier                                │
│                                                               │
│  8. Paramètres Plateforme                                   │
│     └─ PlatformSettings.tsx                                  │
│         ├─ Commission rate (%)                                │
│         ├─ Limites (sites par user, etc.)                     │
│         └─ Mode maintenance                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 **STATISTIQUES & MÉTRIQUES**

### **Pour la Plateforme**

```
KPIs suivis:
├─ Nombre d'utilisateurs (annonceurs vs éditeurs)
├─ Nombre de sites web actifs
├─ Nombre de liens disponibles
├─ Nombre de demandes (pending, accepted, rejected)
├─ Volume de transactions
├─ Commission totale générée
├─ Taux de conversion
└─ Satisfaction utilisateur (reviews)
```

### **Analytics Frontend**

```
File: src/utils/analytics.ts

Fonctions:
├─ trackPageView(path, title)
├─ trackUserSignup()
├─ trackLinkPurchase(amount, linkId)
├─ trackSearchQuery(query)
└─ trackCustomEvent(category, action, label)

Intégrations:
├─ Google Analytics 4 (GA4)
└─ Google Tag Manager
```

---

## 🔐 **SÉCURITÉ**

### **Row Level Security (RLS)**

```
Exemples de policies:

users:
├─ SELECT: Tous peuvent voir tous les profils
├─ INSERT: Uniquement via trigger handle_new_user()
├─ UPDATE: Utilisateur peut modifier son propre profil
└─ DELETE: Aucun (soft delete via status)

link_purchase_requests:
├─ SELECT: Annonceur voit ses demandes OU éditeur voit ses demandes
├─ INSERT: Annonceur authentifié peut créer
├─ UPDATE: Annonceur ou éditeur concerné peut modifier
└─ DELETE: Uniquement admin

credit_transactions:
├─ SELECT: User voit uniquement ses transactions
├─ INSERT: Système via triggers uniquement
├─ UPDATE: Aucun (immutable)
└─ DELETE: Aucun
```

### **Authentification**

```
Supabase Auth:
├─ Email/Password (principal)
├─ JWT tokens
├─ Session management
├─ Email verification
└─ Password reset
```

---

## 🚀 **DÉPLOIEMENT**

### **Frontend**

```
Build: npm run build
└─ Génère dossier dist/
    ├─ index.html
    ├─ assets/
    └─ sitemap.xml

Hébergement:
├─ Netlify (recommandé)
│   └─ Déploiement automatique depuis GitHub
│   └─ Build command: npm run build
│   └─ Publish directory: dist
│
└─ Vercel (alternatif)
    └─ Même configuration
```

### **Backend (Supabase)**

```
Configuration:
├─ Project: lqldqgbpaxqaazfjzlsz
├─ Region: Europe (proche Maroc)
├─ Plan: Pro (recommandé pour production)
└─ Database: PostgreSQL 15

Migrations:
└─ supabase/migrations/
    └─ Fichiers SQL numérotés
    └─ Application via Supabase CLI ou Dashboard

Variables d'environnement:
├─ VITE_SUPABASE_URL
├─ VITE_SUPABASE_ANON_KEY
└─ SUPABASE_SERVICE_ROLE_KEY (backend uniquement)
```

---

## 📝 **CONCLUSION**

### **Points Forts de l'Architecture**

✅ **Séparation claire Frontend/Backend**
✅ **Base de données bien structurée**
✅ **RLS pour la sécurité**
✅ **Triggers pour l'automatisation**
✅ **Système de paiement robuste**
✅ **Notifications multi-canaux**
✅ **Scalable et maintenable**

### **Améliorations Possibles**

💡 **Tests automatisés** (Jest, Cypress)
💡 **Monitoring** (Sentry pour erreurs)
💡 **Cache** (Redis pour performances)
💡 **CDN** pour assets statiques
💡 **Rate limiting** API
💡 **Backup automatique** base de données

---

## 📞 **SUPPORT TECHNIQUE**

Pour toute question sur l'architecture ou le code:
📧 contact@authority.ma

---

**Dernière mise à jour:** 7 janvier 2025
**Version:** 2.0.0
**Auteur:** Authority.ma Team 🇲🇦
