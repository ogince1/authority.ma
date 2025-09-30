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
  EyeOff,
  ShoppingCart,
  PenTool,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { ServiceRequest } from '../../types';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  minimum_quantity?: number;
  features: string[];
  status: 'available' | 'unavailable';
  category?: string;
  estimated_delivery_days?: number;
  created_at: string;
  updated_at: string;
}

const ServicesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'requests'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFilter, setRequestFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');
  const [resultReport, setResultReport] = useState('');
  const [resultLinks, setResultLinks] = useState<Array<{url: string, anchor_text: string, page_title: string, placement_type: string}>>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // États pour la rédaction d'articles
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleKeywords, setArticleKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [writerName, setWriterName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'MAD',
    minimum_quantity: '',
    features: [''],
    status: 'available' as 'available' | 'unavailable',
    category: '',
    estimated_delivery_days: ''
  });

  useEffect(() => {
    loadServices();
    loadServiceRequests();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transformer les données pour correspondre à l'interface Service
      const transformedServices: Service[] = (data || []).map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        currency: service.currency || 'MAD',
        minimum_quantity: service.minimum_quantity,
        features: service.features || [],
        status: service.status || 'available',
        category: service.category,
        estimated_delivery_days: service.estimated_delivery_days,
        created_at: service.created_at,
        updated_at: service.updated_at
      }));
      
      setServices(transformedServices);
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
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: 'MAD', // Force la devise de la plateforme
        minimum_quantity: formData.minimum_quantity ? parseInt(formData.minimum_quantity) : null,
        features: formData.features.filter(f => f.trim() !== ''),
        status: formData.status,
        category: formData.category || null,
        estimated_delivery_days: formData.estimated_delivery_days ? parseInt(formData.estimated_delivery_days) : null
      };

      if (editingService) {
        // Mise à jour
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        
        if (error) throw error;
        
        toast.success('Service mis à jour avec succès');
      } else {
        // Création
        const { error } = await supabase
          .from('services')
          .insert(serviceData);
        
        if (error) throw error;
        
        toast.success('Service créé avec succès');
      }

      resetForm();
      loadServices(); // Recharger les services depuis la base de données
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
      status: service.status,
      category: service.category || '',
      estimated_delivery_days: service.estimated_delivery_days?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);
        
        if (error) throw error;
        
        toast.success('Service supprimé avec succès');
        loadServices(); // Recharger les services depuis la base de données
      } catch (error) {
        console.error('Error deleting service:', error);
        toast.error('Erreur lors de la suppression du service');
      }
    }
  };

  const toggleStatus = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;
      
      const newStatus = service.status === 'available' ? 'unavailable' : 'available';
      
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus })
        .eq('id', serviceId);
      
      if (error) throw error;
      
    toast.success('Statut du service mis à jour');
      loadServices(); // Recharger les services depuis la base de données
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Fonctions pour les demandes de services
  const loadServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          user:users(
            id,
            name,
            email
          ),
          service:services(
            id,
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Si la table n'existe pas ou est vide, on initialise avec un tableau vide
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
          console.log('Table service_requests non trouvée ou vide');
          setServiceRequests([]);
          return;
        }
        throw error;
      }
      
      setServiceRequests(data || []);
    } catch (error) {
      console.error('Error loading service requests:', error);
      // Ne pas afficher d'erreur toast pour une table vide
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && !error.message.includes('does not exist')) {
        toast.error('Erreur lors du chargement des demandes');
      }
      setServiceRequests([]);
    }
  };

  const handleRequestStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.result_links = resultLinks;
        updateData.result_report = resultReport;
        updateData.execution_notes = executionNotes;
      }
      
      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', requestId);
      
      if (error) {
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
          toast.error('Table service_requests non disponible');
          return;
        }
        throw error;
      }
      
      toast.success('Statut de la demande mis à jour');
      setShowRequestModal(false);
      setAdminNotes('');
      loadServiceRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };


  const addResultLink = () => {
    setResultLinks([...resultLinks, {
      url: '',
      anchor_text: '',
      page_title: '',
      placement_type: 'content'
    }]);
  };

  const removeResultLink = (index: number) => {
    setResultLinks(resultLinks.filter((_, i) => i !== index));
  };

  const updateResultLink = (index: number, field: string, value: string) => {
    const updated = [...resultLinks];
    updated[index] = { ...updated[index], [field]: value };
    setResultLinks(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const filteredRequests = serviceRequests.filter(request => {
    if (requestFilter === 'all') return true;
    return request.status === requestFilter;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'MAD',
      minimum_quantity: '',
      features: [''],
      status: 'available',
      category: '',
      estimated_delivery_days: ''
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

  // Fonctions pour la rédaction d'articles
  const handleWriteArticle = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setArticleTitle(request.article_title || '');
    setArticleContent(request.article_content || '');
    setArticleKeywords(request.article_keywords || []);
    setWriterName(request.writer_name || '');
    setShowArticleModal(true);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !articleKeywords.includes(keywordInput.trim())) {
      setArticleKeywords([...articleKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setArticleKeywords(articleKeywords.filter((_, i) => i !== index));
  };

  const handleSaveArticle = async () => {
    if (!selectedRequest || !articleTitle.trim() || !articleContent.trim()) {
      toast.error('Veuillez remplir le titre et le contenu de l\'article');
      return;
    }

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          article_title: articleTitle.trim(),
          article_content: articleContent.trim(),
          article_keywords: articleKeywords,
          writer_name: writerName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Article sauvegardé avec succès');
      setShowArticleModal(false);
      loadServiceRequests();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Erreur lors de la sauvegarde de l\'article');
    }
  };

  const handleSendArticleToClient = async () => {
    if (!selectedRequest) return;

    // Validation obligatoire avant envoi
    if (!articleTitle.trim() || !articleContent.trim()) {
      toast.error('Veuillez remplir le titre et le contenu de l\'article avant de l\'envoyer');
      return;
    }

    try {
      // Sauvegarder ET envoyer en une seule opération
      const { error } = await supabase
        .from('service_requests')
        .update({
          article_title: articleTitle.trim(),
          article_content: articleContent.trim(),
          article_keywords: articleKeywords,
          writer_name: writerName.trim(),
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // TODO: Envoyer un email de notification au client et à l'éditeur
      toast.success('Article sauvegardé et envoyé au client avec succès');
      setShowArticleModal(false);
      loadServiceRequests();
    } catch (error) {
      console.error('Error sending article:', error);
      toast.error('Erreur lors de l\'envoi de l\'article');
    }
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'forum-links':
        return <Package className="h-6 w-6 text-blue-600" />;
      case 'directory-submission':
        return <Globe className="h-6 w-6 text-green-600" />;
      case 'llm-links':
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
            <h1 className="text-3xl font-bold text-gray-900">Services & Demandes</h1>
            <p className="text-gray-600 mt-1">
              Gérez les services et les demandes des annonceurs
            </p>
          </div>
          {activeTab === 'services' && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Service
          </button>
          )}
        </div>
        
        {/* Onglets */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Services ({services.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Demandes ({serviceRequests.length})
              </div>
            </button>
          </nav>
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
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    <span className="text-gray-600 font-medium">MAD</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Devise fixe de la plateforme</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="ex: SEO, Marketing, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai de livraison estimé (jours)
                </label>
                <input
                  type="number"
                  value={formData.estimated_delivery_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_delivery_days: e.target.value }))}
                  placeholder="ex: 7, 14, 30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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

      {/* Contenu des onglets */}
      {activeTab === 'services' && (
        <>
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
        </>
      )}

      {/* Onglet Demandes */}
      {activeTab === 'requests' && (
        <>
          {/* Filtres */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'in_progress', 'completed', 'rejected'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRequestFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    requestFilter === filter
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'Toutes' : getStatusLabel(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des demandes */}
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.service?.name || 'Service supprimé'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Client:</span> {request.user?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {request.user?.email || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Prix:</span> {request.service?.price} MAD
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">Message:</span>
                        <p className="text-gray-600 mt-1">{request.message}</p>
                      </div>
                    )}
                    
                    {request.placement_details && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-700">📍 Détails de placement:</span>
                        <p className="text-blue-600 mt-1 whitespace-pre-line">{request.placement_details}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRequestModal(true);
                        setAdminNotes(request.admin_notes || '');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRequestStatusUpdate(request.id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approuver"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRequestStatusUpdate(request.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rejeter"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowResultModal(true);
                          setResultLinks([]);
                          setResultReport(request.result_report || '');
                          setExecutionNotes(request.execution_notes || '');
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Ajouter résultats"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Bouton pour rédiger un article (pour les services de rédaction) */}
                    {(request.status === 'in_progress' || request.status === 'approved') && 
                     request.service?.category === 'redaction' && (
                      <button
                        onClick={() => handleWriteArticle(request)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Rédiger l'article"
                      >
                        <PenTool className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
                <p className="text-gray-600">Aucune demande de service pour le moment</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal des détails de demande */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Détails de la demande</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700">Service:</span>
                <p className="text-gray-900">{selectedRequest.service?.name || 'Service supprimé'}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Client:</span>
                <p className="text-gray-900">{selectedRequest.user?.name} ({selectedRequest.user?.email})</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Statut:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusLabel(selectedRequest.status)}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Prix:</span>
                <p className="text-gray-900">{selectedRequest.service?.price} MAD</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Date de création:</span>
                <p className="text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <span className="font-medium text-gray-700">Message du client:</span>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.message}</p>
                </div>
              )}
              
              <div>
                <label className="block font-medium text-gray-700 mb-2">Notes admin:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ajoutez des notes pour cette demande..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleRequestStatusUpdate(selectedRequest.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleRequestStatusUpdate(selectedRequest.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Rejeter
                  </button>
                </>
              )}
              
              {selectedRequest.status === 'approved' && (
                <button
                  onClick={() => handleRequestStatusUpdate(selectedRequest.id, 'completed')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Marquer comme terminé
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Modal pour ajouter les résultats */}
      {showResultModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter les résultats du service</h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Notes d\'exécution */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Notes d\'exécution :
                </label>
                <textarea
                  value={executionNotes}
                  onChange={(e) => setExecutionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez comment le service a été exécuté..."
                />
              </div>

              {/* Liens créés */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block font-medium text-gray-700">
                    Liens créés :
                  </label>
                  <button
                    onClick={addResultLink}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    + Ajouter un lien
                  </button>
                </div>
                
                <div className="space-y-3">
                  {resultLinks.map((link, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL du lien</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateResultLink(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="https://example.com/page"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Texte d\'ancrage</label>
                          <input
                            type="text"
                            value={link.anchor_text}
                            onChange={(e) => updateResultLink(index, 'anchor_text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Texte du lien"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la page</label>
                          <input
                            type="text"
                            value={link.page_title}
                            onChange={(e) => updateResultLink(index, 'page_title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Titre de la page"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type de placement</label>
                          <select
                            value={link.placement_type}
                            onChange={(e) => updateResultLink(index, 'placement_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="content">Contenu</option>
                            <option value="header">En-tête</option>
                            <option value="footer">Pied de page</option>
                            <option value="sidebar">Barre latérale</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => removeResultLink(index)}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Supprimer ce lien
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rapport final */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Rapport final :
                </label>
                <textarea
                  value={resultReport}
                  onChange={(e) => setResultReport(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Résumé des résultats obtenus pour le client..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRequestStatusUpdate(selectedRequest.id, 'completed')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Finaliser et envoyer le rapport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rédaction d'article */}
      {showArticleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Rédiger l'article - {selectedRequest.service?.name}
              </h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations du client */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Informations du client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Client:</span> {selectedRequest.user?.name}</div>
                  <div><span className="font-medium">Email:</span> {selectedRequest.user?.email}</div>
                  <div><span className="font-medium">Service:</span> {selectedRequest.service?.name}</div>
                  <div><span className="font-medium">Prix:</span> {selectedRequest.total_price} MAD</div>
                </div>
                
                {selectedRequest.placement_details && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-900">Détails de placement:</span>
                    <p className="text-gray-600 mt-1 whitespace-pre-line">{selectedRequest.placement_details}</p>
                  </div>
                )}
              </div>

              {/* Nom du rédacteur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rédacteur (votre nom)
                </label>
                <input
                  type="text"
                  value={writerName}
                  onChange={(e) => setWriterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>

              {/* Titre de l'article */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'article
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Titre accrocheur de l'article"
                />
              </div>

              {/* Mots-clés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mots-clés ciblés
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ajouter un mot-clé"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                {articleKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {articleKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contenu de l'article */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de l'article
                </label>
                <textarea
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rédigez ici le contenu de l'article..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {articleContent.length} caractères
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowArticleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveArticle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Sauvegarder
              </button>
              <button
                onClick={handleSendArticleToClient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2 inline" />
                Envoyer au client
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
