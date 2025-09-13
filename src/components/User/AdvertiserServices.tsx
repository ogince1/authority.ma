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
  AlertCircle,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser, getServices, getServiceById } from '../../lib/supabase';
import { Service, ServiceCartItem } from '../../types';
import toast from 'react-hot-toast';

// Interface locale pour l'affichage (avec icône)
interface ServiceDisplay extends Service {
  icon: React.ReactNode;
}

const AdvertiserServices: React.FC = () => {
  const [services, setServices] = useState<ServiceDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<ServiceCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadServices();
    loadUser();
    loadCart();
  }, []);

  // Charger le panier depuis localStorage
  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('service-cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Sauvegarder le panier dans localStorage
  const saveCart = (newCart: ServiceCartItem[]) => {
    try {
      localStorage.setItem('service-cart', JSON.stringify(newCart));
      setCart(newCart);
      // Émettre un événement pour mettre à jour le compteur dans la sidebar
      window.dispatchEvent(new CustomEvent('service-cart-updated', { detail: newCart.length }));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

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
      
      // Charger les services depuis la base de données
      const dbServices = await getServices();
      
      // Mapper les services avec leurs icônes
      const servicesWithIcons: ServiceDisplay[] = dbServices.map(service => ({
        ...service,
        icon: getServiceIcon(service.category)
      }));

      setServices(servicesWithIcons);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir l'icône selon la catégorie
  const getServiceIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'seo':
        return <Package className="h-8 w-8 text-blue-600" />;
      case 'audit':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'contenu':
        return <Brain className="h-8 w-8 text-purple-600" />;
      default:
        return <Globe className="h-8 w-8 text-gray-600" />;
    }
  };

  // Ajouter un service au panier
  const addToCart = (service: Service) => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter un service au panier');
      return;
    }

    const existingItem = cart.find(item => item.service_id === service.id);
    const newCart = [...cart];

    if (existingItem) {
      // Augmenter la quantité
      existingItem.quantity += 1;
    } else {
      // Ajouter un nouvel item
      newCart.push({
        service_id: service.id,
        quantity: 1,
        service: service
      });
    }

    saveCart(newCart);
    toast.success(`${service.name} ajouté au panier`);
  };

  // Retirer un service du panier
  const removeFromCart = (serviceId: string) => {
    const newCart = cart.filter(item => item.service_id !== serviceId);
    saveCart(newCart);
    toast.success('Service retiré du panier');
  };

  // Modifier la quantité d'un service dans le panier
  const updateQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(serviceId);
      return;
    }

    const newCart = cart.map(item => 
      item.service_id === serviceId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    saveCart(newCart);
  };

  // Calculer le total du panier
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const service = item.service;
      if (service) {
        return total + (service.price * item.quantity);
      }
      return total;
    }, 0);
  };

  // Passer la commande
  const checkout = async () => {
    if (!user || cart.length === 0) {
      toast.error('Panier vide ou utilisateur non connecté');
      return;
    }

    try {
      // Ici, on créerait les demandes de services
      // Pour l'instant, on simule
      toast.success('Commande passée avec succès ! L\'administrateur va traiter votre demande.');
      
      // Vider le panier
      saveCart([]);
      setShowCart(false);
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Erreur lors de la commande');
    }
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
      {/* Header avec panier */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Premium</h1>
          <p className="text-gray-600 mt-1">Boostez votre visibilité avec nos services spécialisés</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Panier</span>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Panier latéral */}
      {showCart && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Panier</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Votre panier est vide</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.service_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{item.service?.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.service_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.service?.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.service_id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 bg-white rounded border">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.service_id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {(item.service?.price || 0) * item.quantity}€
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">{getCartTotal().toFixed(2)}€</span>
                  </div>
                  <button
                    onClick={checkout}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Passer la commande
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Overlay pour le panier */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowCart(false)}
        />
      )}

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
                onClick={() => addToCart(service)}
                disabled={service.status === 'unavailable'}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 ${
                  service.status === 'available'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>
                  {service.status === 'available' ? 'Ajouter au panier' : 'Indisponible'}
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
