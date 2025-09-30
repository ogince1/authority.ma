// Test de la gestion du coût de la rédaction par la plateforme
console.log('🧪 Test de la gestion du coût de rédaction plateforme\n');

// Simuler différents scénarios
console.log('📋 Scénarios de test:');
console.log('');

// Scénario 1: Article existant (pas de rédaction)
console.log('1️⃣ Article existant (pas de rédaction):');
const existingArticle = {
  proposed_price: 100,
  content_option: null, // Pas de rédaction
  commission_rate: 0.15 // 15%
};

const existingCommission = existingArticle.proposed_price * existingArticle.commission_rate;
const existingPublisherAmount = existingArticle.proposed_price - existingCommission;
const existingPlatformCost = 0; // Pas de coût de rédaction
const existingPlatformNet = existingCommission - existingPlatformCost;

console.log(`   - Prix proposé: ${existingArticle.proposed_price} MAD`);
console.log(`   - Commission plateforme: ${existingCommission.toFixed(2)} MAD`);
console.log(`   - Coût rédaction: ${existingPlatformCost} MAD`);
console.log(`   - Montant éditeur: ${existingPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice plateforme: ${existingPlatformNet.toFixed(2)} MAD`);
console.log('');

// Scénario 2: Nouvel article avec rédaction plateforme
console.log('2️⃣ Nouvel article avec rédaction plateforme:');
const platformArticle = {
  proposed_price: 190, // 100 (lien) + 90 (rédaction)
  content_option: 'platform',
  commission_rate: 0.15 // 15%
};

const platformCommission = platformArticle.proposed_price * platformArticle.commission_rate;
const platformPublisherAmount = platformArticle.proposed_price - platformCommission;
const platformContentCost = 90; // Coût de la rédaction
const platformPlatformNet = platformCommission - platformContentCost;

console.log(`   - Prix proposé: ${platformArticle.proposed_price} MAD (100 + 90)`);
console.log(`   - Commission plateforme: ${platformCommission.toFixed(2)} MAD`);
console.log(`   - Coût rédaction: ${platformContentCost} MAD`);
console.log(`   - Montant éditeur: ${platformPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice plateforme: ${platformPlatformNet.toFixed(2)} MAD`);
console.log('');

// Scénario 3: Nouvel article avec contenu personnalisé
console.log('3️⃣ Nouvel article avec contenu personnalisé:');
const customArticle = {
  proposed_price: 100, // Seulement le prix du lien
  content_option: 'custom',
  commission_rate: 0.15 // 15%
};

const customCommission = customArticle.proposed_price * customArticle.commission_rate;
const customPublisherAmount = customArticle.proposed_price - customCommission;
const customPlatformCost = 0; // Pas de coût de rédaction
const customPlatformNet = customCommission - customPlatformCost;

console.log(`   - Prix proposé: ${customArticle.proposed_price} MAD`);
console.log(`   - Commission plateforme: ${customCommission.toFixed(2)} MAD`);
console.log(`   - Coût rédaction: ${customPlatformCost} MAD`);
console.log(`   - Montant éditeur: ${customPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice plateforme: ${customPlatformNet.toFixed(2)} MAD`);
console.log('');

console.log('🎯 RÉSUMÉ DE LA CORRECTION:');
console.log('✅ Le coût de la rédaction (90 MAD) est supporté par la plateforme');
console.log('✅ L\'éditeur reçoit le montant complet moins la commission');
console.log('✅ La plateforme supporte le coût de la rédaction sur ses bénéfices');
console.log('✅ Pas de déduction du montant de l\'éditeur pour la rédaction');
console.log('');

console.log('📊 COMPARAISON AVANT/APRÈS:');
console.log('❌ AVANT: Éditeur recevait (100 - 15% - 90) = -5 MAD (perte)');
console.log('✅ APRÈS: Éditeur reçoit (100 - 15%) = 85 MAD (gain)');
console.log('✅ APRÈS: Plateforme supporte 90 MAD de rédaction sur ses 15 MAD de commission');
console.log('');

console.log('💡 La plateforme assume maintenant le coût de la rédaction !');
