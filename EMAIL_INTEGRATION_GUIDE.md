# Guide d'Intégration - Système de Mailing avec Brevo

## 📧 **Vue d'ensemble**

Le système de mailing avec Brevo est maintenant implémenté et prêt à être intégré dans les workflows existants de l'application Back.ma.

## 🔧 **Installation et Configuration**

### 1. Variables d'Environnement
Ajoutez ces variables dans votre fichier `.env` :

```bash
# Brevo Email Service
VITE_BREVO_API_KEY=your_brevo_api_key_here
BREVO_API_KEY=your_brevo_api_key_here

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 2. Installation du Package
```bash
npm install @getbrevo/brevo
```

### 3. Migration de la Base de Données
Exécutez la migration :
```bash
supabase db push
```

## 📁 **Fichiers Créés**

1. **`src/utils/emailService.ts`** - Service principal Brevo
2. **`src/utils/customerJourneyService.ts`** - Gestion du parcours client
3. **`src/hooks/useEmailNotifications.ts`** - Hooks React pour les notifications
4. **`src/components/User/EmailPreferences.tsx`** - Composant de préférences
5. **`supabase/migrations/20250121000060_email_system.sql`** - Tables email

## 🎯 **Points d'Intégration dans l'Application**

### 1. **Inscription Utilisateur**
**Fichier à modifier :** `src/pages/RegisterPage.tsx`

```typescript
import { customerJourneyService } from '../utils/customerJourneyService';

