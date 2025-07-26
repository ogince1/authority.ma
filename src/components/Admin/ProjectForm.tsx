import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  DollarSign,
  Tag,
  Globe,
  FileText,
  Code,
  Image as ImageIcon,
  Upload,
  X,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateProjectData, Project, IndustrySector, ProjectType, ProjectObjective, OwnerStatus, ProjectMetrics } from '../../types';
import { createProject, updateProject, getCurrentUser, uploadMultipleImages, deleteImage } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ProjectFormProps {
  project?: Project;
  isEdit?: boolean;
}

interface FormData extends Omit<CreateProjectData, 'features' | 'tech_stack' | 'images' | 'metrics'> {
  features_text: string;
  tech_stack_text: string;
  industry_tags_text: string;
  images_text: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  project_type: ProjectType;
  industry_sector: IndustrySector;
  objective: ProjectObjective;
  owner_status: OwnerStatus;
  show_price: boolean;
  // Champs pour les métriques
  monthly_traffic?: number;
  leads_clients?: number;
  revenue?: number;
  material_condition?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, isEdit = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [uploadedImages, setUploadedImages] = React.useState<string[]>(project?.images || []);
  const [uploadingImages, setUploadingImages] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: project ? {
      title: project.title,
      description: project.description,
      category: project.category,
      price: project.price,
      demo_url: project.demo_url || '',
      features_text: project.features.join(', '),
      tech_stack_text: project.tech_stack.join(', '),
      industry_tags_text: project.industry_tags.join(', '),
      images_text: project.images.join('\n'),
      meta_title: project.meta_title || '',
      meta_description: project.meta_description || '',
      slug: project.slug,
      contact_email: project.contact_info?.email || '',
      contact_phone: project.contact_info?.phone || '',
      contact_website: project.contact_info?.website || '',
      project_type: project.project_type || 'digital',
      industry_sector: project.industry_sector || 'services',
      objective: project.objective || 'vente',
      owner_status: project.owner_status || 'professionnel',
      show_price: project.show_price ?? true,
      monthly_traffic: project.metrics?.monthly_traffic || 0,
      leads_clients: project.metrics?.leads_clients || 0,
      revenue: project.metrics?.revenue || 0,
      material_condition: project.metrics?.material_condition || ''
    } : {
      project_type: 'digital',
      industry_sector: 'services',
      objective: 'vente',
      owner_status: 'professionnel',
      show_price: true
    }
  });

  const selectedCategory = watch('category');
  const selectedProjectType = watch('project_type');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadMultipleImages(files);
      const newImages = [...uploadedImages, ...uploadedUrls];
      setUploadedImages(newImages);
      setValue('images_text', newImages.join('\n'));
      toast.success(`${files.length} image(s) uploadée(s) avec succès !`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Erreur lors de l\'upload des images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await deleteImage(imageUrl);
      const newImages = uploadedImages.filter(img => img !== imageUrl);
      setUploadedImages(newImages);
      setValue('images_text', newImages.join('\n'));
      toast.success('Image supprimée avec succès !');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erreur lors de la suppression de l\'image');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Récupérer l'utilisateur courant pour associer le projet
      const currentUser = await getCurrentUser();
      
      const projectData: CreateProjectData = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        demo_url: data.demo_url || undefined,
        features: data.features_text.split(',').map(f => f.trim()).filter(f => f),
        tech_stack: data.tech_stack_text.split(',').map(t => t.trim()).filter(t => t),
        industry_tags: data.industry_tags_text.split(',').map(t => t.trim()).filter(t => t),
        images: uploadedImages.length > 0 ? uploadedImages : data.images_text.split('\n').map(i => i.trim()).filter(i => i),
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        slug: data.slug || generateSlug(data.title),
        user_id: currentUser?.id,
        project_type: data.project_type,
        industry_sector: data.industry_sector,
        objective: data.objective,
        owner_status: data.owner_status,
        show_price: data.show_price,
        metrics: {
          monthly_traffic: data.monthly_traffic || undefined,
          leads_clients: data.leads_clients || undefined,
          revenue: data.revenue || undefined,
          material_condition: data.material_condition || undefined
        },
        contact_info: {
          email: data.contact_email || undefined,
          phone: data.contact_phone || undefined,
          website: data.contact_website || undefined
        }
      };

      if (isEdit && project) {
        await updateProject(project.id, projectData);
        toast.success('Projet mis à jour avec succès !');
      } else {
        await createProject(projectData);
        toast.success('Votre projet a été créé avec succès !');
      }

      // Rediriger vers la bonne page en fonction du contexte
      const isAdmin = window.location.pathname.includes('/admin');
      navigate(isAdmin ? '/admin/projects' : '/dashboard/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Erreur lors de la sauvegarde du projet');
    } finally {
      setLoading(false);
    }
  };

  const digitalCategories = [
    { value: 'mvp', label: 'MVP', description: 'Produit Minimum Viable', icon: '🚀' },
    { value: 'startup', label: 'Startup', description: 'Entreprise en développement', icon: '🏢' },
    { value: 'website', label: 'Site Web', description: 'Site web simple', icon: '🌐' },
    { value: 'site_web_actif', label: 'Site Web Actif', description: 'Site avec trafic établi', icon: '📈' },
    { value: 'domaine_site_trafic', label: 'Domaine + Site + Trafic', description: 'Package complet', icon: '🎯' },
    { value: 'startup_tech', label: 'Startup Tech', description: 'Startup technologique', icon: '💻' },
    { value: 'application_mobile', label: 'Application Mobile', description: 'App mobile native/hybride', icon: '📱' },
    { value: 'plateforme_saas', label: 'Plateforme SaaS', description: 'Logiciel en tant que service', icon: '☁️' }
  ];

  const realCategories = [
    { value: 'fonds_commerce', label: 'Fonds de Commerce', description: 'Commerce établi', icon: '🏪' },
    { value: 'local_commercial', label: 'Local Commercial', description: 'Espace commercial', icon: '🏬' },
    { value: 'projet_industriel', label: 'Projet Industriel', description: 'Industrie manufacturière', icon: '🏭' },
    { value: 'franchise', label: 'Franchise', description: 'Système de franchise', icon: '🤝' },
    { value: 'restaurant_luxe', label: 'Restaurant de Luxe', description: 'Restauration haut de gamme', icon: '🍽️' },
    { value: 'salon_luxe', label: 'Salon de Luxe', description: 'Salon beauté/coiffure', icon: '💄' },
    { value: 'immobilier', label: 'Immobilier', description: 'Biens immobiliers', icon: '🏘️' },
    { value: 'hotellerie', label: 'Hôtellerie', description: 'Hébergement touristique', icon: '🏨' },
    { value: 'industrie', label: 'Industrie', description: 'Secteur industriel', icon: '⚙️' },
    { value: 'agriculture', label: 'Agriculture', description: 'Secteur agricole', icon: '🌾' },
    { value: 'energie', label: 'Énergie', description: 'Secteur énergétique', icon: '⚡' },
    { value: 'logistique', label: 'Logistique', description: 'Transport et logistique', icon: '🚚' },
    { value: 'mines', label: 'Mines', description: 'Extraction minière', icon: '⛏️' },
    { value: 'art', label: 'Art et Collections', description: 'Œuvres d\'art', icon: '🎨' },
    { value: 'commerce', label: 'Commerce', description: 'Commerce général', icon: '🛍️' }
  ];

  const industrySectors = [
    { value: 'immobilier', label: 'Immobilier' },
    { value: 'artisanat', label: 'Artisanat' },
    { value: 'services', label: 'Services' },
    { value: 'e-commerce', label: 'E-commerce' },
    { value: 'technologie', label: 'Technologie' },
    { value: 'sante', label: 'Santé' },
    { value: 'education', label: 'Éducation' },
    { value: 'finance', label: 'Finance' },
    { value: 'tourisme', label: 'Tourisme' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'industrie', label: 'Industrie' },
    { value: 'energie', label: 'Énergie' },
    { value: 'logistique', label: 'Logistique' },
    { value: 'art', label: 'Art' },
    { value: 'franchise', label: 'Franchise' },
    { value: 'hotellerie', label: 'Hôtellerie' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'conseil', label: 'Conseil' },
    { value: 'transport', label: 'Transport' }
  ];

  const industryTagsExamples = [
    'SaaS', 'E-commerce', 'Fintech', 'EdTech', 'HealthTech', 'AgriTech'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const isAdmin = window.location.pathname.includes('/admin');
              navigate(isAdmin ? '/admin/projects' : '/dashboard/projects');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier le Projet' : 'Nouveau Projet'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Modifiez les informations du projet' : 'Ajoutez un nouveau projet à la marketplace'}
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
          {/* 1. Objectif du Projet - EN PREMIER */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              🎯 Objectif du Projet
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Quel est votre objectif ? *
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  watch('objective') === 'vente' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    {...register('objective', { required: 'L\'objectif est requis' })}
                    type="radio"
                    value="vente"
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-semibold text-gray-900 mb-1">Vente</div>
                  <div className="text-sm text-gray-600">Vendre définitivement le projet</div>
                </label>
                
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  watch('objective') === 'location' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    {...register('objective', { required: 'L\'objectif est requis' })}
                    type="radio"
                    value="location"
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="font-semibold text-gray-900 mb-1">Location</div>
                  <div className="text-sm text-gray-600">Louer ou faire du leasing</div>
                </label>
                
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  watch('objective') === 'levee_fonds' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    {...register('objective', { required: 'L\'objectif est requis' })}
                    type="radio"
                    value="levee_fonds"
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold text-gray-900 mb-1">Levée de fonds</div>
                  <div className="text-sm text-gray-600">Rechercher des investisseurs</div>
                </label>
              </div>
              {errors.objective && (
                <p className="mt-1 text-sm text-red-600">{errors.objective.message}</p>
              )}
            </div>
          </div>

          {/* 2. Basic Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📋 Informations de Base
            </h2>

            {/* Project Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <Tag className="h-4 w-4 inline mr-2" />
                Type de Projet *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedProjectType === 'digital' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    {...register('project_type', { required: 'Le type de projet est requis' })}
                    type="radio"
                    value="digital"
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">💻</div>
                  <div className="font-semibold text-gray-900 mb-1">Projet Digital</div>
                  <div className="text-sm text-gray-600">Sites web, applications, startups tech</div>
                </label>
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedProjectType === 'real' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    {...register('project_type', { required: 'Le type de projet est requis' })}
                    type="radio"
                    value="real"
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="font-semibold text-gray-900 mb-1">Projet Réel</div>
                  <div className="text-sm text-gray-600">Fonds de commerce, locaux, industries</div>
                </label>
              </div>
              {errors.project_type && (
                <p className="mt-2 text-sm text-red-600">{errors.project_type.message}</p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <Tag className="h-4 w-4 inline mr-2" />
                Catégorie *
              </label>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(selectedProjectType === 'digital' ? digitalCategories : realCategories).map((category) => (
                  <label
                    key={category.value}
                    className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCategory === category.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      {...register('category', { required: 'La catégorie est requise' })}
                      type="radio"
                      value={category.value}
                      className="sr-only"
                    />
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-semibold text-gray-900 mb-1">{category.label}</div>
                    <div className="text-sm text-gray-600">{category.description}</div>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Industry Sector Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-2" />
                Secteur d'Activité *
              </label>
              <select
                {...register('industry_sector', { required: 'Le secteur d\'activité est requis' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un secteur</option>
                {industrySectors.map((sector) => (
                  <option key={sector.value} value={sector.value}>
                    {sector.label}
                  </option>
                ))}
              </select>
              {errors.industry_sector && (
                <p className="mt-2 text-sm text-red-600">{errors.industry_sector.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Le secteur d'activité est obligatoire pour tous les projets
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  {...register('title', { required: 'Le titre est requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Plateforme E-commerce Maroc"
                  onChange={(e) => {
                    setValue('slug', generateSlug(e.target.value));
                  }}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Prix (MAD) *
                </label>
                <input
                  {...register('price', {
                    required: 'Le prix est requis',
                    min: { value: 1000, message: 'Le prix minimum est de 1000 MAD' }
                  })}
                  type="number"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150000"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Description *
              </label>
              <textarea
                {...register('description', { required: 'La description est requise' })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description détaillée du projet..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                {...register('slug', { required: 'Le slug est requis' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="mon-projet-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL finale: /project/{watch('slug')}
              </p>
            </div>
          </div>

          {/* 3. Statut du Propriétaire et Paramètres */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              👨‍💼 Statut du Propriétaire
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Owner Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut du propriétaire *
                </label>
                <select
                  {...register('owner_status', { required: 'Le statut du propriétaire est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professionnel">👨‍💼 Professionnel</option>
                  <option value="particulier">👤 Particulier</option>
                  <option value="entreprise">🏢 Entreprise</option>
                </select>
                {errors.owner_status && (
                  <p className="mt-1 text-sm text-red-600">{errors.owner_status.message}</p>
                )}
              </div>

              {/* Show Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affichage du prix
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register('show_price')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Afficher le prix publiquement
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Si décoché, le prix sera marqué comme "Prix sur demande"
                </p>
              </div>
            </div>
          </div>

          {/* 4. Indicateurs de Performance */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📈 Indicateurs de Performance
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly Traffic (pour digital) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trafic mensuel (pour digital)
                </label>
                <input
                  {...register('monthly_traffic', { min: 0 })}
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 15000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de visiteurs uniques par mois
                </p>
              </div>

              {/* Leads/Clients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leads / Clients existants
                </label>
                <input
                  {...register('leads_clients', { min: 0 })}
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 150"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de leads ou clients acquis
                </p>
              </div>

              {/* Revenue (facultatif) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revenus mensuels (facultatif)
                </label>
                <input
                  {...register('revenue', { min: 0 })}
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 25000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Revenus moyens mensuels en MAD
                </p>
              </div>

              {/* Material Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  État du matériel / local
                </label>
                <select
                  {...register('material_condition')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un état</option>
                  <option value="excellent">🟢 Excellent</option>
                  <option value="bon">🟡 Bon</option>
                  <option value="moyen">🟠 Moyen</option>
                  <option value="renovation">🔴 Nécessite rénovation</option>
                  <option value="neuf">✨ Neuf</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  État général du matériel ou des locaux
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Détails Techniques
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fonctionnalités *
                </label>
                <textarea
                  {...register('features_text', { required: 'Les fonctionnalités sont requises' })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paiement en ligne, Gestion des stocks, Interface mobile..."
                />
                {errors.features_text && (
                  <p className="mt-1 text-sm text-red-600">{errors.features_text.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Séparez par des virgules</p>
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Code className="h-4 w-4 inline mr-2" />
                  Technologies *
                </label>
                <textarea
                  {...register('tech_stack_text', { required: 'Les technologies sont requises' })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="React, Node.js, MongoDB, Stripe..."
                />
                {errors.tech_stack_text && (
                  <p className="mt-1 text-sm text-red-600">{errors.tech_stack_text.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Séparez par des virgules</p>
              </div>
            </div>

            {/* Industry Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-2" />
                Secteurs d'Activité *
              </label>
              <textarea
                {...register('industry_tags_text', { required: 'Les secteurs d\'activité sont requis' })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: SaaS, E-commerce, Fintech, EdTech..."
              />
              {errors.industry_tags_text && (
                <p className="mt-1 text-sm text-red-600">{errors.industry_tags_text.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Séparez par des virgules. Exemples: {industryTagsExamples.join(', ')}
              </p>
            </div>

            {/* Demo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-4 w-4 inline mr-2" />
                URL de Démonstration
              </label>
              <input
                {...register('demo_url')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://demo.monprojet.com"
              />
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Images du Projet
            </h2>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Upload d'Images
              </label>
              
              {/* Drag & Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Cliquez pour uploader des images
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, JPEG jusqu'à 10MB chacune
                  </p>
                </label>
              </div>

              {uploadingImages && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">Upload en cours...</span>
                  </div>
                </div>
              )}

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Images uploadées :</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(imageUrl)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Manual Image URLs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URLs d'Images Manuelles (optionnel)
              </label>
              <textarea
                {...register('images_text')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg"
                value={uploadedImages.join('\n')}
                onChange={(e) => {
                  const urls = e.target.value.split('\n').filter(url => url.trim());
                  setUploadedImages(urls);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">Une URL par ligne</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informations de Contact
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('contact_email')}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  {...register('contact_phone')}
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+212 6 00 00 00 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Web
                </label>
                <input
                  {...register('contact_website')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://monsite.com"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onClick={() => {
                  const isAdmin = window.location.pathname.includes('/admin');
                  navigate(isAdmin ? '/admin/projects' : '/dashboard/projects');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEdit ? 'Mettre à jour' : 'Créer le projet'}</span>
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

export default ProjectForm;