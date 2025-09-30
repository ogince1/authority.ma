// Test de la logique finale pour la commission
console.log('🧪 Test de la logique finale pour la commission\n');

console.log('📋 LOGIQUE FINALE:');
console.log('   ✅ La commission est calculée UNIQUEMENT sur le prix du lien');
console.log('   ✅ La rédaction (90 MAD) est un bénéfice pur pour la plateforme');
console.log('   ✅ L\'éditeur reçoit le prix du lien moins la commission');
console.log('');

// Scénario 1: Article existant (pas de rédaction)
console.log('1️⃣ Article existant (pas de rédaction):');
const existingArticle = {
  proposed_price: 100,
  content_option: null,
  commission_rate: 0.15
};

const existingLinkPrice = existingArticle.proposed_price; // 100 MAD
const existingCommission = existingLinkPrice * existingArticle.commission_rate; // 15 MAD
const existingPublisherAmount = existingLinkPrice - existingCommission; // 85 MAD
const existingPlatformRevenue = 0; // Pas de bénéfice de rédaction
const existingPlatformNet = existingCommission + existingPlatformRevenue; // 15 MAD

console.log(`   - Prix proposé: ${existingArticle.proposed_price} MAD`);
console.log(`   - Prix du lien: ${existingLinkPrice} MAD`);
console.log(`   - Commission (15% sur lien): ${existingCommission.toFixed(2)} MAD`);
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

const platformLinkPrice = platformArticle.proposed_price - 90; // 100 MAD (prix du lien seul)
const platformCommission = platformLinkPrice * platformArticle.commission_rate; // 15 MAD (15% sur 100)
const platformPublisherAmount = platformLinkPrice - platformCommission; // 85 MAD
const platformContentRevenue = 90; // Bénéfice de la rédaction pour la plateforme
const platformPlatformNet = platformCommission + platformContentRevenue; // 105 MAD

console.log(`   - Prix proposé: ${platformArticle.proposed_price} MAD (100 + 90)`);
console.log(`   - Prix du lien: ${platformLinkPrice} MAD`);
console.log(`   - Commission (15% sur lien): ${platformCommission.toFixed(2)} MAD`);
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

const customLinkPrice = customArticle.proposed_price; // 100 MAD
const customCommission = customLinkPrice * customArticle.commission_rate; // 15 MAD
const customPublisherAmount = customLinkPrice - customCommission; // 85 MAD
const customPlatformRevenue = 0; // Pas de bénéfice de rédaction
const customPlatformNet = customCommission + customPlatformRevenue; // 15 MAD

console.log(`   - Prix proposé: ${customArticle.proposed_price} MAD`);
console.log(`   - Prix du lien: ${customLinkPrice} MAD`);
console.log(`   - Commission (15% sur lien): ${customCommission.toFixed(2)} MAD`);
console.log(`   - Bénéfice rédaction: ${customPlatformRevenue} MAD`);
console.log(`   - Montant éditeur: ${customPublisherAmount.toFixed(2)} MAD`);
console.log(`   - Bénéfice total plateforme: ${customPlatformNet.toFixed(2)} MAD`);
console.log('');

console.log('🎯 RÉSUMÉ DE LA LOGIQUE FINALE:');
console.log('✅ Commission calculée UNIQUEMENT sur le prix du lien');
console.log('✅ La rédaction (90 MAD) est un bénéfice pur pour la plateforme');
console.log('✅ L\'éditeur reçoit le prix du lien moins la commission');
console.log('✅ La plateforme garde la commission + le bénéfice de la rédaction');
console.log('');

console.log('📊 EXEMPLE CONCRET:');
console.log('   Commande: 190 MAD (100 lien + 90 rédaction)');
console.log('   Prix du lien: 100 MAD');
console.log('   Commission: 15 MAD (15% sur 100)');
console.log('   Bénéfice rédaction: 90 MAD (pour la plateforme)');
console.log('   Montant éditeur: 85 MAD (100 - 15)');
console.log('   Bénéfice total plateforme: 105 MAD (15 + 90)');
console.log('');

console.log('💡 La commission est maintenant calculée uniquement sur le prix du lien !');
