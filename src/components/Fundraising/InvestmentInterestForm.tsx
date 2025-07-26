import React from 'react';
import { useForm } from 'react-hook-form';
import { Send, DollarSign, User, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateInvestmentInterestData } from '../../types';
import { trackEvent } from '../../utils/analytics';

interface InvestmentInterestFormProps {
  fundraisingId: string;
  minimumInvestment: number;
  onSubmit: (data: CreateInvestmentInterestData) => void;
  loading?: boolean;
}

const InvestmentInterestForm: React.FC<InvestmentInterestFormProps> = ({
  fundraisingId,
  minimumInvestment,
  onSubmit,
  loading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateInvestmentInterestData>({
    defaultValues: {
      fundraising_id: fundraisingId,
      investment_amount: minimumInvestment
    }
  });

  const handleFormSubmit = (data: CreateInvestmentInterestData) => {
    // Track form submission start
    trackEvent('investment_interest_form_submit', {
      fundraising_id: data.fundraising_id,
      investment_amount: data.investment_amount,
      currency: 'MAD',
      event_category: 'form',
      event_label: 'investment_interest'
    });
    
    onSubmit(data);
    reset();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
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
          Manifester votre Intérêt
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
            {...register('investor_name', { required: 'Le nom est requis' })}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre nom complet"
          />
          {errors.investor_name && (
            <p className="mt-1 text-sm text-red-600">{errors.investor_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 inline mr-2" />
            Email *
          </label>
          <input
            {...register('investor_email', {
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
          {errors.investor_email && (
            <p className="mt-1 text-sm text-red-600">{errors.investor_email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4 inline mr-2" />
            Téléphone
          </label>
          <input
            {...register('investor_phone')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+212 6 00 00 00 00"
          />
        </div>

        {/* Investment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-2" />
            Montant d'investissement (MAD) *
          </label>
          <input
            {...register('investment_amount', {
              required: 'Le montant est requis',
              min: {
                value: minimumInvestment,
                message: `Le montant minimum est de ${formatAmount(minimumInvestment)}`
              }
            })}
            type="number"
            step="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={minimumInvestment.toString()}
          />
          {errors.investment_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.investment_amount.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Montant minimum: {formatAmount(minimumInvestment)}
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
            placeholder="Décrivez votre profil d'investisseur, vos attentes, ou toute question..."
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
              <span>Envoyer ma manifestation d'intérêt</span>
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        <p>
          En soumettant cette manifestation d'intérêt, vous acceptez que vos informations 
          soient partagées avec l'équipe du projet. Nous vous contacterons sous 48h.
        </p>
      </div>
    </motion.div>
  );
};

export default InvestmentInterestForm;