# 🧪 Guide de Test Complet - Processus Campagne → Achat Backlink

## 🎯 Objectif
Tester le processus complet de création de campagne jusqu'à l'achat de backlink via l'interface web de votre application.

## 📋 Prérequis
- ✅ Application démarrée sur http://localhost:5176/
- ✅ Base de données Supabase connectée
- ✅ Données de test disponibles (2 sites web, 1 annonce de lien)

## 🚀 Processus de Test Complet

### Étape 1: Création d'un Compte Annonceur
1. **Ouvrez votre navigateur** sur http://localhost:5176/
2. **Cliquez sur "S'inscrire"** ou "Créer un compte"
3. **Remplissez le formulaire** :
   - Email: `test-annonceur@example.com`
   - Mot de passe: `password123`
   - Nom: `Test Annonceur`
   - Rôle: `Annonceur`
4. **Validez l'inscription**
5. **Vérifiez** que vous êtes connecté et redirigé vers le dashboard

### Étape 2: Création d'une Campagne
1. **Accédez au dashboard annonceur**
2. **Cliquez sur "Créer une campagne"** ou "Nouvelle campagne"
3. **Remplissez les informations** :
   - Nom: `Campagne Test SEO`
   - URL cible: `https://example.com`
   - Mots-clés: `SEO, référencement, backlinks`
   - Langue: `Français`
   - Budget: `500 MAD`
   - Description: `Campagne de test pour acheter des backlinks de qualité`
4. **Sauvegardez la campagne**
5. **Vérifiez** que la campagne apparaît dans votre liste

### Étape 3: Parcours des Annonces de Liens
1. **Naviguez vers "Annonces de liens"** ou "Marketplace"
2. **Explorez les annonces disponibles** :
   - Vous devriez voir l'annonce "https://leplombier.ma/reparation-fuite-deau-24h-7j/"
   - Prix: 100 MAD
   - Type: dofollow
   - Site: Leplombier
3. **Cliquez sur une annonce** pour voir les détails
4. **Vérifiez** les informations du site (métriques, catégorie, etc.)

### Étape 4: Demande d'Achat de Lien
1. **Sur la page de l'annonce**, cliquez sur **"Acheter ce lien"**
2. **Remplissez le formulaire de demande** :
   - URL de destination: `https://example.com`
   - Texte d'ancrage: `référencement SEO`
   - Message: `Bonjour, je souhaite acheter ce lien pour ma campagne SEO. Pouvez-vous me confirmer la disponibilité ?`
   - Prix proposé: `100 MAD`
   - Durée: `12 mois`
3. **Soumettez la demande**
4. **Vérifiez** que la demande est créée et en attente

### Étape 5: Création d'un Compte Éditeur
1. **Déconnectez-vous** de l'annonceur
2. **Créez un nouveau compte** :
   - Email: `test-editeur@example.com`
   - Mot de passe: `password123`
   - Nom: `Test Éditeur`
   - Rôle: `Éditeur`
3. **Connectez-vous** avec le nouveau compte

### Étape 6: Gestion des Demandes (Côté Éditeur)
1. **Accédez au dashboard éditeur**
2. **Naviguez vers "Demandes d'achat"** ou "Messages"
3. **Vous devriez voir** la demande de l'annonceur
4. **Cliquez sur la demande** pour voir les détails
5. **Acceptez la demande** :
   - Cliquez sur "Accepter"
   - Ajoutez une réponse: `Parfait ! Je peux placer votre lien. Voici l'URL où il sera placé : https://leplombier.ma/guide-seo/`
   - URL de placement: `https://leplombier.ma/guide-seo/`
6. **Confirmez l'acceptation**

### Étape 7: Processus de Paiement
1. **Retournez sur le compte annonceur**
2. **Vérifiez** que la demande est marquée comme "Acceptée"
3. **Ajoutez des fonds** à votre compte (si nécessaire)
4. **Initiez le paiement** :
   - Cliquez sur "Payer maintenant"
   - Vérifiez le montant (100 MAD + commission)
   - Confirmez le paiement
5. **Vérifiez** que la transaction est complétée

### Étape 8: Vérification des Notifications
1. **Côté annonceur** :
   - Vérifiez les notifications de confirmation
   - Vérifiez l'historique des transactions
2. **Côté éditeur** :
   - Vérifiez les notifications de paiement
   - Vérifiez le crédit sur le compte

### Étape 9: Test de la Messagerie
1. **Envoyez un message** de l'annonceur à l'éditeur
2. **Répondez** depuis le compte éditeur
3. **Vérifiez** que la conversation fonctionne

## 📊 Points de Vérification

### ✅ Fonctionnalités à Tester
- [ ] Inscription/Connexion utilisateurs
- [ ] Création de campagnes
- [ ] Parcours des annonces de liens
- [ ] Demande d'achat de lien
- [ ] Acceptation par l'éditeur
- [ ] Processus de paiement
- [ ] Notifications
- [ ] Messagerie
- [ ] Gestion des soldes
- [ ] Historique des transactions

### 🔍 Données à Vérifier
- [ ] Campagne créée dans la base de données
- [ ] Demande d'achat enregistrée
- [ ] Transaction de paiement créée
- [ ] Soldes mis à jour
- [ ] Notifications générées
- [ ] Messages échangés

## 🚨 Problèmes Potentiels

### Problème: "Politique RLS"
- **Cause**: Row Level Security empêche certaines opérations
- **Solution**: Vérifiez les politiques dans Supabase Dashboard

### Problème: "Solde insuffisant"
- **Cause**: L'annonceur n'a pas assez de fonds
- **Solution**: Ajoutez des fonds via le système de crédit

### Problème: "Demande non trouvée"
- **Cause**: Problème de permissions ou de données
- **Solution**: Vérifiez les IDs des utilisateurs et des demandes

## 📈 Résultats Attendus

### Après le Test Complet
- ✅ 2 utilisateurs créés (annonceur + éditeur)
- ✅ 1 campagne créée
- ✅ 1 demande d'achat soumise
- ✅ 1 demande acceptée
- ✅ 1 transaction de paiement
- ✅ Notifications générées
- ✅ Messages échangés
- ✅ Soldes mis à jour

## 🎉 Conclusion

Si tous les tests passent, votre plateforme Back.ma est entièrement fonctionnelle et prête pour les utilisateurs réels !

### Prochaines Étapes
1. **Testez avec de vrais utilisateurs**
2. **Ajoutez plus de contenu** (sites web, annonces)
3. **Configurez les paiements** (PayPal, Stripe)
4. **Optimisez les performances**
5. **Déployez en production**

---

**🚀 Votre plateforme est prête à révolutionner l'achat de backlinks au Maroc !**
