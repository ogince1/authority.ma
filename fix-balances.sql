-- Script pour corriger les soldes après le bug d'achat rapide
-- Date: 2025-01-21
-- Problème: L'annonceur était débité lors de l'achat rapide, puis crédité à nouveau lors de la confirmation

-- 1. Identifier les transactions d'achat problématiques
SELECT 
  ct.user_id,
  u.email,
  ct.amount,
  ct.balance_before,
  ct.balance_after,
  ct.created_at,
  ct.description
FROM credit_transactions ct
JOIN users u ON ct.user_id = u.id
WHERE ct.type = 'purchase' 
  AND ct.created_at > '2025-01-21'
  AND ct.description LIKE '%Achat rapide%'
ORDER BY ct.created_at DESC;

-- 2. Corriger les soldes des annonceurs (rembourser les débits incorrects)
-- L'annonceur abderrahimmolatefpro@gmail.com a été débité incorrectement
-- Il devrait avoir son solde original + les montants qu'il a payés lors des confirmations

-- Calculer le montant total des débits incorrects pour cet annonceur
SELECT 
  SUM(ct.amount) as total_debited_incorrectly
FROM credit_transactions ct
WHERE ct.user_id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb'
  AND ct.type = 'purchase' 
  AND ct.created_at > '2025-01-21'
  AND ct.description LIKE '%Achat rapide%';

-- Rembourser l'annonceur (remettre les montants débités incorrectement)
UPDATE users 
SET balance = balance + (
  SELECT COALESCE(SUM(ct.amount), 0)
  FROM credit_transactions ct
  WHERE ct.user_id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb'
    AND ct.type = 'purchase' 
    AND ct.created_at > '2025-01-21'
    AND ct.description LIKE '%Achat rapide%'
)
WHERE id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb';

-- 3. Créditer les éditeurs pour les demandes confirmées
-- L'éditeur ogincema@gmail.com devrait recevoir les montants des demandes confirmées

-- Calculer le montant total que l'éditeur devrait recevoir
SELECT 
  SUM(lpr.proposed_price * 0.9) as total_should_receive -- 90% après commission de 10%
FROM link_purchase_requests lpr
WHERE lpr.publisher_id = '187fba7a-38bf-4280-a069-656240b1c630'
  AND lpr.status = 'confirmed'
  AND lpr.created_at > '2025-01-21';

-- Créditer l'éditeur
UPDATE users 
SET balance = balance + (
  SELECT COALESCE(SUM(lpr.proposed_price * 0.9), 0) -- 90% après commission de 10%
  FROM link_purchase_requests lpr
  WHERE lpr.publisher_id = '187fba7a-38bf-4280-a069-656240b1c630'
    AND lpr.status = 'confirmed'
    AND lpr.created_at > '2025-01-21'
)
WHERE id = '187fba7a-38bf-4280-a069-656240b1c630';

-- 4. Vérifier les soldes après correction
SELECT 
  u.email,
  u.role,
  u.balance,
  CASE 
    WHEN u.id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb' THEN 'Annonceur corrigé'
    WHEN u.id = '187fba7a-38bf-4280-a069-656240b1c630' THEN 'Éditeur crédité'
    ELSE 'Autre'
  END as status
FROM users u
WHERE u.id IN ('b1ece838-8fa7-4959-9ae1-7d5e152451cb', '187fba7a-38bf-4280-a069-656240b1c630')
ORDER BY u.role, u.email;

-- 5. Créer des transactions de crédit pour documenter les corrections
INSERT INTO credit_transactions (
  user_id,
  type,
  amount,
  description,
  currency,
  status,
  balance_before,
  balance_after,
  created_at,
  completed_at
) 
SELECT 
  'b1ece838-8fa7-4959-9ae1-7d5e152451cb',
  'refund',
  SUM(ct.amount),
  'Remboursement - Correction bug achat rapide',
  'MAD',
  'completed',
  (SELECT balance FROM users WHERE id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb') - SUM(ct.amount),
  (SELECT balance FROM users WHERE id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb'),
  NOW(),
  NOW()
FROM credit_transactions ct
WHERE ct.user_id = 'b1ece838-8fa7-4959-9ae1-7d5e152451cb'
  AND ct.type = 'purchase' 
  AND ct.created_at > '2025-01-21'
  AND ct.description LIKE '%Achat rapide%';

INSERT INTO credit_transactions (
  user_id,
  type,
  amount,
  description,
  currency,
  status,
  balance_before,
  balance_after,
  created_at,
  completed_at
) 
SELECT 
  '187fba7a-38bf-4280-a069-656240b1c630',
  'deposit',
  SUM(lpr.proposed_price * 0.9),
  'Crédit - Correction bug achat rapide',
  'MAD',
  'completed',
  (SELECT balance FROM users WHERE id = '187fba7a-38bf-4280-a069-656240b1c630') - SUM(lpr.proposed_price * 0.9),
  (SELECT balance FROM users WHERE id = '187fba7a-38bf-4280-a069-656240b1c630'),
  NOW(),
  NOW()
FROM link_purchase_requests lpr
WHERE lpr.publisher_id = '187fba7a-38bf-4280-a069-656240b1c630'
  AND lpr.status = 'confirmed'
  AND lpr.created_at > '2025-01-21';
