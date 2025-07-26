import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save,
  X,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  createFundraisingOpportunity, 
  updateFundraisingOpportunity,
  getFundraisingOpportunityById,
  getCurrentUser,
  getAllProjects
} from '../../lib/supabase';

interface UserFundraisingFormProps {
  isEdit?: boolean;
}

interface FormData {
  project_id: string;
  target_amount: number;
  investment_stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'bridge';
  equity_offered?: number;
  description_for_investors: string;
  minimum_investment: number;
  status: 'active' | 'funded' | 'closed' | 'paused';
}

const UserFundraisingForm: React.FC<UserFundraisingFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(isEdit);
  const [userProjects, setUserProjects] = React.useState<any[]>([]);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormData>({
    defaultValues: {
      minimum_investment: 10000,
      status: 'active'
    }
  });

  const selectedProjectId = watch('project_id');

  React.useEffect(() => {
    const initializeForm = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const user = await getCurrentUser();
        if (!user) {
          toast.error('Vous devez être connecté');
          navigate('/dashboard');
          return;
        }
        setCurrentUser(user);

        // Récupérer les projets de l'utilisateur
        const projects = await getAllProjects();
        const userOwnedProjects = projects.filter(p => p.user_id === user.id);
        setUserProjects(userOwnedProjects);

        // Si mode édition, charger l'opportunité
        if (isEdit && id) {
          await fetchOpportunity();
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Erreur lors de l\'initialisation');
      } finally {
        setLoadingData(false);
      }
    };

    initializeForm();
  }, [isEdit, id, navigate]);

  const fetchOpportunity = async () => {
    try {
      const data = await getFundraisingOpportunityById(id!);
      if (!data) {
        throw new Error('Opportunity not found');
      }
      
      // Vérifier que l'utilisateur est propriétaire
      if (data.user_id !== currentUser?.id) {
        toast.error('Vous n\'avez pas accès à cette opportunité');
        navigate('/dashboard/fundraising');
        return;
      }
      
      // Set form values
      reset({
        project_id: data.project_id,
        target_amount: data.target_amount,
        investment_stage: data.investment_stage,
        equity_offered: data.equity_offered || undefined,
        description_for_investors: data.description_for_investors,
        minimum_investment: data.minimum_investment,
        status: data.status
      });
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast.error('Erreur lors du chargement de l\'opportunité');
      navigate('/dashboard/fundraising');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      console.log('Submitting fundraising data:', data);
      
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour créer une opportunité');
      }

      // Vérifier que le projet appartient à l'utilisateur
      const selectedProject = userProjects.find(p => p.id === data.project_id);
      if (!selectedProject) {
        throw new Error('Vous ne pouvez créer une opportunité que pour vos propres projets');
      }
      
      if (isEdit && id) {
        const result = await updateFundraisingOpportunity(id, data);
        console.log('Update result:', result);
        toast.success('Votre opportunité de levée de fonds a été mise à jour avec succès !');
      } else {
        const result = await createFundraisingOpportunity(data);
        console.log('Create result:', result);
        toast.success('Votre opportunité de levée de fonds a été créée avec succès !');
      }
      
      navigate('/dashboard/fundraising');
    } catch (error) {
      console.error('Error saving opportunity:', error);
      
      // Gestion d'erreurs détaillée
      if (error instanceof Error) {
        toast.error(`Erreur: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        if (errorObj.code) {
          toast.error(`Erreur DB (${errorObj.code}): ${errorObj.message || 'Erreur inconnue'}`);
        } else {
          toast.error(`Erreur: ${JSON.stringify(error)}`);
        }
      } else {
        toast.error('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { 
      value: 'pre_seed', 
      label: 'Pré-Seed', 
      icon: '🌱', 
      description: 'Phase d\'amorçage',
      typical: '50k - 500k MAD',
      help: 'Idéal pour valider votre concept et développer un MVP'
    },
    { 
      value: 'seed', 
      label: 'Seed', 
      icon: '🚀', 
      description: 'Développement produit',
      typical: '500k - 2M MAD',
      help: 'Pour développer votre produit et acquérir vos premiers clients'
    },
    { 
      value: 'series_a', 
      label: 'Série A', 
      icon: '📈', 
      description: 'Croissance',
      typical: '2M - 10M MAD',
      help: 'Pour accélérer votre croissance et étendre votre marché'
    },
    { 
      value: 'series_b', 
      label: 'Série B', 
      icon: '🌍', 
      description: 'Expansion',
      typical: '10M+ MAD',
      help: 'Pour l\'expansion géographique et le développement avancé'
    },
    { 
      value: 'bridge', 
      label: 'Bridge', 
      icon: '🌉', 
      description: 'Transition',
      typical: 'Variable',
      help: 'Financement temporaire entre deux tours principaux'
    }
  ];

  const selectedProject = userProjects.find(p => p.id === selectedProjectId);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier votre opportunité' : 'Nouvelle opportunité de levée de fonds'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les détails de votre opportunité' : 'Créez une opportunité pour lever des fonds pour votre projet'}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/fundraising')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Conseils pour votre levée de fonds :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Soyez transparent sur l'utilisation des fonds</li>
              <li>Présentez des projections financières réalistes</li>
              <li>Mettez en avant votre équipe et votre expérience</li>
              <li>Décrivez clairement votre avantage concurrentiel</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Sélection du projet
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projet à financer *
            </label>
            <select
              {...register('project_id', { required: 'Vous devez sélectionner un projet' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionnez un de vos projets</option>
              {userProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} - {project.category.toUpperCase()}
                </option>
              ))}
            </select>
            {errors.project_id && (
              <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>
            )}
            
            {userProjects.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Vous n'avez pas encore de projets. 
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/projects/new')}
                    className="ml-1 text-yellow-900 underline hover:text-yellow-700"
                  >
                    Créer un projet d'abord
                  </button>
                </p>
              </div>
            )}

            {selectedProject && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold">{selectedProject.title}</p>
                    <p className="text-green-700">{selectedProject.description}</p>
                    <p className="text-green-600 mt-1">Prix actuel: {selectedProject.price.toLocaleString()} MAD</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Détails financiers
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant à lever (MAD) *
              </label>
              <input
                {...register('target_amount', { 
                  required: 'Le montant cible est requis',
                  min: { value: 10000, message: 'Le montant doit être supérieur à 10 000 MAD' }
                })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 500000"
              />
              {errors.target_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.target_amount.message}</p>
              )}
            </div>

            {/* Minimum Investment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investissement minimum par investisseur (MAD) *
              </label>
              <input
                {...register('minimum_investment', { 
                  required: 'L\'investissement minimum est requis',
                  min: { value: 1000, message: 'L\'investissement minimum doit être supérieur à 1 000 MAD' }
                })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 10000"
              />
              {errors.minimum_investment && (
                <p className="mt-1 text-sm text-red-600">{errors.minimum_investment.message}</p>
              )}
            </div>

            {/* Equity Offered */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parts de l'entreprise offertes (%) - Optionnel
              </label>
              <input
                {...register('equity_offered', { 
                  min: { value: 0.1, message: 'Les parts doivent être supérieures à 0.1%' },
                  max: { value: 49, message: 'Nous recommandons de ne pas dépasser 49% pour garder le contrôle' }
                })}
                type="number"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 15.5"
              />
              {errors.equity_offered && (
                <p className="mt-1 text-sm text-red-600">{errors.equity_offered.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Laissez vide si vous préférez négocier ce point directement avec les investisseurs
              </p>
            </div>
          </div>
        </div>

        {/* Investment Stage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Stade de votre entreprise *
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage) => (
              <label
                key={stage.value}
                className="relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 group"
              >
                <input
                  {...register('investment_stage', { required: 'Le stade d\'investissement est requis' })}
                  type="radio"
                  value={stage.value}
                  className="sr-only"
                />
                <div className="text-2xl mb-2">{stage.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{stage.label}</div>
                <div className="text-sm text-gray-600 mb-2">{stage.description}</div>
                <div className="text-xs text-blue-600 font-medium">{stage.typical}</div>
                <div className="text-xs text-gray-500 mt-1">{stage.help}</div>
              </label>
            ))}
          </div>
          {errors.investment_stage && (
            <p className="mt-2 text-sm text-red-600">{errors.investment_stage.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Présentation pour les investisseurs
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description détaillée de votre projet et de vos besoins *
            </label>
            <textarea
              {...register('description_for_investors', { 
                required: 'La description est requise',
                minLength: { value: 100, message: 'La description doit faire au moins 100 caractères' }
              })}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez votre projet, votre équipe, votre marché cible, votre modèle économique, comment vous comptez utiliser les fonds, vos projections financières..."
            />
            {errors.description_for_investors && (
              <p className="mt-1 text-sm text-red-600">{errors.description_for_investors.message}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              <p className="font-medium mb-1">Conseils pour une bonne description :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Présentez clairement votre problème et votre solution</li>
                <li>Décrivez votre marché cible et sa taille</li>
                <li>Expliquez votre modèle économique</li>
                <li>Présentez votre équipe et son expertise</li>
                <li>Détaillez l'utilisation prévue des fonds</li>
                <li>Partagez vos projections financières réalistes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/fundraising')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || userProjects.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEdit ? 'Mettre à jour' : 'Créer l\'opportunité'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserFundraisingForm;