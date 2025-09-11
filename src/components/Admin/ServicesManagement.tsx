import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Globe, 
  Brain,
  CheckCircle,
  XCircle,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  minimum_quantity?: number;
  features: string[];
  status: 'available' | 'unavailable';
  created_at: string;
  updated_at: string;
}

const ServicesManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'EUR',
    minimum_quantity: '',
    features: [''],
    status: 'available' as 'available' | 'unavailable'
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Services prédéfinis (en attendant l'implémentation backend)
      const predefinedServices: Service[] = [
        {
          id: 'forum-links',
          name: 'Pack de liens forums thématisés',
          description: 'Liens de qualité sur des forums spécialisés dans votre secteur d\'activité',
          price: 24.50,
          currency: 'EUR',
          minimum_quantity: 10,
          features: [
            'Liens sur forums thématisés',
            'Minimum 10 liens',
            'Forums de qualité',
            'Ancres optimisées',
            'Livraison sous 7 jours'
          ],
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'directory-submission',
          name: 'Soumission dans annuaires généralistes',
          description: 'Soumission de votre site dans 15 annuaires généralistes de qualité',
          price: 195,
          currency: 'EUR',
          features: [
            '15 annuaires généralistes',
            'Soumission manuelle',
            'Descriptions optimisées',
            'Catégorisation appropriée',
            'Livraison sous 14 jours'
          ],
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'llm-backlinks',
          name: 'Backlinks optimisés pour LLMs',
          description: 'Liens optimisés pour l\'indexation dans les modèles de langage (ChatGPT, etc.)',
          price: 45,
          currency: 'EUR',
          features: [
            'Optimisation LLM',
            'Liens contextuels',
            'Contenu structuré',
            'Métadonnées enrichies',
            'Livraison sous 10 jours'
          ],
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        minimum_quantity: formData.minimum_quantity ? parseInt(formData.minimum_quantity) : undefined,
        features: formData.features.filter(f => f.trim() !== ''),
        id: editingService?.id || `service-${Date.now()}`,
        created_at: editingService?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingService) {
        // Mise à jour
        setServices(prev => prev.map(s => s.id === editingService.id ? serviceData : s));
        toast.success('Service mis à jour avec succès');
      } else {
        // Création
        setServices(prev => [...prev, serviceData]);
        toast.success('Service créé avec succès');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      currency: service.currency,
      minimum_quantity: service.minimum_quantity?.toString() || '',
      features: service.features.length > 0 ? service.features : [''],
      status: service.status
    });
    setShowForm(true);
  };

  const handleDelete = (serviceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success('Service supprimé');
    }
  };

  const toggleStatus = (serviceId: string) => {
    setServices(prev => prev.map(s => 
      s.id === serviceId 
        ? { ...s, status: s.status === 'available' ? 'unavailable' : 'available' }
        : s
    ));
    toast.success('Statut du service mis à jour');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'EUR',
      minimum_quantity: '',
      features: [''],
      status: 'available'
    });
    setEditingService(null);
    setShowForm(false);
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'forum-links':
        return <Package className="h-6 w-6 text-blue-600" />;
      case 'directory-submission':
        return <Globe className="h-6 w-6 text-green-600" />;
      case 'llm-backlinks':
        return <Brain className="h-6 w-6 text-purple-600" />;
      default:
        return <Settings className="h-6 w-6 text-gray-600" />;
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Services</h1>
            <p className="text-gray-600 mt-1">
              Gérez les services premium proposés aux annonceurs
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Service
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingService ? 'Modifier le service' : 'Nouveau service'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du service
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EUR">EUR</option>
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité minimum (optionnel)
                </label>
                <input
                  type="number"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'available' | 'unavailable' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="available">Disponible</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonctionnalités incluses
              </label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Fonctionnalité..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Ajouter une fonctionnalité
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingService ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Liste des services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getServiceIcon(service.id)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-green-600">
                      {service.price} {service.currency}
                    </span>
                    {service.minimum_quantity && (
                      <span className="text-sm text-gray-500">
                        (min. {service.minimum_quantity})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleStatus(service.id)}
                  className={`p-1 rounded ${
                    service.status === 'available' 
                      ? 'text-green-600 hover:text-green-800' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {service.status === 'available' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleEdit(service)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{service.description}</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Fonctionnalités :</h4>
              <ul className="space-y-1">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {service.status === 'available' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Disponible</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Indisponible</span>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(service.updated_at).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service</h3>
          <p className="text-gray-600">Commencez par créer votre premier service</p>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
