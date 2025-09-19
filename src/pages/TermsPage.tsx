import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Conditions d'Utilisation - Back.ma"
        description="Consultez les conditions d'utilisation de Back.ma, la plateforme marocaine de netlinking. Règles, responsabilités et droits des utilisateurs pour l'achat et la vente de liens SEO."
        keywords="conditions utilisation, Back.ma, règles plateforme, netlinking Maroc, droits utilisateurs, responsabilités"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Conditions d'Utilisation
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-blue-100 max-w-3xl mx-auto"
            >
              Règles et conditions pour utiliser la plateforme Back.ma
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
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
              <p className="text-blue-800 font-medium">
                <strong>Dernière mise à jour :</strong> 21 janvier 2025
              </p>
              <p className="text-blue-700 text-sm mt-2">
                Ces conditions d'utilisation régissent votre utilisation de la plateforme Back.ma. 
                En utilisant notre service, vous acceptez ces conditions.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Définitions</h2>
            <div className="space-y-4 mb-8">
              <p><strong>Back.ma</strong> : La plateforme de netlinking marocaine permettant l'achat et la vente de liens SEO.</p>
              <p><strong>Utilisateur</strong> : Toute personne utilisant la plateforme Back.ma.</p>
              <p><strong>Éditeur</strong> : Utilisateur vendant des liens sur son site web.</p>
              <p><strong>Acheteur</strong> : Utilisateur achetant des liens pour améliorer son SEO.</p>
              <p><strong>Lien</strong> : Lien hypertexte placé sur un site web dans le cadre d'une transaction.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Acceptation des Conditions</h2>
            <div className="space-y-4 mb-8">
              <p>En accédant et en utilisant Back.ma, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser notre plateforme.</p>
              <p>Ces conditions s'appliquent à tous les utilisateurs de la plateforme, y compris les visiteurs, les acheteurs et les éditeurs.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Description du Service</h2>
            <div className="space-y-4 mb-8">
              <p>Back.ma est une plateforme de netlinking qui facilite :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>La mise en relation entre acheteurs et vendeurs de liens</li>
                <li>La sécurisation des transactions de liens</li>
                <li>La vérification de la qualité des sites et des liens</li>
                <li>Le suivi et la gestion des campagnes de netlinking</li>
                <li>Le support technique et commercial</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Inscription et Compte Utilisateur</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Création de Compte</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vous devez fournir des informations exactes et à jour</li>
                <li>Vous êtes responsable de la confidentialité de votre compte</li>
                <li>Vous devez notifier immédiatement toute utilisation non autorisée</li>
                <li>Un seul compte par personne physique ou morale</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Vérification</h3>
              <p>Back.ma se réserve le droit de vérifier l'identité et les informations des utilisateurs. Des documents supplémentaires peuvent être demandés.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Obligations des Utilisateurs</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Obligations Générales</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Respecter les lois marocaines et internationales</li>
                <li>Ne pas utiliser la plateforme à des fins illégales</li>
                <li>Maintenir la confidentialité des informations sensibles</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Obligations des Éditeurs</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posséder les droits légaux sur le site web proposé</li>
                <li>Garantir la qualité et la pertinence du contenu</li>
                <li>Respecter les délais de publication convenus</li>
                <li>Maintenir les liens pour la durée contractuelle</li>
                <li>Informer de tout changement affectant le site</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.3 Obligations des Acheteurs</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fournir des informations exactes sur le site cible</li>
                <li>Respecter les directives Google et les bonnes pratiques SEO</li>
                <li>Effectuer les paiements dans les délais convenus</li>
                <li>Ne pas demander de liens vers du contenu illégal</li>
                <li>Respecter les conditions spécifiques de chaque éditeur</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Interdictions</h2>
            <div className="space-y-4 mb-8">
              <p>Il est strictement interdit de :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vendre ou acheter des liens vers du contenu illégal, pornographique ou haineux</li>
                <li>Utiliser des techniques de manipulation des moteurs de recherche</li>
                <li>Créer des comptes multiples pour contourner les restrictions</li>
                <li>Partager des informations de compte avec des tiers</li>
                <li>Utiliser des bots ou des scripts automatisés</li>
                <li>Publier du contenu spam ou de mauvaise qualité</li>
                <li>Violer les droits d'auteur ou de propriété intellectuelle</li>
                <li>Harceler ou menacer d'autres utilisateurs</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Paiements et Commissions</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Structure des Paiements</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Back.ma prélève une commission de 15% sur chaque transaction</li>
                <li>Les paiements sont sécurisés et traités automatiquement</li>
                <li>Les remboursements sont possibles selon les conditions spécifiques</li>
                <li>Les frais de transaction peuvent s'appliquer</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Délais de Paiement</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Paiement des éditeurs : 48h après publication du lien</li>
                <li>Paiement des acheteurs : Immédiat lors de la commande</li>
                <li>Retrait des fonds : 24-48h selon le mode de paiement</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Propriété Intellectuelle</h2>
            <div className="space-y-4 mb-8">
              <p>Back.ma respecte la propriété intellectuelle et s'attend à ce que ses utilisateurs en fassent de même :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les utilisateurs conservent leurs droits sur leur contenu</li>
                <li>Back.ma ne revendique aucun droit sur le contenu des utilisateurs</li>
                <li>Les utilisateurs accordent une licence limitée pour l'utilisation de la plateforme</li>
                <li>Toute violation de droits d'auteur sera traitée selon la loi</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Limitation de Responsabilité</h2>
            <div className="space-y-4 mb-8">
              <p>Back.ma fournit ses services "en l'état" et ne peut être tenu responsable de :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>La qualité ou la performance des liens achetés</li>
                <li>Les changements d'algorithmes des moteurs de recherche</li>
                <li>Les pertes de revenus ou de trafic</li>
                <li>Les dommages indirects ou consécutifs</li>
                <li>Les interruptions de service temporaires</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Suspension et Résiliation</h2>
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Suspension</h3>
              <p>Back.ma peut suspendre un compte en cas de :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation des conditions d'utilisation</li>
                <li>Comportement frauduleux ou suspect</li>
                <li>Non-respect des délais de paiement</li>
                <li>Publication de contenu inapproprié</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">10.2 Résiliation</h3>
              <p>Les utilisateurs peuvent résilier leur compte à tout moment. Back.ma peut résilier un compte après 30 jours de suspension sans résolution.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Protection des Données</h2>
            <div className="space-y-4 mb-8">
              <p>Back.ma s'engage à protéger les données personnelles conformément à la loi marocaine et au RGPD. Consultez notre <a href="/privacy" className="text-blue-600 hover:underline">Politique de Confidentialité</a> pour plus de détails.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Droit Applicable et Juridiction</h2>
            <div className="space-y-4 mb-8">
              <p>Ces conditions sont régies par le droit marocain. Tout litige sera soumis à la juridiction des tribunaux de Casablanca, Maroc.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Modifications des Conditions</h2>
            <div className="space-y-4 mb-8">
              <p>Back.ma se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés des changements importants par email ou via la plateforme. L'utilisation continue de la plateforme après modification constitue une acceptation des nouvelles conditions.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">14. Contact</h2>
            <div className="space-y-4 mb-8">
              <p>Pour toute question concernant ces conditions d'utilisation, contactez-nous :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email : legal@back.ma</li>
                <li>Adresse : Casablanca, Maroc</li>
                <li>Page de contact : <a href="/contact" className="text-blue-600 hover:underline">/contact</a></li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Résumé des Points Clés</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                <li>Acceptation des conditions par l'utilisation de la plateforme</li>
                <li>Commission de 15% sur chaque transaction</li>
                <li>Respect des lois marocaines et des bonnes pratiques SEO</li>
                <li>Protection des données personnelles</li>
                <li>Possibilité de suspension en cas de violation</li>
                <li>Droit marocain applicable</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsPage;
