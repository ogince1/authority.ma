import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  Globe, 
  Brain,
  CheckCircle,
  Clock,
  Euro,
  Info,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  minimum_quantity?: number;
  icon: React.ReactNode;
  features: string[];
  status: 'available' | 'unavailable';
}

const AdvertiserServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadServices();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Services prédéfinis (en attendant l'implémentation admin)
      const predefinedServices: Service[] = [
        {
          id: 'forum-links',
          name: 'Pack de liens forums thématisés',
          description: 'Liens de qualité sur des forums spécialisés dans votre secteur d\'activité',
          price: 24.50,
          currency: 'EUR',
          minimum_quantity: 10,
          icon: <Package className="h-8 w-8 text-blue-600" />,
          features: [
            'Liens sur forums thématisés',
            'Minimum 10 liens',
            'Forums de qualité',
            'Ancres optimisées',
            'Livraison sous 7 jours'
          ],
          status: 'available'
        },
        {
          id: 'directory-submission',
          name: 'Soumission dans annuaires généralistes',
          description: 'Soumission de votre site dans 15 annuaires généralistes de qualité',
          price: 195,
          currency: 'EUR',
          icon: <Globe className="h-8 w-8 text-green-600" />,
          features: [
            '15 annuaires généralistes',
            'Soumission manuelle',
            'Descriptions optimisées',
            'Catégorisation appropriée',
            'Livraison sous 14 jours'
          ],
          status: 'available'
        },
        {
          id: 'llm-backlinks',
          name: 'Backlinks optimisés pour LLMs',
          description: 'Liens optimisés pour l\'indexation dans les modèles de langage (ChatGPT, etc.)',
          price: 45,
          currency: 'EUR',
          icon: <Brain className="h-8 w-8 text-purple-600" />,
          features: [
            'Optimisation LLM',
            'Liens contextuels',
            'Contenu structuré',
            'Métadonnées enrichies',
            'Livraison sous 10 jours'
          ],
          status: 'available'
        }
      ];

      setServices(predefinedServices);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (service: Service) => {
    if (!user) {
      toast.error('Vous devez être connecté pour demander un service');
      return;
    }

    // Pour l'instant, on affiche juste un message
    // Plus tard, cela créera une demande de service
    toast.success(`Demande de service "${service.name}" envoyée à l'administrateur`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Services Premium
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Boostez votre visibilité avec nos services spécialisés
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Services actifs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{services.filter(s => s.status === 'available').length}</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Prix moyen</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length) : 0}€
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Satisfaction</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">98%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Information importante */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Comment ça marche ?</h3>
            <p className="text-blue-700 leading-relaxed">
              Les services sont gérés par notre équipe d'experts. Après votre demande, 
              nous vous contacterons pour finaliser les détails et commencer le travail.
            </p>
          </div>
        </div>
      </div>

      {/* Liste des services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Badge de statut */}
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                service.status === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {service.status === 'available' ? 'Disponible' : 'Bientôt'}
              </span>
            </div>

            {/* En-tête du service */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {service.price} {service.currency}
                    </span>
                    {service.minimum_quantity && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        min. {service.minimum_quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

            {/* Fonctionnalités */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Fonctionnalités incluses
              </h4>
              <ul className="space-y-3">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3 text-sm text-gray-600">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bouton d'action */}
            <div className="mt-auto">
              <button
                onClick={() => handleRequestService(service)}
                disabled={service.status === 'unavailable'}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 ${
                  service.status === 'available'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>
                  {service.status === 'available' ? 'Demander ce service' : 'Indisponible'}
                </span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Section d'aide */}
      <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-gray-600">Notre équipe est là pour vous accompagner</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Questions sur les services</h4>
                <p className="text-gray-600 leading-relaxed">
                  Contactez notre équipe via les messages pour toute question sur nos services premium
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Délais de livraison</h4>
                <p className="text-gray-600 leading-relaxed">
                  Les délais indiqués sont approximatifs et peuvent varier selon la complexité
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserServices;
