import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  Globe, 
  Upload, 
  X, 
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Website, CreateWebsiteData, WebsiteCategory, WebsiteNiche, OwnerStatus } from '../../types';
import { createWebsite, updateWebsite, uploadImage, uploadMultipleImages } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface WebsiteFormProps {
  website?: Website;
  isEdit?: boolean;
  onSuccess?: (website: Website) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description: string;
  url: string;
  category: WebsiteCategory;
  niche: WebsiteNiche;
  owner_status: OwnerStatus;
  available_link_spots: number;
  average_response_time: number;
  content_quality: 'excellent' | 'good' | 'average' | 'poor';
  languages: string[];
  payment_methods: string[];
  contact_info: {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    website: string;
  };
  metrics: {
    monthly_traffic: number;
    domain_authority: number;
    page_authority: number;
    backlinks_count: number;
    organic_keywords: number;
    alexa_rank: number;
    google_indexed_pages: number;
  };
}

const WebsiteForm: React.FC<WebsiteFormProps> = ({ 
  website, 
  isEdit = false, 
  onSuccess, 
  onCancel 
}) => {
  const [loading, setLoading] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [logo, setLogo] = React.useState<string>(website?.logo || '');
  const [screenshots, setScreenshots] = React.useState<string[]>(website?.screenshots || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: {
      title: website?.title || '',
      description: website?.description || '',
      url: website?.url || '',
      category: website?.category || 'blog',
      niche: website?.niche || 'lifestyle',
      owner_status: website?.owner_status || 'particulier',
      available_link_spots: website?.available_link_spots || 1,
      average_response_time: website?.average_response_time || 24,
      content_quality: website?.content_quality || 'good',
      languages: website?.languages || ['Français'],
      payment_methods: website?.payment_methods || ['Virement bancaire'],
      contact_info: {
        name: website?.contact_info?.name || '',
        email: website?.contact_info?.email || '',
        phone: website?.contact_info?.phone || '',
        whatsapp: website?.contact_info?.whatsapp || '',
        website: website?.contact_info?.website || ''
      },
      metrics: {
        monthly_traffic: website?.metrics?.monthly_traffic || 0,
        domain_authority: website?.metrics?.domain_authority || 0,
        page_authority: website?.metrics?.page_authority || 0,
        backlinks_count: website?.metrics?.backlinks_count || 0,
        organic_keywords: website?.metrics?.organic_keywords || 0,
        alexa_rank: website?.metrics?.alexa_rank || 0,
        google_indexed_pages: website?.metrics?.google_indexed_pages || 0
      }
    }
  });

  const watchedLanguages = watch('languages');
  const watchedPaymentMethods = watch('payment_methods');

  const categories: { value: WebsiteCategory; label: string }[] = [
    { value: 'blog', label: 'Blog' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'actualites', label: 'Actualités' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'tech', label: 'Technologie' },
    { value: 'business', label: 'Business' },
    { value: 'sante', label: 'Santé' },
    { value: 'education', label: 'Éducation' },
    { value: 'immobilier', label: 'Immobilier' },
    { value: 'automobile', label: 'Automobile' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'cuisine', label: 'Cuisine' },
    { value: 'sport', label: 'Sport' },
    { value: 'culture', label: 'Culture' },
    { value: 'politique', label: 'Politique' },
    { value: 'economie', label: 'Économie' }
  ];

  const niches: { value: WebsiteNiche; label: string }[] = [
    { value: 'immobilier', label: 'Immobilier' },
    { value: 'sante', label: 'Santé' },
    { value: 'beaute', label: 'Beauté' },
    { value: 'mode', label: 'Mode' },
    { value: 'tech', label: 'Technologie' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Éducation' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'cuisine', label: 'Cuisine' },
    { value: 'sport', label: 'Sport' },
    { value: 'automobile', label: 'Automobile' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' },
    { value: 'actualites', label: 'Actualités' },
    { value: 'culture', label: 'Culture' },
    { value: 'politique', label: 'Politique' },
    { value: 'economie', label: 'Économie' },
    { value: 'art', label: 'Art' },
    { value: 'musique', label: 'Musique' },
    { value: 'cinema', label: 'Cinéma' }
  ];

  const ownerStatuses: { value: OwnerStatus; label: string }[] = [
    { value: 'particulier', label: 'Particulier' },
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'agence', label: 'Agence' }
  ];

  const contentQualities = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Bon' },
    { value: 'average', label: 'Moyen' },
    { value: 'poor', label: 'Faible' }
  ];

  const commonLanguages = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Allemand', 'Italien'];
  const commonPaymentMethods = [
    'Virement bancaire',
    'PayPal',
    'Stripe',
    'Carte bancaire',
    'Chèque',
    'Espèces'
  ];

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImages(true);
    try {
      const uploadedUrl = await uploadImage(file, 'website-logos');
      setLogo(uploadedUrl);
      toast.success('Logo téléchargé avec succès');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erreur lors du téléchargement du logo');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleScreenshotsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadMultipleImages(files, 'website-screenshots');
      setScreenshots(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} capture(s) téléchargée(s) avec succès`);
    } catch (error) {
      console.error('Error uploading screenshots:', error);
      toast.error('Erreur lors du téléchargement des captures');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const addLanguage = (language: string) => {
    if (!watchedLanguages.includes(language)) {
      setValue('languages', [...watchedLanguages, language]);
    }
  };

  const removeLanguage = (language: string) => {
    setValue('languages', watchedLanguages.filter(l => l !== language));
  };

  const addPaymentMethod = (method: string) => {
    if (!watchedPaymentMethods.includes(method)) {
      setValue('payment_methods', [...watchedPaymentMethods, method]);
    }
  };

  const removePaymentMethod = (method: string) => {
    setValue('payment_methods', watchedPaymentMethods.filter(m => m !== method));
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
      const websiteData: CreateWebsiteData = {
        ...data,
        slug: generateSlug(data.title),
        logo: logo || undefined,
        screenshots,
        status: 'pending_approval',
        meta_title: data.title,
        meta_description: data.description.substring(0, 160)
      };

      let result;
      if (isEdit && website) {
        result = await updateWebsite(website.id, websiteData);
        toast.success('Site web mis à jour avec succès');
      } else {
        result = await createWebsite(websiteData);
        toast.success('Site web créé avec succès');
      }

      onSuccess?.(result);
    } catch (error: any) {
      console.error('Error saving website:', error);
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
            {isEdit ? 'Modifier le site web' : 'Ajouter un nouveau site web'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit 
              ? 'Modifiez les informations de votre site web'
              : 'Ajoutez votre site web pour commencer à vendre des liens'
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
                  Titre du site web *
                </label>
                <input
                  {...register('title', { required: 'Le titre est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mon Blog Tech"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL du site web *
                </label>
                <input
                  {...register('url', { 
                    required: 'L\'URL est requise',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'URL invalide (doit commencer par http:// ou https://)'
                    }
                  })}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://monsite.com"
                />
                {errors.url && (
                  <p className="text-red-600 text-sm mt-1">{errors.url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  {...register('category', { required: 'La catégorie est requise' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niche *
                </label>
                <select
                  {...register('niche', { required: 'La niche est requise' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {niches.map(niche => (
                    <option key={niche.value} value={niche.value}>
                      {niche.label}
                    </option>
                  ))}
                </select>
                {errors.niche && (
                  <p className="text-red-600 text-sm mt-1">{errors.niche.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut du propriétaire *
                </label>
                <select
                  {...register('owner_status', { required: 'Le statut est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ownerStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.owner_status && (
                  <p className="text-red-600 text-sm mt-1">{errors.owner_status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualité du contenu *
                </label>
                <select
                  {...register('content_quality', { required: 'La qualité est requise' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {contentQualities.map(quality => (
                    <option key={quality.value} value={quality.value}>
                      {quality.label}
                    </option>
                  ))}
                </select>
                {errors.content_quality && (
                  <p className="text-red-600 text-sm mt-1">{errors.content_quality.message}</p>
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
                  minLength: { value: 50, message: 'La description doit faire au moins 50 caractères' }
                })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez votre site web, son contenu, son audience..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Configuration des liens */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration des liens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'emplacements disponibles *
                </label>
                <input
                  {...register('available_link_spots', { 
                    required: 'Le nombre d\'emplacements est requis',
                    min: { value: 1, message: 'Au moins 1 emplacement requis' }
                  })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.available_link_spots && (
                  <p className="text-red-600 text-sm mt-1">{errors.available_link_spots.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps de réponse moyen (heures) *
                </label>
                <input
                  {...register('average_response_time', { 
                    required: 'Le temps de réponse est requis',
                    min: { value: 1, message: 'Au moins 1 heure' }
                  })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.average_response_time && (
                  <p className="text-red-600 text-sm mt-1">{errors.average_response_time.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Métriques SEO */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Métriques SEO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trafic mensuel
                </label>
                <input
                  {...register('metrics.monthly_traffic', { min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Authority (0-100)
                </label>
                <input
                  {...register('metrics.domain_authority', { min: 0, max: 100 })}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Authority (0-100)
                </label>
                <input
                  {...register('metrics.page_authority', { min: 0, max: 100 })}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de backlinks
                </label>
                <input
                  {...register('metrics.backlinks_count', { min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mots-clés organiques
                </label>
                <input
                  {...register('metrics.organic_keywords', { min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classement Alexa
                </label>
                <input
                  {...register('metrics.alexa_rank', { min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100000"
                />
              </div>
            </div>
          </div>

          {/* Langues */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Langues du site</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedLanguages.map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{lang}</span>
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {commonLanguages.filter(lang => !watchedLanguages.includes(lang)).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => addLanguage(lang)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50"
                  >
                    + {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de paiement acceptées</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedPaymentMethods.map((method, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{method}</span>
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(method)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {commonPaymentMethods.filter(method => !watchedPaymentMethods.includes(method)).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => addPaymentMethod(method)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50"
                  >
                    + {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  {...register('contact_info.name', { required: 'Le nom est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                />
                {errors.contact_info?.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.contact_info.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  {...register('contact_info.email', { 
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide'
                    }
                  })}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
                {errors.contact_info?.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.contact_info.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  {...register('contact_info.phone')}
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+212 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  {...register('contact_info.whatsapp')}
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+212 6 12 34 56 78"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web personnel
                </label>
                <input
                  {...register('contact_info.website')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://votresite.com"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            
            {/* Logo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo du site web
              </label>
              <div className="flex items-center space-x-4">
                {logo && (
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingImages}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{uploadingImages ? 'Téléchargement...' : 'Télécharger un logo'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Captures d'écran du site
              </label>
              <div className="space-y-4">
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {screenshots.map((screenshot, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotsUpload}
                    disabled={uploadingImages}
                    className="hidden"
                    id="screenshots-upload"
                  />
                  <label
                    htmlFor="screenshots-upload"
                    className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{uploadingImages ? 'Téléchargement...' : 'Ajouter des captures d\'écran'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

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
                  <span>{isEdit ? 'Mettre à jour' : 'Créer le site web'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebsiteForm; 