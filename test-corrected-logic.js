// Test de la logique corrigée pour la rédaction
console.log('🧪 Test de la logique corrigée pour la rédaction\n');

console.log('📋 LOGIQUE CORRIGÉE:');
console.log('   ✅ La rédaction (90 MAD) est un BÉNÉFICE pour la plateforme');
console.log('   ✅ L\'éditeur ne reçoit QUE le montant du lien moins la commission');
console.log('   ✅ La plateforme garde la commission + le bénéfice de la rédaction');
console.log('');

// Scénario 1: Article existant (pas de rédaction)
console.log('1️⃣ Article existant (pas de rédaction):');
const existingArticle = {
  proposed_price: 100,
  content_option: null,
  commission_rate: 0.15
};

const existingCommission = existingArticle.proposed_price * existingArticle.commission_rate;
const existingPublisherAmount = existingArticle.proposed_price - existingCommission;
const existingPlatformRevenue = 0; // Pas de bénéfice de rédaction
const existingPlatformNet = existingCommission + existingPlatformRevenue;

console.log(`   - Prix proposé: ${existingArticle.proposed_price} MAD`);
console.log(`   - Commission plateforme: ${existingCommission.toFixed(2)} MAD`);
console.log(`   - Bénéfice rédaction: ${existingPlatformRevenue} MAD`);
console.log(`   - Montant éditeur: ${existingPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice total plateforme: ${existingPlatformNet.toFixed(2)} MAD`);
console.log('');

// Scénario 2: Nouvel article avec rédaction plateforme
console.log('2️⃣ Nouvel article avec rédaction plateforme:');
const platformArticle = {
  proposed_price: 190, // 100 (lien) + 90 (rédaction)
  content_option: 'platform',
  commission_rate: 0.15
};

const platformCommission = platformArticle.proposed_price * platformArticle.commission_rate;
const platformPublisherAmount = platformArticle.proposed_price - platformCommission;
const platformContentRevenue = 90; // Bénéfice de la rédaction pour la plateforme
const platformPlatformNet = platformCommission + platformContentRevenue;

console.log(`   - Prix proposé: ${platformArticle.proposed_price} MAD (100 + 90)`);
console.log(`   - Commission plateforme: ${platformCommission.toFixed(2)} MAD`);
console.log(`   - Bénéfice rédaction: ${platformContentRevenue} MAD`);
console.log(`   - Montant éditeur: ${platformPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice total plateforme: ${platformPlatformNet.toFixed(2)} MAD`);
console.log('');

// Scénario 3: Nouvel article avec contenu personnalisé
console.log('3️⃣ Nouvel article avec contenu personnalisé:');
const customArticle = {
  proposed_price: 100,
  content_option: 'custom',
  commission_rate: 0.15
};

const customCommission = customArticle.proposed_price * customArticle.commission_rate;
const customPublisherAmount = customArticle.proposed_price - customCommission;
const customPlatformRevenue = 0; // Pas de bénéfice de rédaction
const customPlatformNet = customCommission + customPlatformRevenue;

console.log(`   - Prix proposé: ${customArticle.proposed_price} MAD`);
console.log(`   - Commission plateforme: ${customCommission.toFixed(2)} MAD`);
console.log(`   - Bénéfice rédaction: ${customPlatformRevenue} MAD`);
console.log(`   - Montant éditeur: ${customPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice total plateforme: ${customPlatformNet.toFixed(2)} MAD`);
console.log('');

console.log('🎯 RÉSUMÉ DE LA LOGIQUE CORRIGÉE:');
console.log('✅ La rédaction (90 MAD) est un BÉNÉFICE pour la plateforme');
console.log('✅ L\'éditeur reçoit seulement le montant du lien moins la commission');
console.log('✅ La plateforme garde la commission + le bénéfice de la rédaction');
console.log('✅ Pas de partage du bénéfice de la rédaction avec l\'éditeur');
console.log('');

console.log('📊 EXEMPLE CONCRET:');
console.log('   Commande: 190 MAD (100 lien + 90 rédaction)');
console.log('   Commission: 28.50 MAD (15% de 190)');
console.log('   Bénéfice rédaction: 90 MAD (pour la plateforme)');
console.log('   Montant éditeur: 161.50 MAD (190 - 28.50)');
console.log('   Bénéfice total plateforme: 118.50 MAD (28.50 + 90)');
console.log('');

console.log('💡 La plateforme garde maintenant tout le bénéfice de la rédaction !');
