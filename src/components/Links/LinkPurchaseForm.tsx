import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, 
  DollarSign, 
  Clock, 
  Tag, 
  ExternalLink,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, CreateLinkPurchaseData } from '../../types';
import { createLinkPurchaseRequest } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface LinkPurchaseFormProps {
  link: LinkListing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  advertiser_name: string;
  advertiser_email: string;
  advertiser_phone: string;
  advertiser_website: string;
  proposed_anchor_text: string;
  target_url: string;
  message: string;
  proposed_duration: number;
}

const LinkPurchaseForm: React.FC<LinkPurchaseFormProps> = ({ 
  link, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormData>({
    defaultValues: {
      proposed_anchor_text: link.anchor_text,
      proposed_duration: link.minimum_contract_duration,
      advertiser_website: '',
      message: ''
    }
  });

  const proposedDuration = watch('proposed_duration');

  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const purchaseData: CreateLinkPurchaseData = {
        link_listing_id: link.id,
        advertiser_name: data.advertiser_name,
        advertiser_email: data.advertiser_email,
        advertiser_phone: data.advertiser_phone || undefined,
        advertiser_website: data.advertiser_website || undefined,
        proposed_anchor_text: data.proposed_anchor_text,
        target_url: data.target_url,
        message: data.message || undefined,
        proposed_duration: data.proposed_duration
      };

      await createLinkPurchaseRequest(purchaseData);
      
      toast.success('Demande d\'achat envoyée avec succès !');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating purchase request:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    return link.price * proposedDuration;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Acheter ce lien
            </h2>
            <p className="text-gray-600 mt-1">
              {link.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Informations du lien */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Prix: {link.price} {link.currency}/mois</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Durée min: {link.minimum_contract_duration} mois</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Tag className="h-4 w-4" />
              <span>Type: {link.link_type}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ExternalLink className="h-4 w-4" />
              <span>Position: {link.position}</span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Informations de l'annonceur */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Vos informations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Nom complet *
                </label>
                <input
                  {...register('advertiser_name', { 
                    required: 'Le nom est requis' 
                  })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                />
                {errors.advertiser_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.advertiser_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email *
                </label>
                <input
                  {...register('advertiser_email', { 
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
                {errors.advertiser_email && (
                  <p className="text-red-600 text-sm mt-1">{errors.advertiser_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  {...register('advertiser_phone')}
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+212 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Site web
                </label>
                <input
                  {...register('advertiser_website')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://votresite.com"
                />
              </div>
            </div>
          </div>

          {/* Détails du lien */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Détails du lien
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-2" />
                  Texte d'ancrage *
                </label>
                <input
                  {...register('proposed_anchor_text', { 
                    required: 'Le texte d\'ancrage est requis' 
                  })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre texte d'ancrage"
                />
                {errors.proposed_anchor_text && (
                  <p className="text-red-600 text-sm mt-1">{errors.proposed_anchor_text.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ExternalLink className="h-4 w-4 inline mr-2" />
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
                  placeholder="https://votresite.com/page"
                />
                {errors.target_url && (
                  <p className="text-red-600 text-sm mt-1">{errors.target_url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Durée (mois) *
                </label>
                <input
                  {...register('proposed_duration', { 
                    required: 'La durée est requise',
                    min: {
                      value: link.minimum_contract_duration,
                      message: `Durée minimale: ${link.minimum_contract_duration} mois`
                    }
                  })}
                  type="number"
                  min={link.minimum_contract_duration}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.proposed_duration && (
                  <p className="text-red-600 text-sm mt-1">{errors.proposed_duration.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Message (optionnel)
            </label>
            <textarea
              {...register('message')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ajoutez un message pour l'éditeur..."
            />
          </div>

          {/* Résumé et prix */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Prix par mois:</span>
              <span className="text-sm text-gray-900">{link.price} {link.currency}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Durée:</span>
              <span className="text-sm text-gray-900">{proposedDuration} mois</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-blue-600">
                {calculateTotalPrice()} {link.currency}
              </span>
            </div>
          </div>

          {/* Avertissement */}
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <p>Votre demande sera envoyée à l'éditeur pour approbation. Vous recevrez une notification une fois la réponse reçue.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span>Envoyer la demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LinkPurchaseForm; 