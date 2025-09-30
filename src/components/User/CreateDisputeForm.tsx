import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  AlertTriangle,
  Upload,
  X,
  Save,
  ArrowLeft,
  FileText,
  Image,
  Link
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface CreateDisputeFormData {
  purchase_request_id: string;
  dispute_type: string;
  title: string;
  description: string;
  evidence_files: string[];
}

interface PurchaseRequest {
  id: string;
  anchor_text: string;
  target_url: string;
  proposed_price: number;
  status: string;
  placed_url?: string;
  link_listing?: {
    title: string;
  };
}

const CreateDisputeForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [purchaseRequests, setPurchaseRequests] = React.useState<PurchaseRequest[]>([]);
  const [uploadingFiles, setUploadingFiles] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CreateDisputeFormData>({
    defaultValues: {
      dispute_type: '',
      title: '',
      description: '',
      evidence_files: []
    }
  });

  const selectedDisputeType = watch('dispute_type');

  React.useEffect(() => {
    trackPageView('/dashboard/disputes/new', 'Nouvelle Dispute | Back.ma');
    loadPurchaseRequests();
  }, []);

  const loadPurchaseRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('link_purchase_requests')
        .select(`
          id,
          anchor_text,
          target_url,
          proposed_price,
          status,
          placed_url,
          link_listing:link_listings(title)
        `)
        .eq('user_id', user.id)
        .in('status', ['accepted', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseRequests((data || []).map(item => ({
        ...item,
        link_listing: item.link_listing?.[0] || { title: 'Lien' }
      })));
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      toast.error('Erreur lors du chargement des demandes d\'achat');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `dispute-evidence/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('evidence-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('evidence-files')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setUploadedFiles(prev => [...prev, ...uploadedUrls]);
      setValue('evidence_files', [...uploadedFiles, ...uploadedUrls]);
      toast.success(`${files.length} fichier(s) téléchargé(s) avec succès`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erreur lors du téléchargement des fichiers');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setValue('evidence_files', newFiles);
  };

  const onSubmit = async (data: CreateDisputeFormData) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: disputeId, error } = await supabase
        .rpc('create_dispute', {
          p_purchase_request_id: data.purchase_request_id,
          p_initiator_id: user.id,
          p_dispute_type: data.dispute_type,
          p_title: data.title,
          p_description: data.description,
          p_evidence_files: data.evidence_files
        });

      if (error) throw error;

      toast.success('Dispute créée avec succès !');
      navigate(`/dashboard/disputes/${disputeId}`);
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Erreur lors de la création de la dispute');
    } finally {
      setLoading(false);
    }
  };

  const getDisputeTypeDescription = (type: string) => {
    const descriptions = {
      link_not_placed: 'Le lien n\'a pas été placé dans les délais convenus',
      link_removed: 'Le lien a été supprimé après placement',
      wrong_url: 'L\'URL placée ne correspond pas à celle demandée',
      wrong_anchor_text: 'Le texte d\'ancrage ne correspond pas à celui demandé',
      poor_quality: 'La qualité du placement ne respecte pas les standards',
      late_delivery: 'La livraison a été effectuée en retard',
      non_compliance: 'Le placement ne respecte pas les conditions convenues',
      other: 'Autre problème non listé ci-dessus'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/disputes')}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouvelle Dispute</h1>
              <p className="text-gray-600 mt-1">
                Créez une dispute pour signaler un problème avec une demande d'achat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sélection de la demande d'achat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demande d'achat concernée *
            </label>
            <select
              {...register('purchase_request_id', { required: 'Veuillez sélectionner une demande d\'achat' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionnez une demande d'achat</option>
              {purchaseRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.link_listing?.title || 'Lien'} - {request.anchor_text} ({request.proposed_price} MAD)
                </option>
              ))}
            </select>
            {errors.purchase_request_id && (
              <p className="mt-1 text-sm text-red-600">{errors.purchase_request_id.message}</p>
            )}
          </div>

          {/* Type de dispute */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de dispute *
            </label>
            <select
              {...register('dispute_type', { required: 'Veuillez sélectionner un type de dispute' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionnez un type de dispute</option>
              <option value="link_not_placed">Lien non placé</option>
              <option value="link_removed">Lien supprimé</option>
              <option value="wrong_url">Mauvais URL</option>
              <option value="wrong_anchor_text">Mauvais texte d'ancrage</option>
              <option value="poor_quality">Qualité médiocre</option>
              <option value="late_delivery">Livraison tardive</option>
              <option value="non_compliance">Non-conformité</option>
              <option value="other">Autre</option>
            </select>
            {errors.dispute_type && (
              <p className="mt-1 text-sm text-red-600">{errors.dispute_type.message}</p>
            )}
            {selectedDisputeType && (
              <p className="mt-2 text-sm text-gray-600">
                {getDisputeTypeDescription(selectedDisputeType)}
              </p>
            )}
          </div>

          {/* Titre de la dispute */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la dispute *
            </label>
            <input
              type="text"
              {...register('title', { 
                required: 'Veuillez saisir un titre',
                minLength: { value: 10, message: 'Le titre doit contenir au moins 10 caractères' }
              })}
              placeholder="Ex: Lien non placé dans les délais convenus"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description détaillée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description détaillée *
            </label>
            <textarea
              {...register('description', { 
                required: 'Veuillez saisir une description',
                minLength: { value: 50, message: 'La description doit contenir au moins 50 caractères' }
              })}
              rows={6}
              placeholder="Décrivez en détail le problème rencontré, les dates importantes, et les tentatives de résolution déjà effectuées..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Preuves et fichiers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preuves et fichiers (optionnel)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Formats acceptés: JPG, PNG, PDF, DOC. Taille max: 5MB par fichier
              </p>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingFiles}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadingFiles ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sélectionner des fichiers
                  </>
                )}
              </label>
            </div>

            {/* Fichiers téléchargés */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fichiers téléchargés :</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {file.split('/').pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informations importantes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Informations importantes
                </h4>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• Les disputes sont examinées par notre équipe sous 24-48h</li>
                  <li>• Fournissez des preuves détaillées pour accélérer le traitement</li>
                  <li>• Les remboursements sont automatiques si la dispute est validée</li>
                  <li>• Vous recevrez des notifications sur l'évolution de votre dispute</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/disputes')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer la dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDisputeForm; 