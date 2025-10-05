# 🌟 GUIDE COMPLET - Système d'Échange d'Avis

**Date** : 2025-01-07  
**Nouvelle fonctionnalité** : Échange d'avis Google My Business & Trustpilot

---

## 🎯 CONCEPT

### Système ultra-simple : 1 pour 1
```
Tu laisses 1 avis → Tu gagnes 1 crédit → Tu peux demander 1 avis
```

### Commission plateforme
```
Demander 1 avis = -2 crédits
├─ 1 crédit → Pour celui qui laisse l'avis
└─ 1 crédit → Commission Back.ma

Laisser 1 avis = +1 crédit
└─ Peut servir à demander 0.5 avis (besoin de 2)
```

---

## 📊 TABLES CRÉÉES

### 1. review_exchange_requests
Toutes les demandes d'avis

### 2. review_exchange_credits  
Solde de crédits de chaque utilisateur

### 3. review_exchange_transactions
Historique des crédits gagnés/dépensés

---

## 🚀 INSTALLATION

### Étape 1 : Migration SQL
```
1. Allez sur https://supabase.com/dashboard
2. SQL Editor
3. Copiez le contenu de: supabase/migrations/20250107000001_create_review_exchange_system.sql
4. RUN
5. ✅ Tables créées !
```

### Étape 2 : Redémarrer le serveur
```bash
# Arrêter npm run dev (Ctrl+C)
npm run dev
```

### Étape 3 : Tester
```
http://localhost:5175/dashboard/review-exchange
```

---

## 🎨 FONCTIONNALITÉS

### Pour TOUS les utilisateurs (Annonceurs + Éditeurs)

#### 1. Voir mes crédits
- Solde actuel
- Avis donnés / Avis reçus
- Historique

#### 2. Demander un avis (-2 crédits)
- Google My Business OU Trustpilot
- Nom et URL du business
- Instructions optionnelles

#### 3. Laisser un avis (+1 crédit)
- Voir demandes disponibles
- Prendre une demande
- Laisser l'avis
- Upload preuve
- Gagner 1 crédit

#### 4. Valider les avis reçus
- Voir les avis soumis
- Valider ou rejeter
- Créditer le reviewer si validé

---

## 💡 UTILISATION

### Cas d'usage 1 : Nouveau utilisateur
```
1. S'inscrit → 4 crédits gratuits
2. Peut demander 2 avis immédiatement
3. Après, doit laisser des avis pour en recevoir
```

### Cas d'usage 2 : Obtenir 10 avis
```
Besoin: 10 avis Google
Coût: 20 crédits (10 x 2)

Solution A: Laisser 20 avis pour d'autres
Solution B: Laisser 10 avis + acheter 10 crédits (si monétisation)
Solution C: Mix des deux
```

---

## ✅ PROCHAINES AMÉLIORATIONS

### Court terme
- [ ] Upload direct d'images (pas juste URL)
- [ ] Filtres par catégorie
- [ ] Notifications par email

### Moyen terme
- [ ] Système de rating des reviewers
- [ ] Badges et gamification
- [ ] Achat de crédits

---

**🎉 SYSTÈME PRÊT À UTILISER !**
