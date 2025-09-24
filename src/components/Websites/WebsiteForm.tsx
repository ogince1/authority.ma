import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  Globe, 
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
import { Website, CreateWebsiteData, WebsiteCategory, WebsiteNiche } from '../../types';
import { createWebsite, updateWebsite } from '../../lib/supabase';
import { WEBSITE_CATEGORIES } from '../../utils/categories';
import toast from 'react-hot-toast';

interface WebsiteFormProps {
  website?: Website;
  isEdit?: boolean;
  onSuccess?: (website: Website) => void;
  onCancel?: () => void;
  onBulkImport?: () => void;
}

interface FormData {
  title: string;
  description: string;
  url: string;
  category: WebsiteCategory;
  available_link_spots: number;
  languages: string[];
  metrics: {
    monthly_traffic: number;
    domain_authority: number;
    organic_keywords: number;
  };
}

const WebsiteForm: React.FC<WebsiteFormProps> = ({ 
  website, 
  isEdit = false, 
  onSuccess, 
  onCancel,
  onBulkImport
}) => {
  const [loading, setLoading] = React.useState(false);

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
      available_link_spots: website?.available_link_spots || 1,
      languages: website?.languages || ['Français'],
      metrics: {
        monthly_traffic: website?.metrics?.monthly_traffic || 0,
        domain_authority: website?.metrics?.domain_authority || 0,
        organic_keywords: website?.metrics?.organic_keywords || 0
      }
    }
  });

  const watchedLanguages = watch('languages');

  const categories = WEBSITE_CATEGORIES;



  const commonLanguages = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Allemand', 'Italien'];



  const addLanguage = (language: string) => {
    if (!watchedLanguages.includes(language)) {
      setValue('languages', [...watchedLanguages, language]);
    }
  };

  const removeLanguage = (language: string) => {
    setValue('languages', watchedLanguages.filter(l => l !== language));
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
        status: 'active',
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


            </div>

          </div>

          {/* Configuration des liens */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration des liens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prix pour nouveaux articles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix pour nouveaux articles (MAD) *
                </label>
                <input
                  type="number"
                  {...register('new_article_price', { 
                    required: 'Le prix est requis',
                    min: { value: 10, message: 'Le prix minimum est de 10 MAD' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Prix en MAD"
                  min="10"
                  onFocus={(e) => e.target.select()}
                />
                {errors.new_article_price && (
                  <p className="text-red-600 text-sm mt-1">{errors.new_article_price.message}</p>
                )}
              </div>

              {/* Accepter nouveaux articles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accepter nouveaux articles
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('is_new_article')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Permettre aux annonceurs de créer de nouveaux articles sur ce site
                  </span>
                </div>
              </div>
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
                  onFocus={(e) => e.target.select()}
                />
                {errors.available_link_spots && (
                  <p className="text-red-600 text-sm mt-1">{errors.available_link_spots.message}</p>
                )}
              </div>

            </div>
          </div>

          {/* Métriques SEO */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Métriques SEO</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trust Flow
                </label>
                <input
                  {...register('metrics.domain_authority', { min: 0, max: 100 })}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                  onFocus={(e) => e.target.select()}
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
                  onFocus={(e) => e.target.select()}
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




          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              {!isEdit && onBulkImport && (
                <button
                  type="button"
                  onClick={onBulkImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajout multiple</span>
                </button>
              )}
            </div>
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