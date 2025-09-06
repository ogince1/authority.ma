import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon,
  Building,
  User,
  Target,
  Lightbulb,
  TrendingUp,
  Hash,
  Star,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateSuccessStoryData, SuccessStory } from '../../types';
import { createSuccessStory, updateSuccessStory } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SuccessStoryFormProps {
  story?: SuccessStory;
  isEdit?: boolean;
}

interface FormData extends Omit<CreateSuccessStoryData, 'tags' | 'images' | 'metrics'> {
  tags_text: string;
  images_text: string;
  metrics_text: string;
}

const SuccessStoryForm: React.FC<SuccessStoryFormProps> = ({ story, isEdit = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: story ? {
      title: story.title,
      slug: story.slug,
      company_name: story.company_name,
      founder_name: story.founder_name,
      founder_image: story.founder_image || '',
      company_logo: story.company_logo || '',
      industry: story.industry,
      description: story.description,
      story_content: story.story_content,
      challenge: story.challenge || '',
      solution: story.solution || '',
      results: story.results || '',
      metrics_text: JSON.stringify(story.metrics, null, 2),
      images_text: story.images.join('\n'),
      tags_text: story.tags.join(', '),
      featured: story.featured,
      status: story.status,
      meta_title: story.meta_title || '',
      meta_description: story.meta_description || ''
    } : {
      status: 'draft',
      featured: false,
      metrics_text: '{\n  "revenue": "",\n  "growth": "",\n  "clients": ""\n}'
    }
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      let metrics = {};
      try {
        metrics = JSON.parse(data.metrics_text);
      } catch (e) {
        toast.error('Format JSON invalide pour les métriques');
        setLoading(false);
        return;
      }

      const storyData: CreateSuccessStoryData = {
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        company_name: data.company_name,
        founder_name: data.founder_name,
        founder_image: data.founder_image || undefined,
        company_logo: data.company_logo || undefined,
        industry: data.industry,
        description: data.description,
        story_content: data.story_content,
        challenge: data.challenge || undefined,
        solution: data.solution || undefined,
        results: data.results || undefined,
        metrics,
        images: data.images_text.split('\n').map(i => i.trim()).filter(i => i),
        tags: data.tags_text.split(',').map(t => t.trim()).filter(t => t),
        featured: data.featured,
        status: data.status,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined
      };

      if (isEdit && story) {
        await updateSuccessStory(story.id, storyData);
        toast.success('Success story mise à jour avec succès !');
      } else {
        await createSuccessStory(storyData);
        toast.success('Success story créée avec succès !');
      }

      navigate('/admin/success-stories');
    } catch (error) {
      console.error('Error saving success story:', error);
      toast.error('Erreur lors de la sauvegarde de la success story');
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    'SaaS',
    'E-commerce',
    'Fintech',
    'EdTech',
    'HealthTech',
    'AgriTech',
    'Logistique',
    'Immobilier',
    'Tourisme',
    'Gaming',
    'IA/ML',
    'Blockchain',
    'Autre'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/success-stories')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier la Success Story' : 'Nouvelle Success Story'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Modifiez les informations de la success story' : 'Créez une nouvelle histoire de réussite'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informations de Base
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'Histoire *
                </label>
                <input
                  {...register('title', { required: 'Le titre est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: De l'idée à 1M MAD de CA : L'histoire de TechFlow"
                  onChange={(e) => {
                    setValue('slug', generateSlug(e.target.value));
                  }}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'Activité *
                </label>
                <select
                  {...register('industry', { required: 'Le secteur est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un secteur</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                )}
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                {...register('slug', { required: 'Le slug est requis' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="mon-success-story-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL finale: /success-stories/{watch('slug')}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description Courte *
              </label>
              <textarea
                {...register('description', { required: 'La description est requise' })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Résumé court de l'histoire qui apparaîtra dans les listes..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Company & Founder */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              <Building className="h-4 w-4 inline mr-2" />
              Entreprise et Fondateur
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'Entreprise *
                </label>
                <input
                  {...register('company_name', { required: 'Le nom de l\'entreprise est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: TechFlow"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Fondateur *
                </label>
                <input
                  {...register('founder_name', { required: 'Le nom du fondateur est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Youssef Benali"
                />
                {errors.founder_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.founder_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="h-4 w-4 inline mr-2" />
                  Logo de l'Entreprise
                </label>
                <input
                  {...register('company_logo')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://images.pexels.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Photo du Fondateur
                </label>
                <input
                  {...register('founder_image')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://images.pexels.com/..."
                />
              </div>
            </div>
          </div>

          {/* Story Content */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Contenu de l'Histoire
            </h2>

            {/* Main Story */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Histoire Complète *
              </label>
              <textarea
                {...register('story_content', { required: 'Le contenu de l\'histoire est requis' })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Racontez l'histoire complète de cette réussite..."
              />
              {errors.story_content && (
                <p className="mt-1 text-sm text-red-600">{errors.story_content.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Challenge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="h-4 w-4 inline mr-2" />
                  Défi Relevé
                </label>
                <textarea
                  {...register('challenge')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Quel était le principal défi à relever ?"
                />
              </div>

              {/* Solution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lightbulb className="h-4 w-4 inline mr-2" />
                  Solution Apportée
                </label>
                <textarea
                  {...register('solution')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Comment le problème a-t-il été résolu ?"
                />
              </div>

              {/* Results */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="h-4 w-4 inline mr-2" />
                  Résultats Obtenus
                </label>
                <textarea
                  {...register('results')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Quels résultats ont été obtenus ?"
                />
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Métriques Clés
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métriques (Format JSON)
              </label>
              <textarea
                {...register('metrics_text')}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                placeholder='{"revenue": "1000000", "growth": "300%", "clients": "150+"}'
              />
              <p className="mt-1 text-xs text-gray-500">
                Format JSON avec les métriques importantes (ex: revenue, growth, clients, etc.)
              </p>
            </div>
          </div>

          {/* Media & Tags */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Médias et Tags
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="h-4 w-4 inline mr-2" />
                  Images Supplémentaires
                </label>
                <textarea
                  {...register('images_text')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://images.pexels.com/..."
                />
                <p className="mt-1 text-xs text-gray-500">Une URL par ligne</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="h-4 w-4 inline mr-2" />
                  Tags
                </label>
                <input
                  {...register('tags_text')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="SaaS, Croissance, Innovation..."
                />
                <p className="mt-1 text-xs text-gray-500">Séparez par des virgules</p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Paramètres
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Featured */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    {...register('featured')}
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Histoire mise en avant</span>
                </label>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  {...register('status', { required: 'Le statut est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="archived">Archivé</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              <Globe className="h-4 w-4 inline mr-2" />
              SEO (Optionnel)
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méta Titre
                </label>
                <input
                  {...register('meta_title')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Titre SEO optimisé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méta Description
                </label>
                <textarea
                  {...register('meta_description')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Description SEO optimisée"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/success-stories')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEdit ? 'Mettre à jour' : 'Créer la success story'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SuccessStoryForm;