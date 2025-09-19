import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon,
  Tag,
  FileText,
  Eye,
  Globe,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';
import { CreateBlogPostData, BlogPost } from '../../types';
import { createBlogPost, updateBlogPost } from '../../lib/supabase';
import toast from 'react-hot-toast';
import '../../styles/markdown-editor.css';

interface BlogFormProps {
  post?: BlogPost;
  isEdit?: boolean;
}

interface FormData extends Omit<CreateBlogPostData, 'tags' | 'images'> {
  tags_text: string;
  images_text: string;
}

const BlogForm: React.FC<BlogFormProps> = ({ post, isEdit = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [content, setContent] = React.useState(post?.content || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: post ? {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image || '',
      images_text: (post.images || []).join('\n'),
      category: post.category,
      tags_text: (post.tags || []).join(', '),
      status: post.status,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || ''
    } : {
      status: 'draft'
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
      const postData: CreateBlogPostData = {
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        excerpt: data.excerpt,
        content: content,
        featured_image: data.featured_image || undefined,
        images: data.images_text.split('\n').map(i => i.trim()).filter(i => i),
        category: data.category,
        tags: data.tags_text.split(',').map(t => t.trim()).filter(t => t),
        status: data.status,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined
      };

      if (isEdit && post) {
        await updateBlogPost(post.id, postData);
        toast.success('Article mis à jour avec succès !');
      } else {
        await createBlogPost(postData);
        toast.success('Article créé avec succès !');
      }

      navigate('/admin/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error('Erreur lors de la sauvegarde de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Actualités',
    'Guides',
    'Entrepreneuriat',
    'Technologie',
    'Investissement',
    'Startups',
    'Innovation',
    'Conseils'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/blog')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier l\'Article' : 'Nouvel Article'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Modifiez les informations de l\'article' : 'Créez un nouvel article de blog'}
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
                  Titre *
                </label>
                <input
                  {...register('title', { required: 'Le titre est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Guide complet pour entrepreneurs"
                  onChange={(e) => {
                    setValue('slug', generateSlug(e.target.value));
                  }}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-2" />
                  Catégorie *
                </label>
                <select
                  {...register('category', { required: 'La catégorie est requise' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
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
                placeholder="mon-article-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL finale: /blog/{watch('slug')}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Extrait *
              </label>
              <textarea
                {...register('excerpt', { required: 'L\'extrait est requis' })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Résumé court de l'article qui apparaîtra dans les listes..."
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={400}
                  data-color-mode="light"
                  textareaProps={{
                    placeholder: 'Écrivez votre article en Markdown...\n\n## Exemples de formatage:\n\n**Texte en gras**\n*Texte en italique*\n\n[Lien](https://example.com)\n\n![Image](https://example.com/image.jpg)\n\n- Liste à puces\n- Élément 2\n\n1. Liste numérotée\n2. Élément 2\n\n```\nCode block\n```\n\n> Citation\n\n---\n\n### Sous-titre'
                  }}
                />
              </div>
              {!content && (
                <p className="mt-1 text-sm text-red-600">Le contenu est requis</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                💡 <strong>Astuce :</strong> Utilisez la syntaxe Markdown pour formater votre contenu. 
                La prévisualisation s'affiche en temps réel à droite.
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Médias
            </h2>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Image à la Une
              </label>
              <input
                {...register('featured_image')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://images.pexels.com/photos/..."
              />
              <p className="mt-1 text-xs text-gray-500">URL de l'image principale de l'article</p>
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images Supplémentaires
              </label>
              <textarea
                {...register('images_text')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://images.pexels.com/photos/..."
              />
              <p className="mt-1 text-xs text-gray-500">Une URL par ligne</p>
            </div>
          </div>

          {/* Tags and Status */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Organisation
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
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
                  placeholder="startup, innovation, guide..."
                />
                <p className="mt-1 text-xs text-gray-500">Séparez par des virgules</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Eye className="h-4 w-4 inline mr-2" />
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
                onClick={() => navigate('/admin/blog')}
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
                    <span>{isEdit ? 'Mettre à jour' : 'Créer l\'article'}</span>
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

export default BlogForm;