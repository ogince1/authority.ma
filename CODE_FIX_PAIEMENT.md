# 🔧 CODE À CORRIGER - Paiement Éditeur

## 📝 INSTRUCTION

**1. Exécute d'abord le SQL :** `FIX_PAIEMENT_EDITEUR.sql` dans Supabase Dashboard

**2. Remplace DEUX fonctions** dans `src/lib/supabase.ts`

---

## ✅ FONCTION 1 : `acceptPurchaseRequest` (ligne ~1966)

**REMPLACER DEPUIS :**
```typescript
    console.log(`💰 Bénéfice total plateforme: ${platformNetAmount.toFixed(2)} MAD`);
    
    await createCreditTransaction({
      user_id: request.publisher_id,
      type: 'commission',
      amount: publisherCommission,
      description: `Commission pour lien: ${request.link_listings?.title}`
    });

    console.log(`💰 Éditeur crédité: ${publisherCommission} MAD pour la demande ${requestId}`);
```

**PAR :**
```typescript
    console.log(`💰 Bénéfice total plateforme: ${platformNetAmount.toFixed(2)} MAD`);
    
    // ✅ ÉTAPE 1: DÉBITER L'ANNONCEUR
    console.log(`💸 Débit annonceur: ${request.proposed_price} MAD`);
    await createCreditTransaction({
      user_id: request.user_id, // Annonceur
      type: 'purchase',
      amount: request.proposed_price,
      description: `Achat de lien: ${request.anchor_text}`,
      related_purchase_request_id: requestId
    });
    
    // ✅ ÉTAPE 2: CRÉDITER L'ÉDITEUR
    console.log(`💰 Crédit éditeur: ${publisherCommission} MAD`);
    await createCreditTransaction({
      user_id: request.publisher_id, // Éditeur
      type: 'commission',
      amount: publisherCommission,
      description: `Commission pour lien: ${request.anchor_text}`,
      related_purchase_request_id: requestId
    });

    console.log(`✅ Paiement effectué: Annonceur débité, Éditeur crédité`);
```

---

## ✅ FONCTION 2 : `acceptPurchaseRequestWithUrl` (ligne ~3793)

**REMPLACER DEPUIS :**
```typescript
    console.log(`💰 Bénéfice total plateforme: ${platformNetAmount.toFixed(2)} MAD`);

    // Créditer l'éditeur avec le montant après commission (sans le bénéfice de la rédaction)
    await createCreditTransaction({
      user_id: request.publisher_id,
      type: 'commission',
      amount: publisherAmount,
      description: `Commission pour lien: ${request.link_listings?.title}`
    });
```

**PAR :**
```typescript
    console.log(`💰 Bénéfice total plateforme: ${platformNetAmount.toFixed(2)} MAD`);

    // ✅ ÉTAPE 1: DÉBITER L'ANNONCEUR
    console.log(`💸 Débit annonceur: ${request.proposed_price} MAD`);
    await createCreditTransaction({
      user_id: request.user_id, // Annonceur
      type: 'purchase',
      amount: request.proposed_price,
      description: `Achat de lien: ${request.anchor_text}`,
      related_purchase_request_id: requestId
    });
    
    // ✅ ÉTAPE 2: CRÉDITER L'ÉDITEUR
    console.log(`💰 Crédit éditeur: ${publisherAmount} MAD`);
    await createCreditTransaction({
      user_id: request.publisher_id, // Éditeur
      type: 'commission',
      amount: publisherAmount,
      description: `Commission pour lien: ${request.anchor_text}`,
      related_purchase_request_id: requestId
    });

    console.log(`✅ Paiement effectué: Annonceur débité, Éditeur crédité`);
```

---

## 🎯 RÉSUMÉ DES CHANGEMENTS

### Avant (❌ BUG):
1. Annonceur n'était JAMAIS débité
2. Éditeur recevait crédit mais système bloquait (solde insuffisant)
3. Type 'commission' traité comme DÉBIT au lieu de CRÉDIT

### Après (✅ FIX):
1. **Annonceur débité** (type: 'purchase') quand éditeur accepte
2. **Éditeur crédité** (type: 'commission') après débit annonceur
3. Type 'commission' maintenant traité comme **CRÉDIT** (via SQL fix)

---

## 🧪 TEST

Après les modifications :

1. Crée une demande d'achat (annonceur avec solde suffisant)
2. Accepte la demande (éditeur)
3. Vérifie :
   - ✅ Annonceur débité
   - ✅ Éditeur crédité
   - ✅ Pas d'erreur "Solde insuffisant"
   - ✅ Notification envoyée

---

📧 Si problème persiste: contact@authority.ma
