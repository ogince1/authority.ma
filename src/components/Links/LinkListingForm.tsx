import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  Link as LinkIcon, 
  Save, 
  Plus,
  X,
  Tag,
  DollarSign,
  Clock,
  Globe,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, CreateLinkListingData, LinkType, LinkPosition, Website } from '../../types';
import { createLinkListing, updateLinkListing, getWebsites } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface LinkListingFormProps {
  linkListing?: LinkListing;
  isEdit?: boolean;
  onSuccess?: (linkListing: LinkListing) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description: string;
  website_id: string;
  target_url: string;
  anchor_text: string;
  link_type: LinkType;
  position: LinkPosition;
  price: number;
  currency: 'MAD' | 'EUR' | 'USD';
  minimum_contract_duration: number;
  max_links_per_page: number;
  allowed_niches: string[];
  forbidden_keywords: string[];
  content_requirements: string;
}

const LinkListingForm: React.FC<LinkListingFormProps> = ({ 
  linkListing, 
  isEdit = false, 
  onSuccess, 
  onCancel 
}) => {
  const [loading, setLoading] = React.useState(false);
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = React.useState<Website | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: {
      title: linkListing?.title || '',
      description: linkListing?.description || '',
      website_id: linkListing?.website_id || '',
      target_url: linkListing?.target_url || '',
      anchor_text: linkListing?.anchor_text || '',
      link_type: linkListing?.link_type || 'dofollow',
      position: linkListing?.position || 'content',
      price: linkListing?.price || 0,
      currency: linkListing?.currency || 'MAD',
      minimum_contract_duration: linkListing?.minimum_contract_duration || 1,
      max_links_per_page: linkListing?.max_links_per_page || 1,
      allowed_niches: linkListing?.allowed_niches || [],
      forbidden_keywords: linkListing?.forbidden_keywords || [],
      content_requirements: linkListing?.content_requirements || ''
    }
  });

  const watchedAllowedNiches = watch('allowed_niches');
  const watchedForbiddenKeywords = watch('forbidden_keywords');
  const watchedWebsiteId = watch('website_id');

  const linkTypes: { value: LinkType; label: string; description: string }[] = [
    { 
      value: 'dofollow', 
      label: 'Dofollow', 
      description: 'Lien qui transmet l\'autorité SEO' 
    },
    { 
      value: 'nofollow', 
      label: 'Nofollow', 
      description: 'Lien qui ne transmet pas l\'autorité SEO' 
    },
    { 
      value: 'sponsored', 
      label: 'Sponsored', 
      description: 'Lien sponsorisé (nofollow + sponsored)' 
    },
    { 
      value: 'ugc', 
      label: 'UGC', 
      description: 'Contenu généré par l\'utilisateur' 
    }
  ];

  const positions: { value: LinkPosition; label: string; description: string }[] = [
    { value: 'header', label: 'Header', description: 'En-tête du site' },
    { value: 'footer', label: 'Footer', description: 'Pied de page' },
    { value: 'sidebar', label: 'Sidebar', description: 'Barre latérale' },
    { value: 'content', label: 'Contenu', description: 'Dans le contenu principal' },
    { value: 'menu', label: 'Menu', description: 'Dans la navigation' },
    { value: 'popup', label: 'Popup', description: 'Fenêtre popup' }
  ];

  const currencies = [
    { value: 'MAD', label: 'Dirham Marocain (MAD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar US (USD)' }
  ];

  const commonNiches = [
    'immobilier', 'sante', 'beaute', 'mode', 'tech', 'finance', 'education',
    'voyage', 'cuisine', 'sport', 'automobile', 'lifestyle', 'business',
    'actualites', 'culture', 'politique', 'economie', 'art', 'musique', 'cinema'
  ];

  const commonForbiddenKeywords = [
    'casino', 'poker', 'betting', 'gambling', 'porn', 'adult', 'viagra',
    'cigarettes', 'alcohol', 'drugs', 'weapons', 'hacking', 'crack'
  ];

  React.useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const websitesData = await getWebsites({ status: 'active' });
        setWebsites(websitesData);
      } catch (error) {
        console.error('Error fetching websites:', error);
        toast.error('Erreur lors du chargement des sites web');
      }
    };

    fetchWebsites();
  }, []);

  React.useEffect(() => {
    if (watchedWebsiteId) {
      const website = websites.find(w => w.id === watchedWebsiteId);
      setSelectedWebsite(website || null);
    }
  }, [watchedWebsiteId, websites]);

  const addAllowedNiche = (niche: string) => {
    if (!watchedAllowedNiches.includes(niche)) {
      setValue('allowed_niches', [...watchedAllowedNiches, niche]);
    }
  };

  const removeAllowedNiche = (niche: string) => {
    setValue('allowed_niches', watchedAllowedNiches.filter(n => n !== niche));
  };

  const addForbiddenKeyword = (keyword: string) => {
    if (!watchedForbiddenKeywords.includes(keyword)) {
      setValue('forbidden_keywords', [...watchedForbiddenKeywords, keyword]);
    }
  };

  const removeForbiddenKeyword = (keyword: string) => {
    setValue('forbidden_keywords', watchedForbiddenKeywords.filter(k => k !== keyword));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const linkListingData: CreateLinkListingData = {
        ...data,
        slug: generateSlug(data.title),
        status: 'active'
      };

      let result;
      if (isEdit && linkListing) {
        result = await updateLinkListing(linkListing.id, linkListingData);
        toast.success('Annonce mise à jour avec succès');
      } else {
        result = await createLinkListing(linkListingData);
        toast.success('Annonce créée avec succès');
      }

      onSuccess?.(result);
    } catch (error: any) {
      console.error('Error saving link listing:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier l\'annonce' : 'Créer une nouvelle annonce de lien'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit 
              ? 'Modifiez les informations de votre annonce de lien'
              : 'Créez une annonce pour vendre des liens sur votre site web'
            }
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Informations de base */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'annonce *
                </label>
                <input
                  {...register('title', { required: 'Le titre est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lien dofollow dans le contenu"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web *
                </label>
                <select
                  {...register('website_id', { required: 'Le site web est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un site web</option>
                  {websites.map(website => (
                    <option key={website.id} value={website.id}>
                      {website.title} ({website.url})
                    </option>
                  ))}
                </select>
                {errors.website_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.website_id.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { 
                  required: 'La description est requise',
                  minLength: { value: 30, message: 'La description doit faire au moins 30 caractères' }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez votre annonce, les conditions, les avantages..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Informations du lien */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du lien</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de destination *
                </label>
                <input
                  {...register('target_url', { 
                    required: 'L\'URL de destination est requise',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'URL invalide (doit commencer par http:// ou https://)'
                    }
                  })}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemple.com"
                />
                {errors.target_url && (
                  <p className="text-red-600 text-sm mt-1">{errors.target_url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte d'ancrage *
                </label>
                <input
                  {...register('anchor_text', { required: 'Le texte d\'ancrage est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre texte d'ancrage"
                />
                {errors.anchor_text && (
                  <p className="text-red-600 text-sm mt-1">{errors.anchor_text.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de lien *
                </label>
                <select
                  {...register('link_type', { required: 'Le type de lien est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {linkTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
                {errors.link_type && (
                  <p className="text-red-600 text-sm mt-1">{errors.link_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position du lien *
                </label>
                <select
                  {...register('position', { required: 'La position est requise' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {positions.map(position => (
                    <option key={position.value} value={position.value}>
                      {position.label} - {position.description}
                    </option>
                  ))}
                </select>
                {errors.position && (
                  <p className="text-red-600 text-sm mt-1">{errors.position.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Prix et conditions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prix et conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix mensuel *
                </label>
                <div className="flex">
                  <input
                    {...register('price', { 
                      required: 'Le prix est requis',
                      min: { value: 0, message: 'Le prix doit être positif' }
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                  <select
                    {...register('currency', { required: 'La devise est requise' })}
                    className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.value}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.price && (
                  <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée minimale (mois) *
                </label>
                <input
                  {...register('minimum_contract_duration', { 
                    required: 'La durée minimale est requise',
                    min: { value: 1, message: 'Au moins 1 mois' }
                  })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3"
                />
                {errors.minimum_contract_duration && (
                  <p className="text-red-600 text-sm mt-1">{errors.minimum_contract_duration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liens max par page *
                </label>
                <input
                  {...register('max_links_per_page', { 
                    required: 'Le nombre de liens max est requis',
                    min: { value: 1, message: 'Au moins 1 lien' }
                  })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                {errors.max_links_per_page && (
                  <p className="text-red-600 text-sm mt-1">{errors.max_links_per_page.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Niches autorisées */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Niches autorisées</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedAllowedNiches.map((niche, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{niche}</span>
                    <button
                      type="button"
                      onClick={() => removeAllowedNiche(niche)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {commonNiches.filter(niche => !watchedAllowedNiches.includes(niche)).map(niche => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => addAllowedNiche(niche)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50"
                  >
                    + {niche}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Laissez vide pour accepter toutes les niches
              </p>
            </div>
          </div>

          {/* Mots-clés interdits */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mots-clés interdits</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedForbiddenKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => removeForbiddenKeyword(keyword)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {commonForbiddenKeywords.filter(keyword => !watchedForbiddenKeywords.includes(keyword)).map(keyword => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => addForbiddenKeyword(keyword)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50"
                  >
                    + {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exigences de contenu */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Exigences de contenu</h2>
            <textarea
              {...register('content_requirements')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez vos exigences pour le contenu (longueur, style, ton, etc.)"
            />
          </div>

          {/* Informations du site web sélectionné */}
          {selectedWebsite && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du site web</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Site web</div>
                  <div className="font-medium">{selectedWebsite.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Domain Authority</div>
                  <div className="font-medium">{selectedWebsite.metrics?.domain_authority || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Trafic mensuel</div>
                  <div className="font-medium">
                    {selectedWebsite.metrics?.monthly_traffic 
                      ? `${(selectedWebsite.metrics.monthly_traffic / 1000).toFixed(1)}K`
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                  <span>{isEdit ? 'Mettre à jour' : 'Créer l\'annonce'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkListingForm; 