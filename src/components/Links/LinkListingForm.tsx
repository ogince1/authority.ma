import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X,
  Globe,
  Link as LinkIcon,
  DollarSign,
  Calendar,
  Target,
  FileText,
  AlertCircle,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, Website, CreateLinkListingData } from '../../types';
import { getWebsites, createLinkListing, updateLinkListing } from '../../lib/supabase';
import { getCurrentUser } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface LinkListingFormProps {
  listing?: LinkListing;
  isEdit?: boolean;
  onSuccess: (listing: LinkListing) => void;
  onCancel: () => void;
  onBulkImport?: () => void;
}

const LinkListingForm: React.FC<LinkListingFormProps> = ({ 
  listing, 
  isEdit = false, 
  onSuccess, 
  onCancel,
  onBulkImport
}) => {
  const [loading, setLoading] = React.useState(false);
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [formData, setFormData] = React.useState<CreateLinkListingData>({
    website_id: '',
    title: '',
    description: '',
    target_url: '',
    anchor_text: '',
    link_type: 'dofollow',
    position: 'content',
    price: 0,
    currency: 'MAD',
    minimum_contract_duration: 1,
    max_links_per_page: 1,
    status: 'active',
    images: [],
    tags: []
  });

  React.useEffect(() => {
    trackPageView('/dashboard/link-listings/form', 'Formulaire Annonce Lien | Back.ma');
    fetchWebsites();
    
    if (listing) {
      setFormData({
        website_id: listing.website_id,
        title: listing.title,
        description: listing.description,
        target_url: listing.target_url,
        anchor_text: listing.anchor_text,
        link_type: listing.link_type,
        position: listing.position,
        price: listing.price,
        currency: listing.currency,
        minimum_contract_duration: listing.minimum_contract_duration,
        max_links_per_page: listing.max_links_per_page || 1,
        status: listing.status as any,
        images: listing.images,
        tags: listing.tags
      });
    }
  }, [listing]);

  const fetchWebsites = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const websitesData = await getWebsites({ 
        user_id: user.id 
      });
      setWebsites(websitesData);
    } catch (error) {
      console.error('Error fetching websites:', error);
      toast.error('Erreur lors du chargement des sites web');
    }
  };

  const handleInputChange = (field: keyof CreateLinkListingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Utilisateur non connecté');
        return;
      }


      let result: LinkListing;

      if (isEdit && listing) {
        result = await updateLinkListing(listing.id, formData);
        toast.success('Annonce mise à jour avec succès');
      } else {
        result = await createLinkListing({
          ...formData,
          user_id: user.id
        });
        toast.success('Annonce créée avec succès');
      }

      onSuccess(result);
    } catch (error) {
      console.error('Error saving link listing:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const selectedWebsite = websites.find(w => w.id === formData.website_id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Modifier l\'annonce' : 'Ajouter un lien existant'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? 'Modifiez les détails de votre annonce' : 'Créez une annonce pour vendre un lien existant sur votre site'}
              </p>
            </div>
          </div>
          
          {!isEdit && onBulkImport && (
            <button
              onClick={onBulkImport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import en masse</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informations de base
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site web */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web *
                </label>
                <select
                  value={formData.website_id}
                  onChange={(e) => handleInputChange('website_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un site web</option>
                  {websites.map(website => (
                    <option key={website.id} value={website.id}>
                      {website.title} ({website.url})
                    </option>
                  ))}
                </select>
                {websites.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Aucun site web disponible. <Link to="/dashboard/websites" className="text-blue-600 hover:underline">Créez d'abord un site web</Link>
                  </p>
                )}
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'article (H1) *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Titre de l'article"
                />
              </div>

              {/* URL cible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL cible *
                </label>
                <input
                  type="url"
                  value={formData.target_url}
                  onChange={(e) => handleInputChange('target_url', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              {/* Texte d'ancrage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte d'ancrage
                </label>
                <input
                  type="text"
                  value={formData.anchor_text}
                  onChange={(e) => handleInputChange('anchor_text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Startup Tech Maroc (optionnel)"
                />
                <p className="text-xs text-gray-500 mt-1">Laissez vide pour laisser le choix à l'annonceur</p>
              </div>
            </div>
          </motion.div>

          {/* Détails du lien */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Détails du lien
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix fixe (MAD) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1500"
                />
                <p className="text-xs text-gray-500 mt-1">Prix unique à payer une fois</p>
              </div>


              {/* Max liens par page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max liens par page
                </label>
                <input
                  type="number"
                  value={formData.max_links_per_page}
                  onChange={(e) => handleInputChange('max_links_per_page', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
            </div>
          </motion.div>



          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between pt-6"
          >
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEdit ? 'Mettre à jour' : 'Publier l\'annonce'}</span>
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default LinkListingForm; 