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
  Target,
  Clock,
  ExternalLink,
  Info,
  Activity,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Campaign, CreateCampaignData } from '../../types';
import { getCampaignById, updateCampaign, deleteCampaign, getCampaignOrders, getLinkPurchaseRequests } from '../../lib/supabase';
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
  const [purchasedLinks, setPurchasedLinks] = React.useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = React.useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  // Charger les liens achetés après que la campagne soit chargée
  React.useEffect(() => {
    if (campaign) {
      fetchPurchasedLinks();
    }
  }, [campaign]);

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

  const fetchPurchasedLinks = async () => {
    if (!id || !campaign) return;
    
    try {
      setLoadingLinks(true);
      
      // Récupérer les commandes de la campagne
      const orders = await getCampaignOrders(id);
      setPurchasedLinks(orders);
      
      // Récupérer les demandes d'achat en attente
      const requests = await getLinkPurchaseRequests({ user_id: campaign.user_id });
      const campaignRequests = requests.filter(req => req.campaign_id === id);
      setPurchaseRequests(campaignRequests);
      
    } catch (error) {
      console.error('Error fetching purchased links:', error);
      toast.error('Erreur lors du chargement des liens achetés');
    } finally {
      setLoadingLinks(false);
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


  const getLinkStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terminé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Activity className="w-3 h-3 mr-1" />
            En cours
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Annulé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Info className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
    }
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

        {/* Section des liens achetés */}
        <div className="mt-8">
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Liens achetés</h2>
                <p className="text-gray-600">
                  Suivi des liens achetés pour cette campagne
                </p>
              </div>
            </div>

            {/* Statistiques des liens achetés */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900">Total Liens</div>
                <div className="text-2xl font-bold text-blue-900">{purchasedLinks.length + purchaseRequests.length}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-900">Terminés</div>
                <div className="text-2xl font-bold text-green-900">
                  {purchasedLinks.filter(link => link.status === 'completed').length}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-900">En attente</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {purchaseRequests.filter(req => req.status === 'pending').length}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-900">En cours</div>
                <div className="text-2xl font-bold text-purple-900">
                  {purchasedLinks.filter(link => link.status === 'in_progress').length}
                </div>
              </div>
            </div>

            {/* Tableau des liens achetés */}
            {loadingLinks ? (
              <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lien
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchasedLinks.length === 0 && purchaseRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <Target className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">Aucun lien acheté</p>
                            <p className="text-sm">Cette campagne n'a pas encore de liens achetés</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {/* Liens terminés */}
                        {purchasedLinks.map((link, index) => (
                          <tr key={`purchased-${link.id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {link.link_listing?.title || 'Lien sans titre'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {link.link_listing?.target_url || link.target_url}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {link.link_listing?.website?.name || 'Site inconnu'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {link.amount || link.link_listing?.price || 0} MAD
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getLinkStatusBadge(link.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(link.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => window.open(link.link_listing?.target_url || link.target_url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Voir le lien"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Demandes en attente */}
                        {purchaseRequests.map((request, index) => (
                          <tr key={`request-${request.id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {request.link_listing?.title || 'Demande de lien'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {request.target_url}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {request.link_listing?.website?.name || 'Site inconnu'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {request.proposed_price} MAD
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getLinkStatusBadge(request.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">En attente de validation</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignEditForm; 