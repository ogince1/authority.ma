import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Politique de Confidentialité - Back.ma"
        description="Découvrez comment Back.ma protège vos données personnelles. Politique de confidentialité conforme au RGPD et à la loi marocaine. Transparence totale sur l'utilisation de vos informations."
        keywords="politique confidentialité, protection données, RGPD, vie privée, Back.ma, données personnelles, sécurité information"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Politique de Confidentialité
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-green-100 max-w-3xl mx-auto"
            >
              Votre vie privée est notre priorité. Découvrez comment nous protégeons vos données.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="prose prose-lg max-w-none"
          >
            <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
              <p className="text-green-800 font-medium">
                <strong>Dernière mise à jour :</strong> 21 janvier 2025
              </p>
              <p className="text-green-700 text-sm mt-2">
                Cette politique de confidentialité explique comment Back.ma collecte, utilise et protège vos informations personnelles 
                conformément au RGPD et à la loi marocaine sur la protection des données.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction</h2>
            <div className="space-y-4 mb-8">
              <p>
                Back.ma s'engage à protéger votre vie privée et vos données personnelles. Cette politique explique comment nous 
                collectons, utilisons, stockons et protégeons vos informations lorsque vous utilisez notre plateforme de netlinking.
              </p>
              <p>
                En utilisant Back.ma, vous acceptez les pratiques décrites dans cette politique de confidentialité.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Responsable du Traitement</h2>
            <div className="space-y-4 mb-8">
              <p><strong>Back.ma</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Adresse : Casablanca, Maroc</li>
                <li>Email : privacy@back.ma</li>
                <li>Téléphone : +212 5 20 23 23 75</li>
                <li>Représentant légal : [Nom du représentant]</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Données Collectées</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Données d'Identification</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Adresse postale</li>
                <li>Date de naissance (si applicable)</li>
                <li>Informations de facturation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Données Professionnelles</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nom de l'entreprise</li>
                <li>Secteur d'activité</li>
                <li>Site web</li>
                <li>Informations sur les sites proposés (pour les éditeurs)</li>
                <li>Métriques SEO (DR, TF, CF, trafic)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.3 Données Techniques</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Système d'exploitation</li>
                <li>Pages visitées</li>
                <li>Durée de session</li>
                <li>Cookies et technologies similaires</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.4 Données de Transaction</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Historique des achats et ventes</li>
                <li>Informations de paiement (sécurisées)</li>
                <li>Montants des transactions</li>
                <li>Méthodes de paiement utilisées</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Finalités du Traitement</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Finalités Principales</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fourniture des services de netlinking</li>
                <li>Gestion des comptes utilisateurs</li>
                <li>Facilitation des transactions</li>
                <li>Communication avec les utilisateurs</li>
                <li>Support technique et commercial</li>
                <li>Vérification de l'identité et de la qualité</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Finalités Secondaires</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Amélioration des services</li>
                <li>Analyse statistique anonymisée</li>
                <li>Marketing et communication (avec consentement)</li>
                <li>Prévention de la fraude</li>
                <li>Respect des obligations légales</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Base Légale du Traitement</h2>
            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Exécution du Contrat</h4>
                <p className="text-blue-700 text-sm">Traitement nécessaire à l'exécution du contrat de service avec l'utilisateur.</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Intérêt Légitime</h4>
                <p className="text-green-700 text-sm">Amélioration des services, prévention de la fraude, sécurité de la plateforme.</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Consentement</h4>
                <p className="text-purple-700 text-sm">Marketing, cookies non essentiels, communications promotionnelles.</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Obligation Légale</h4>
                <p className="text-orange-700 text-sm">Respect des réglementations marocaines et internationales.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Partage des Données</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Partenaires de Confiance</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Processeurs de paiement :</strong> Stripe, PayPal (données de transaction uniquement)</li>
                <li><strong>Hébergement :</strong> Fournisseurs d'infrastructure cloud sécurisés</li>
                <li><strong>Analytics :</strong> Google Analytics (données anonymisées)</li>
                <li><strong>Support :</strong> Outils de support client (avec consentement)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Obligations Légales</h3>
              <p>Nous pouvons partager vos données si requis par la loi, une ordonnance du tribunal, ou pour protéger nos droits et ceux de nos utilisateurs.</p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Transferts Internationaux</h3>
              <p>Vos données peuvent être transférées vers des pays tiers offrant un niveau de protection adéquat ou avec des garanties appropriées (clauses contractuelles types).</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Sécurité des Données</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Mesures Techniques</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Chiffrement des données sensibles en base</li>
                <li>Authentification à deux facteurs disponible</li>
                <li>Surveillance continue des accès</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Tests de pénétration réguliers</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Mesures Organisationnelles</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Formation du personnel à la protection des données</li>
                <li>Accès limité aux données personnelles</li>
                <li>Politiques de sécurité strictes</li>
                <li>Audits de sécurité réguliers</li>
                <li>Plan de réponse aux incidents</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Conservation des Données</h2>
            <div className="space-y-4 mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type de Données</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Durée de Conservation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">Données de compte actif</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Durée de l'utilisation + 3 ans</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">Données de transaction</td>
                      <td className="px-4 py-3 text-sm text-gray-700">10 ans (obligation légale)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">Données de marketing</td>
                      <td className="px-4 py-3 text-sm text-gray-700">3 ans après dernier contact</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">Logs de connexion</td>
                      <td className="px-4 py-3 text-sm text-gray-700">12 mois</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">Cookies</td>
                      <td className="px-4 py-3 text-sm text-gray-700">13 mois maximum</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Vos Droits</h2>
            <div className="space-y-4 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🔍 Droit d'Accès</h4>
                  <p className="text-blue-700 text-sm">Obtenir une copie de vos données personnelles.</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✏️ Droit de Rectification</h4>
                  <p className="text-green-700 text-sm">Corriger des données inexactes ou incomplètes.</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">🗑️ Droit d'Effacement</h4>
                  <p className="text-red-700 text-sm">Demander la suppression de vos données.</p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⏸️ Droit de Limitation</h4>
                  <p className="text-yellow-700 text-sm">Limiter le traitement de vos données.</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">📤 Droit de Portabilité</h4>
                  <p className="text-purple-700 text-sm">Récupérer vos données dans un format structuré.</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">❌ Droit d'Opposition</h4>
                  <p className="text-orange-700 text-sm">Vous opposer au traitement de vos données.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-800 mb-2">Comment Exercer vos Droits</h4>
                <p className="text-gray-700 text-sm mb-2">Pour exercer vos droits, contactez-nous :</p>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li>Email : privacy@back.ma</li>
                  <li>Formulaire de contact : <a href="/contact" className="text-blue-600 hover:underline">/contact</a></li>
                  <li>Réponse sous 30 jours maximum</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Cookies et Technologies Similaires</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Types de Cookies</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies Essentiels :</strong> Nécessaires au fonctionnement de la plateforme</li>
                <li><strong>Cookies de Performance :</strong> Analyse de l'utilisation et amélioration des services</li>
                <li><strong>Cookies de Fonctionnalité :</strong> Mémorisation de vos préférences</li>
                <li><strong>Cookies de Marketing :</strong> Publicité personnalisée (avec consentement)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">10.2 Gestion des Cookies</h3>
              <p>Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur ou notre bannière de consentement.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Mineurs</h2>
            <div className="space-y-4 mb-8">
              <p>Back.ma ne collecte pas sciemment de données personnelles d'enfants de moins de 16 ans. Si nous apprenons qu'un enfant de moins de 16 ans nous a fourni des données personnelles, nous les supprimerons immédiatement.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Modifications de cette Politique</h2>
            <div className="space-y-4 mb-8">
              <p>Nous pouvons modifier cette politique de confidentialité pour refléter les changements dans nos pratiques ou pour d'autres raisons opérationnelles, légales ou réglementaires. Nous vous informerons de tout changement important par email ou via la plateforme.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Contact et Réclamations</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">13.1 Contact</h3>
              <p>Pour toute question concernant cette politique de confidentialité :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email : privacy@back.ma</li>
                <li>Adresse : Casablanca, Maroc</li>
                <li>Page de contact : <a href="/contact" className="text-blue-600 hover:underline">/contact</a></li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.2 Autorité de Contrôle</h3>
              <p>Vous avez le droit de déposer une réclamation auprès de l'autorité de contrôle compétente si vous estimez que vos droits ne sont pas respectés.</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-12">
              <h3 className="text-lg font-semibold text-green-800 mb-3">🛡️ Notre Engagement</h3>
              <p className="text-green-700 mb-4">
                Back.ma s'engage à protéger votre vie privée et à traiter vos données personnelles avec le plus grand respect. 
                Nous mettons en œuvre les meilleures pratiques de sécurité et respectons scrupuleusement les réglementations en vigueur.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-green-700">
                <li>Transparence totale sur l'utilisation de vos données</li>
                <li>Sécurité renforcée avec chiffrement et monitoring</li>
                <li>Respect de vos droits et de votre consentement</li>
                <li>Conformité RGPD et loi marocaine</li>
                <li>Support dédié pour vos questions</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
