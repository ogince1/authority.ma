import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Send,
  Upload,
  FileText,
  Image,
  User,
  Clock,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface DisputeMessage {
  id: string;
  message: string;
  message_type: string;
  attachments: string[];
  is_internal: boolean;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface Dispute {
  id: string;
  title: string;
  status: string;
  initiator_id: string;
  respondent_id: string;
}

interface MessageFormData {
  message: string;
  message_type: string;
  attachments: string[];
}

const DisputeMessages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = React.useState<Dispute | null>(null);
  const [messages, setMessages] = React.useState<DisputeMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [uploadingFiles, setUploadingFiles] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<MessageFormData>({
    defaultValues: {
      message: '',
      message_type: 'comment',
      attachments: []
    }
  });

  const selectedMessageType = watch('message_type');

  React.useEffect(() => {
    trackPageView(`/dashboard/disputes/${id}/messages`, 'Messages Dispute | Back.ma');
    loadDispute();
    loadMessages();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadDispute = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('disputes')
        .select('id, title, status, initiator_id, respondent_id')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Vérifier que l'utilisateur a accès à cette dispute
      if (data.initiator_id !== user.id && data.respondent_id !== user.id) {
        toast.error('Accès non autorisé à cette dispute');
        navigate('/dashboard/disputes');
        return;
      }

      setDispute(data);
    } catch (error) {
      console.error('Error loading dispute:', error);
      toast.error('Erreur lors du chargement de la dispute');
      navigate('/dashboard/disputes');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .select(`
          *,
          sender:users(
            id,
            name,
            email
          )
        `)
        .eq('dispute_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
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
        const filePath = `dispute-messages/${id}/${fileName}`;

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
      setValue('attachments', [...uploadedFiles, ...uploadedUrls]);
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
    setValue('attachments', newFiles);
  };

  const onSubmit = async (data: MessageFormData) => {
    try {
      setSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('dispute_messages')
        .insert({
          dispute_id: id,
          sender_id: user.id,
          message: data.message,
          message_type: data.message_type,
          attachments: data.attachments
        });

      if (error) throw error;

      toast.success('Message envoyé avec succès !');
      reset();
      setUploadedFiles([]);
      loadMessages(); // Recharger les messages
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const labels = {
      comment: 'Commentaire',
      evidence: 'Preuve',
      resolution_proposal: 'Proposition de résolution',
      admin_decision: 'Décision admin'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMessageTypeIcon = (type: string) => {
    const icons = {
      comment: MessageSquare,
      evidence: FileText,
      resolution_proposal: AlertTriangle,
      admin_decision: User
    };
    return icons[type as keyof typeof icons] || MessageSquare;
  };

  const isInitiator = currentUserId === dispute?.initiator_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dispute non trouvée</h3>
        <p className="text-gray-500 mb-4">La dispute que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
        <button
          onClick={() => navigate('/dashboard/disputes')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux disputes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/dashboard/disputes/${id}`)}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages - {dispute.title}</h1>
              <p className="text-gray-600 mt-1">
                Communiquez avec l'autre partie et l'équipe de support
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Liste des messages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
            
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
                <p className="text-gray-500">Soyez le premier à envoyer un message dans cette dispute.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const Icon = getMessageTypeIcon(message.message_type);
                  const isOwnMessage = message.sender.id === currentUserId;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div className={`p-4 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {getMessageTypeLabel(message.message_type)}
                            </span>
                            {message.is_internal && (
                              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                                Interne
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-2">{message.message}</p>
                          
                          {/* Pièces jointes */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-1">
                              {message.attachments.map((attachment, index) => (
                                <a
                                  key={index}
                                  href={attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs inline-flex items-center space-x-1 ${
                                    isOwnMessage ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{attachment.split('/').pop()}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`mt-1 text-xs text-gray-500 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center space-x-2">
                            <span>{message.sender.name}</span>
                            <span>•</span>
                            <span>{new Date(message.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'envoi */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Envoyer un message</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Type de message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de message
                </label>
                <select
                  {...register('message_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="comment">Commentaire</option>
                  <option value="evidence">Preuve</option>
                  <option value="resolution_proposal">Proposition de résolution</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  {...register('message', { 
                    required: 'Veuillez saisir un message',
                    minLength: { value: 10, message: 'Le message doit contenir au moins 10 caractères' }
                  })}
                  rows={4}
                  placeholder="Tapez votre message ici..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              {/* Pièces jointes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pièces jointes (optionnel)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-2">
                    Formats acceptés: JPG, PNG, PDF, DOC
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploadingFiles}
                    className="hidden"
                    id="message-file-upload"
                  />
                  <label
                    htmlFor="message-file-upload"
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploadingFiles ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Ajouter des fichiers
                      </>
                    )}
                  </label>
                </div>

                {/* Fichiers téléchargés */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-700 truncate">
                          {file.split('/').pop()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton d'envoi */}
              <button
                type="submit"
                disabled={sending}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Conseils</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Soyez courtois et professionnel</li>
              <li>• Fournissez des preuves détaillées</li>
              <li>• Les messages sont visibles par toutes les parties</li>
              <li>• L'équipe de support peut intervenir si nécessaire</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeMessages; 