// Dans la fonction de soumission du formulaire d'inscription
const handleSubmit = async (data: RegisterFormData) => {
  try {
    // ... code d'inscription existant ...
    
    // Après l'inscription réussie
    if (user) {
      // Envoyer l'email de bienvenue selon le rôle
      if (data.role === 'publisher') {
        await customerJourneyService.handleEditorWelcome(user.id);
      } else {
        await customerJourneyService.handleAdvertiserWelcome(user.id);
      }
    }
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

### 2. **Approbation de Sites Web**
**Fichier à modifier :** `src/components/Admin/WebsitesManagement.tsx`

```typescript
import { customerJourneyService } from '../../utils/customerJourneyService';

// Dans la fonction d'approbation de site
const handleApproveSite = async (siteId: string, userId: string) => {
  try {
    // ... code d'approbation existant ...
    
    // Envoyer l'email d'approbation
    await customerJourneyService.handleEditorSiteApproved(userId, siteId);
  } catch (error) {
    // ... gestion d'erreur ...
  }
};

// Dans la fonction de rejet de site
const handleRejectSite = async (siteId: string, userId: string, reason: string) => {
  try {
    // ... code de rejet existant ...
    
    // Envoyer l'email de rejet
    await customerJourneyService.handleEditorSiteRejected(userId, siteId, reason);
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

### 3. **Nouvelles Demandes de Liens**
**Fichier à modifier :** `src/lib/supabase.ts`

```typescript
import { customerJourneyService } from '../utils/customerJourneyService';

// Dans la fonction createLinkPurchaseRequest
export const createLinkPurchaseRequest = async (requestData: LinkPurchaseRequestData) => {
  try {
    // ... code de création existant ...
    
    // Envoyer l'email de nouvelle demande à l'éditeur
    if (publisherId) {
      await customerJourneyService.handleEditorNewRequest(publisherId, newRequest.id);
    }
    
    return newRequest;
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

### 4. **Passage de Commande**
**Fichier à modifier :** `src/components/Cart/CartPage.tsx`

```typescript
import { customerJourneyService } from '../../utils/customerJourneyService';

// Dans la fonction processPurchases
const processPurchases = async () => {
  try {
    // ... code de traitement existant ...
    
    // Envoyer l'email de commande passée
    const orderData = {
      total_amount: totalAmount,
      sites_count: cartItems.length
    };
    await customerJourneyService.handleAdvertiserOrderPlaced(user.id, orderId, orderData);
    
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

### 5. **Confirmation de Placement de Lien**
**Fichier à modifier :** `src/lib/supabase.ts`

```typescript
// Dans la fonction confirmLinkPlacement
export const confirmLinkPlacement = async (requestId: string, placedUrl: string) => {
  try {
    // ... code de confirmation existant ...
    
    // Envoyer l'email de lien placé à l'annonceur
    const linkData = {
      site_name: request.link_listing?.website?.name || 'Site',
      link_url: placedUrl,
      anchor_text: request.anchor_text
    };
    await customerJourneyService.handleAdvertiserLinkPlaced(request.user_id, requestId, linkData);
    
    return updatedRequest;
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

### 6. **Paiement Reçu**
**Fichier à modifier :** `src/components/Admin/TransactionsManagement.tsx`

```typescript
import { customerJourneyService } from '../../utils/customerJourneyService';

// Dans la fonction de traitement de paiement
const handleProcessPayment = async (transactionId: string, userId: string, amount: number) => {
  try {
    // ... code de traitement existant ...
    
    // Envoyer l'email de paiement reçu
    await customerJourneyService.handleEditorPaymentReceived(userId, transactionId, amount, 'Site');
    
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

### 7. **Réinitialisation de Mot de Passe**
**Fichier à modifier :** `src/lib/supabase.ts`

```typescript
// Dans la fonction de réinitialisation
export const resetPassword = async (email: string) => {
  try {
    // ... code de réinitialisation existant ...
    
    // Générer le lien de réinitialisation
    const resetUrl = `${process.env.VITE_APP_URL}/reset-password?token=${resetToken}`;
    
    // Envoyer l'email de réinitialisation
    await customerJourneyService.handlePasswordReset(user.id, resetUrl);
    
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

## 🎨 **Intégration dans l'Interface Utilisateur**

### 1. **Ajouter les Préférences Email au Dashboard**
**Fichier à modifier :** `src/components/User/UserLayout.tsx`

```typescript
// Ajouter dans la navigation
const navigation = [
  // ... autres éléments ...
  {
    name: 'Préférences Email',
    href: '/dashboard/email-preferences',
    icon: Mail
  }
];
```

### 2. **Ajouter la Route dans UserDashboardPage**
**Fichier à modifier :** `src/pages/UserDashboardPage.tsx`

```typescript
import EmailPreferences from '../components/User/EmailPreferences';

// Ajouter dans les routes
<Route path="/email-preferences" element={
  <ProtectedRoute>
    <EmailPreferences />
  </ProtectedRoute>
} />
```

### 3. **Ajouter les Notifications dans le Dashboard Admin**
**Fichier à modifier :** `src/components/Admin/AdminLayout.tsx`

```typescript
import { useAdminEmailNotifications } from '../../hooks/useEmailNotifications';

// Dans le composant AdminLayout
const { sendBulkWelcomeEmails } = useAdminEmailNotifications();

// Ajouter des boutons pour envoyer des emails en masse
```

## 📊 **Templates d'Emails Disponibles**

### **Éditeurs :**
- `EDITOR_WELCOME` - Bienvenue éditeur
- `EDITOR_SITE_APPROVED` - Site approuvé
- `EDITOR_SITE_REJECTED` - Site rejeté
- `EDITOR_NEW_REQUEST` - Nouvelle demande
- `EDITOR_PAYMENT_RECEIVED` - Paiement reçu

### **Annonceurs :**
- `ADVERTISER_WELCOME` - Bienvenue annonceur
- `ADVERTISER_ORDER_PLACED` - Commande passée
- `ADVERTISER_LINK_PLACED` - Lien placé
- `ADVERTISER_ORDER_COMPLETED` - Commande terminée

### **Commun :**
- `PASSWORD_RESET` - Réinitialisation mot de passe
- `EMAIL_VERIFICATION` - Vérification email
- `WEEKLY_REPORT` - Rapport hebdomadaire

## 🔍 **Fonctionnalités Avancées**

### 1. **Envoi d'Emails Personnalisés**
```typescript
import { customerJourneyService } from '../utils/customerJourneyService';

// Envoyer un email personnalisé
await customerJourneyService.sendCustomEmail(
  userId,
  'WEEKLY_REPORT',
  {
    period: 'Cette semaine',
    stats: 'Vos statistiques',
    dashboard_url: 'https://back.ma/dashboard'
  }
);
```

### 2. **Envoi en Masse (Admin)**
```typescript
import { useAdminEmailNotifications } from '../hooks/useEmailNotifications';

const { sendBulkWelcomeEmails } = useAdminEmailNotifications();

// Envoyer des emails de bienvenue en masse
await sendBulkWelcomeEmails(['user1', 'user2', 'user3'], 'advertiser');
```

### 3. **Gestion des Préférences**
```typescript
import { useEmailNotifications } from '../hooks/useEmailNotifications';

const { updatePreferences } = useEmailNotifications();

// Mettre à jour les préférences
await updatePreferences({
  welcome_emails: true,
  marketing_emails: false
});
```

## 🚀 **Prochaines Étapes**

1. **Tester l'intégration** avec des utilisateurs de test
2. **Configurer les templates** dans Brevo Dashboard
3. **Personnaliser les designs** des emails
4. **Ajouter des analytics** d'ouverture/clic
5. **Implémenter des workflows** plus complexes

## 📈 **Monitoring et Analytics**

Le système enregistre automatiquement :
- **Historique des emails** envoyés
- **Événements du parcours client**
- **Statistiques d'envoi** (succès/échecs)
- **Préférences utilisateur**

Accédez aux données via les fonctions Supabase :
- `get_email_stats()` - Statistiques des emails
- `get_user_journey_events()` - Événements du parcours
- `cleanup_old_email_history()` - Nettoyage automatique

## ✅ **Checklist d'Intégration**

- [ ] Variables d'environnement configurées
- [ ] Package Brevo installé
- [ ] Migration de base de données exécutée
- [ ] Points d'intégration ajoutés
- [ ] Composant de préférences ajouté
- [ ] Routes configurées
- [ ] Tests effectués
- [ ] Templates Brevo configurés

**Le système de mailing avec Brevo est maintenant prêt à être utilisé !** 🎉
