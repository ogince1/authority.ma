import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save,
  X,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  createFundraisingOpportunity, 
  updateFundraisingOpportunity,
  getFundraisingOpportunityById,
  getCurrentUser 
} from '../../lib/supabase';

interface FundraisingFormProps {
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

const FundraisingForm: React.FC<FundraisingFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(isEdit);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    defaultValues: {
      minimum_investment: 10000,
      status: 'active'
    }
  });

  React.useEffect(() => {
    if (isEdit && id) {
      fetchOpportunity();
    }
  }, [isEdit, id]);

  const fetchOpportunity = async () => {
    try {
      const data = await getFundraisingOpportunityById(id!);
      if (!data) {
        throw new Error('Opportunity not found');
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
      navigate('/admin/fundraising');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      console.log('Submitting fundraising data:', data);
      
      // Test de connectivité utilisateur
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour créer une opportunité');
      }
      
      console.log('Current user:', currentUser);
      
      if (isEdit && id) {
        const result = await updateFundraisingOpportunity(id, data);
        console.log('Update result:', result);
        toast.success('Opportunité de levée de fonds mise à jour avec succès !');
      } else {
        const result = await createFundraisingOpportunity(data);
        console.log('Create result:', result);
        toast.success('Opportunité de levée de fonds créée avec succès !');
      }
      
      navigate('/admin/fundraising');
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

  const testConnection = async () => {
    try {
      const user = await getCurrentUser();
      console.log('Current user:', user);
      toast.success(`Connecté en tant que: ${user?.email || 'Anonyme'}`);
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const stages = [
    { value: 'pre_seed', label: 'Pré-Seed', icon: '🌱', description: 'Phase d\'amorçage' },
    { value: 'seed', label: 'Seed', icon: '🚀', description: 'Développement produit' },
    { value: 'series_a', label: 'Série A', icon: '📈', description: 'Croissance' },
    { value: 'series_b', label: 'Série B', icon: '🌍', description: 'Expansion' },
    { value: 'bridge', label: 'Bridge', icon: '🌉', description: 'Financement de transition' }
  ];

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
            {isEdit ? 'Modifier l\'Opportunité' : 'Nouvelle Opportunité de Levée de Fonds'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les détails de l\'opportunité' : 'Créez une nouvelle opportunité d\'investissement'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={testConnection}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Test Connexion
          </button>
          <button
            onClick={() => navigate('/admin/fundraising')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Informations de Base
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Project ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID du Projet *
              </label>
              <input
                {...register('project_id', { required: 'L\'ID du projet est requis' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
              />
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>
              )}
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant Cible (MAD) *
              </label>
              <input
                {...register('target_amount', { 
                  required: 'Le montant cible est requis',
                  min: { value: 1000, message: 'Le montant doit être supérieur à 1000 MAD' }
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
                Investissement Minimum (MAD) *
              </label>
              <input
                {...register('minimum_investment', { 
                  required: 'L\'investissement minimum est requis',
                  min: { value: 1000, message: 'L\'investissement minimum doit être supérieur à 1000 MAD' }
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parts Offertes (%)
              </label>
              <input
                {...register('equity_offered', { 
                  min: { value: 0.1, message: 'Les parts doivent être supérieures à 0.1%' },
                  max: { value: 100, message: 'Les parts ne peuvent pas dépasser 100%' }
                })}
                type="number"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 10.5"
              />
              {errors.equity_offered && (
                <p className="mt-1 text-sm text-red-600">{errors.equity_offered.message}</p>
              )}
            </div>
          </div>

          {/* Investment Stage */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Stade d'Investissement *
            </label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stages.map((stage) => (
                <label
                  key={stage.value}
                  className="relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300"
                >
                  <input
                    {...register('investment_stage', { required: 'Le stade d\'investissement est requis' })}
                    type="radio"
                    value={stage.value}
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">{stage.icon}</div>
                  <div className="font-semibold text-gray-900 mb-1">{stage.label}</div>
                  <div className="text-sm text-gray-600">{stage.description}</div>
                </label>
              ))}
            </div>
            {errors.investment_stage && (
              <p className="mt-2 text-sm text-red-600">{errors.investment_stage.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut *
            </label>
            <select
              {...register('status', { required: 'Le statut est requis' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Actif</option>
              <option value="paused">En Pause</option>
              <option value="funded">Financé</option>
              <option value="closed">Fermé</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Description pour les Investisseurs
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description Détaillée *
            </label>
            <textarea
              {...register('description_for_investors', { required: 'La description est requise' })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez votre projet, votre équipe, votre marché cible, votre modèle économique, vos projections financières..."
            />
            {errors.description_for_investors && (
              <p className="mt-1 text-sm text-red-600">{errors.description_for_investors.message}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/fundraising')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEdit ? 'Mettre à jour' : 'Créer'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FundraisingForm;