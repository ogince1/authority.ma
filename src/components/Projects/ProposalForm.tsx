import React from 'react';
import { useForm } from 'react-hook-form';
import { Send, DollarSign, User, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateProposalData } from '../../types';
import { trackEvent } from '../../utils/analytics';

interface ProposalFormProps {
  projectId: string;
  projectPrice: number;
  onSubmit: (data: CreateProposalData) => void;
  loading?: boolean;
}

const ProposalForm: React.FC<ProposalFormProps> = ({
  projectId,
  projectPrice,
  onSubmit,
  loading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateProposalData>({
    defaultValues: {
      project_id: projectId,
      proposed_price: projectPrice
    }
  });

  const handleFormSubmit = (data: CreateProposalData) => {
    // Track form submission start
    trackEvent('proposal_form_submit', {
      project_id: data.project_id,
      proposed_price: data.proposed_price,
      currency: 'MAD',
      event_category: 'form',
      event_label: 'proposal'
    });
    
    onSubmit(data);
    reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center space-x-2 mb-6">
        <Send className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">
          Faire une proposition
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-2" />
            Nom complet *
          </label>
          <input
            {...register('buyer_name', { required: 'Le nom est requis' })}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre nom complet"
          />
          {errors.buyer_name && (
            <p className="mt-1 text-sm text-red-600">{errors.buyer_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 inline mr-2" />
            Email *
          </label>
          <input
            {...register('buyer_email', {
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
          {errors.buyer_email && (
            <p className="mt-1 text-sm text-red-600">{errors.buyer_email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4 inline mr-2" />
            Téléphone
          </label>
          <input
            {...register('buyer_phone')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+212 6 00 00 00 00"
          />
        </div>

        {/* Proposed Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-2" />
            Prix proposé (MAD) *
          </label>
          <input
            {...register('proposed_price', {
              required: 'Le prix est requis',
              min: {
                value: 1,
                message: 'Le prix doit être supérieur à 0'
              }
            })}
            type="number"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 75000"
          />
          {errors.proposed_price && (
            <p className="mt-1 text-sm text-red-600">{errors.proposed_price.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Prix demandé: {new Intl.NumberFormat('fr-MA', {
              style: 'currency',
              currency: 'MAD',
              minimumFractionDigits: 0
            }).format(projectPrice)}
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            {...register('message')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Décrivez votre intérêt pour ce projet, vos plans, ou toute question..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Envoi en cours...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Envoyer la proposition</span>
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        <p>
          En soumettant cette proposition, vous acceptez que vos informations soient 
          partagées avec le vendeur du projet. Nous vous contacterons sous 24h.
        </p>
      </div>
    </motion.div>
  );
};

export default ProposalForm;