import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Save,
  AlertCircle,
  CheckCircle,
  Loader,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Calendar,
  ShoppingCart,
  Target,
  Award,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Campaign, CreateCampaignData, LinkOpportunity, LinkQualityType } from '../../types';
import { getCampaignById, updateCampaign, deleteCampaign, getLinkRecommendations } from '../../lib/supabase';
import toast from 'react-hot-toast';

const CampaignEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateCampaignData>({
    name: '',
    urls: [''],
    language: 'Français',
    budget: 0
  });
  const [recommendations, setRecommendations] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'existing' | 'new'>('existing');
  const [filters, setFilters] = React.useState({
    price_min: '',
    price_max: '',
    dr_min: '',
    tf_min: '',
    type: '',
    ps_min: ''
  });
  const [searchTerm, setSearchTerm] = React.useState('');
  // Ajout d'un state pour les IDs du panier
  const [cartIds, setCartIds] = React.useState<string[]>([]);

  // Charger les IDs du panier au montage
  React.useEffect(() => {
    const currentCart = localStorage.getItem('cart');
    const cartItems = currentCart ? JSON.parse(currentCart) : [];
    setCartIds(cartItems.map((item: any) => item.listing?.id));
    // Mettre à jour si le panier change
    const updateCart = () => {
      const updatedCart = localStorage.getItem('cart');
      const updatedItems = updatedCart ? JSON.parse(updatedCart) : [];
      setCartIds(updatedItems.map((item: any) => item.listing?.id));
    };
    window.addEventListener('storage', updateCart);
    return () => window.removeEventListener('storage', updateCart);
  }, []);

  React.useEffect(() => {
    if (id) {
      fetchCampaign();
      fetchRecommendations();
      
      // Sauvegarder l'ID de campagne dans localStorage pour le panier
      localStorage.setItem('current_campaign_id', id);
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const campaignData = await getCampaignById(id!);
      
      if (!campaignData) {
        toast.error('Campagne non trouvée');
        navigate('/dashboard/campaigns');
        return;
      }
      
      setCampaign(campaignData);
      
      // Pré-remplir le formulaire avec les données existantes
      setFormData({
        name: campaignData.name,
        urls: campaignData.urls,
        language: campaignData.language,
        budget: campaignData.budget
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Erreur lors du chargement de la campagne');
      navigate('/dashboard/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData({ ...formData, urls: newUrls });
  };

  const addUrl = () => {
    setFormData({ ...formData, urls: [...formData.urls, ''] });
  };

  const removeUrl = (index: number) => {
    if (formData.urls.length > 1) {
      const newUrls = formData.urls.filter((_, i) => i !== index);
      setFormData({ ...formData, urls: newUrls });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom de campagne');
      return;
    }

    if (!formData.urls.some(url => url.trim())) {
      toast.error('Veuillez saisir au moins une URL');
      return;
    }

    setSaving(true);
    try {
      await updateCampaign(id!, formData);
      toast.success('Campagne mise à jour avec succès !');
      navigate('/dashboard/campaigns');
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Erreur lors de la mise à jour de la campagne');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCampaign(id!);
      toast.success('Campagne supprimée avec succès !');
      navigate('/dashboard/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erreur lors de la suppression de la campagne');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Actif
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Clôturée
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Brouillon
          </span>
        );
      default:
        return null;
    }
  };

  const getQualityBadge = (type: LinkQualityType) => {
    const config = {
      bronze: { color: 'bg-amber-100 text-amber-800', icon: '🥉' },
      silver: { color: 'bg-gray-100 text-gray-800', icon: '🥈' },
      gold: { color: 'bg-yellow-100 text-yellow-800', icon: '🥇' }
    };

    const configItem = config[type];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <span className="mr-1">{configItem.icon}</span>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getProximityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrustFlowColor = (tf: number) => {
    if (tf >= 40) return 'bg-green-100 text-green-800';
    if (tf >= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAddToCart = (opportunity: LinkOpportunity, type: 'existing' | 'new') => {
    try {
      // Créer un objet listing compatible avec LinkListing pour les deux types
      const listing: any = {
        id: opportunity.id,
        title: type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name,
        target_url: type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url,
        price: opportunity.price,
        currency: opportunity.currency || 'MAD',
        link_type: 'dofollow' as any,
        position: 'content' as any,
        minimum_contract_duration: 1,
        allowed_niches: [opportunity.theme as any],
        forbidden_keywords: [],
        status: 'active',
        user_id: opportunity.id, // Utiliser l'ID de l'opportunité comme user_id
        website_id: opportunity.id,
        description: type === 'existing' 
          ? `Lien existant - ${opportunity.site_name}`
          : `Nouveau lien - ${opportunity.site_name}`,
        anchor_text: '',
        meta_title: opportunity.site_name,
        meta_description: `Lien de qualité ${opportunity.quality_type} sur ${opportunity.site_name}`,
        slug: opportunity.id,
        images: [],
        tags: [opportunity.theme, opportunity.quality_type],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Récupérer le panier actuel
      const currentCart = localStorage.getItem('cart');
      const cartItems = currentCart ? JSON.parse(currentCart) : [];

      // Vérifier si l'item existe déjà
      const existingItemIndex = cartItems.findIndex((item: any) => item.listing?.id === opportunity.id);
      
      if (existingItemIndex >= 0) {
        // Incrémenter la quantité
        cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
        toast.success('Quantité mise à jour dans le panier !');
      } else {
        // Ajouter un nouvel item avec la structure attendue
        cartItems.push({
          listing: listing,
          quantity: 1,
          anchorText: '',
          targetUrl: listing.target_url,
          isVirtual: type === 'new' // Marquer comme virtuel si c'est un nouveau article
        });
        toast.success('Ajouté au panier !');
      }

      // Sauvegarder le panier
      localStorage.setItem('cart', JSON.stringify(cartItems));
      
      // Forcer le re-render du badge du panier dans le header
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  const filterOpportunities = (opportunities: LinkOpportunity[], type: 'existing' | 'new') => {
    return opportunities.filter(opportunity => {
      // Filtre par prix
      if (filters.price_min && opportunity.price < parseFloat(filters.price_min)) return false;
      if (filters.price_max && opportunity.price > parseFloat(filters.price_max)) return false;
      
      // Filtre par DR
      if (filters.dr_min && (opportunity.site_metrics.dr || 0) < parseFloat(filters.dr_min)) return false;
      
      // Filtre par TF
      if (filters.tf_min && (opportunity.site_metrics.tf || 0) < parseFloat(filters.tf_min)) return false;
      
      // Filtre par PS
      if (filters.ps_min && (opportunity.site_metrics.ps || 0) < parseFloat(filters.ps_min)) return false;
      
      // Filtre par type de qualité
      if (filters.type && opportunity.quality_type !== filters.type) return false;
      
      // Filtre par recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const title = type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name;
        const url = type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url;
        const theme = opportunity.theme;
        
        if (!title?.toLowerCase().includes(searchLower) && 
            !url?.toLowerCase().includes(searchLower) && 
            !theme?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const fetchRecommendations = async () => {
    if (!id) return;
    
    try {
      const data = await getLinkRecommendations(id, {});
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Erreur lors du chargement des recommandations');
    }
  };

  const OpportunityRow: React.FC<{ opportunity: LinkOpportunity; type: 'existing' | 'new' }> = ({ opportunity, type }) => {
    const isInCart = cartIds.includes(opportunity.id);
    return (
      <tr className={`border-b border-gray-200 ${isInCart ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
        <td className="px-4 py-3 text-sm">
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">
              {type === 'existing' ? opportunity.existing_article?.title : opportunity.site_name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {type === 'existing' ? opportunity.existing_article?.url : opportunity.site_url}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrustFlowColor(opportunity.site_metrics.tf || 0)}`}>
            {opportunity.site_metrics.tf || 0}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {opportunity.site_name}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {opportunity.theme}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {opportunity.price} MAD
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={() => handleAddToCart(opportunity, type)}
              className={`text-blue-600 hover:text-blue-800 ${isInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isInCart}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Campagne non trouvée</h2>
          <p className="text-gray-600 mb-4">La campagne que vous recherchez n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate('/dashboard/campaigns')}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux campagnes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/campaigns')}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier la Campagne</h1>
              <p className="text-gray-600 mt-1">
                Mettez à jour les informations de votre campagne
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(campaign.status)}
            <button
              onClick={() => navigate(`/dashboard/campaigns/${id}`)}
              className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </button>
          </div>
        </div>

        {/* Statistiques de la campagne */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-blue-900">Total Commandes</div>
                <div className="text-lg font-bold text-blue-900">{campaign.total_orders}</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-green-900">Budget Utilisé</div>
                <div className="text-lg font-bold text-green-900">
                  {campaign.total_spent.toLocaleString()} MAD
                </div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-purple-900">Budget Restant</div>
                <div className="text-lg font-bold text-purple-900">
                  {(campaign.budget - campaign.total_spent).toLocaleString()} MAD
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-yellow-900">Créée le</div>
                <div className="text-lg font-bold text-yellow-900">
                  {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom de la campagne */}
          <div>
            <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la campagne
            </label>
            <input
              type="text"
              id="campaignName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Campagne SEO E-commerce"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URLs de la campagne
            </label>
            <div className="space-y-3">
              {formData.urls.map((url, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={index === 0}
                  />
                  {formData.urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrl(index)}
                      className="px-3 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addUrl}
                className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                Ajouter une autre URL
              </button>
            </div>
          </div>

          {/* Langue */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Français">Français</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Deutsch">Deutsch</option>
              <option value="Italiano">Italiano</option>
              <option value="Português">Português</option>
              <option value="العربية">العربية</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget total
            </label>
            <div className="relative">
              <input
                type="number"
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                min={campaign.total_spent}
                step="0.01"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-sm">MAD</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Le budget ne peut pas être inférieur au montant déjà dépensé ({campaign.total_spent.toLocaleString()} MAD)
            </p>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Informations importantes
                </h3>
                <p className="text-sm text-blue-700">
                  • La modification de la campagne n'affectera pas les commandes existantes<br/>
                  • Le budget ne peut pas être réduit en dessous du montant déjà dépensé<br/>
                  • Les URLs modifiées seront réanalysées automatiquement
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer la campagne
                </>
              )}
            </button>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/campaigns')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les modifications
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Section des recommandations */}
        {recommendations && (
          <div className="mt-8">
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Recommandations de liens</h2>
                  <p className="text-gray-600">
                    Opportunités de liens basées sur l'analyse de vos URLs
                  </p>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-900">Total Opportunités</div>
                  <div className="text-2xl font-bold text-blue-900">{recommendations.total_opportunities}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-900">Prix Moyen</div>
                  <div className="text-2xl font-bold text-green-900">{recommendations.average_price?.toFixed(0)} MAD</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-900">Prix Min-Max</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {recommendations.price_range?.min}-{recommendations.price_range?.max} MAD
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-900">Articles Existants</div>
                  <div className="text-2xl font-bold text-yellow-900">{recommendations.existing_articles?.length || 0}</div>
                </div>
              </div>

              {/* Filtres intelligents */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix Min</label>
                    <input
                      type="number"
                      value={filters.price_min}
                      onChange={(e) => setFilters({ ...filters, price_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix Max</label>
                    <input
                      type="number"
                      value={filters.price_max}
                      onChange={(e) => setFilters({ ...filters, price_max: e.target.value })}
                      placeholder="1000"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">DR Min</label>
                    <input
                      type="number"
                      value={filters.dr_min}
                      onChange={(e) => setFilters({ ...filters, dr_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">TF Min</label>
                    <input
                      type="number"
                      value={filters.tf_min}
                      onChange={(e) => setFilters({ ...filters, tf_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PS Min</label>
                    <input
                      type="number"
                      value={filters.ps_min}
                      onChange={(e) => setFilters({ ...filters, ps_min: e.target.value })}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qualité</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Toutes</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recherche</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre, URL ou thème..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Onglets */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('existing')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'existing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Articles Existants ({recommendations.existing_articles?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('new')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'new'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Nouveaux Articles ({recommendations.new_articles?.length || 0})
                  </button>
                </nav>
              </div>

              {/* Tableau des opportunités */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thème</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cmd</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeTab === 'existing' ? (
                      filterOpportunities(recommendations.existing_articles || [], 'existing').map((opportunity: LinkOpportunity, index: number) => (
                        <OpportunityRow key={opportunity.id} opportunity={opportunity} type="existing" />
                      ))
                    ) : (
                      filterOpportunities(recommendations.new_articles || [], 'new').map((opportunity: LinkOpportunity, index: number) => (
                        <OpportunityRow key={opportunity.id} opportunity={opportunity} type="new" />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {recommendations && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate('/panier')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow"
            >
              Confirmer la campagne et passer au panier
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CampaignEditForm; 