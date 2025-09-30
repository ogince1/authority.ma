import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  ArrowLeft,
  FileText,
  ExternalLink,
  User,
  Calendar,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface Dispute {
  id: string;
  title: string;
  dispute_type: string;
  status: string;
  opened_at: string;
  resolved_at?: string;
  closed_at?: string;
  resolution_type?: string;
  resolution_amount?: number;
  resolution_notes?: string;
  description: string;
  evidence_files: string[];
  initiator_id: string;
  respondent_id: string;
  purchase_request?: {
    id: string;
    proposed_price: number;
    anchor_text: string;
    target_url: string;
    placed_url?: string;
    link_listing?: {
      title: string;
    };
  };
  initiator?: {
    id: string;
    name: string;
    email: string;
  };
  respondent?: {
    id: string;
    name: string;
    email: string;
  };
  assigned_admin?: {
    id: string;
    name: string;
  };
}

const DisputeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = React.useState<Dispute | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    trackPageView(`/dashboard/disputes/${id}`, 'Détail Dispute | Back.ma');
    loadDispute();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadDispute = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          purchase_request:link_purchase_requests(
            id,
            proposed_price,
            anchor_text,
            target_url,
            placed_url,
            link_listing:link_listings(title)
          ),
          initiator:users!disputes_initiator_id_fkey(
            id,
            name,
            email
          ),
          respondent:users!disputes_respondent_id_fkey(
            id,
            name,
            email
          ),
          assigned_admin:users!disputes_assigned_admin_id_fkey(
            id,
            name
          )
        `)
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
    } finally {
      setLoading(false);
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels = {
      link_not_placed: 'Lien non placé',
      link_removed: 'Lien supprimé',
      wrong_url: 'Mauvais URL',
      wrong_anchor_text: 'Mauvais texte d\'ancrage',
      poor_quality: 'Qualité médiocre',
      late_delivery: 'Livraison tardive',
      non_compliance: 'Non-conformité',
      other: 'Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      open: { color: 'bg-yellow-100 text-yellow-800', text: 'Ouverte', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', text: 'En cours', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Résolue', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', text: 'Fermée', icon: XCircle },
      escalated: { color: 'bg-red-100 text-red-800', text: 'Escaladée', icon: AlertTriangle }
    };

    const configItem = config[status as keyof typeof config] || config.open;
    const Icon = configItem.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${configItem.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {configItem.text}
      </span>
    );
  };

  const getResolutionBadge = (resolutionType?: string, amount?: number) => {
    if (!resolutionType) return null;

    const config = {
      refund_full: { color: 'bg-green-100 text-green-800', text: 'Remboursement complet' },
      refund_partial: { color: 'bg-blue-100 text-blue-800', text: 'Remboursement partiel' },
      replacement: { color: 'bg-purple-100 text-purple-800', text: 'Remplacement' },
      compensation: { color: 'bg-orange-100 text-orange-800', text: 'Compensation' },
      dismissed: { color: 'bg-gray-100 text-gray-800', text: 'Rejetée' }
    };

    const configItem = config[resolutionType as keyof typeof config] || config.dismissed;

    return (
      <div className="flex items-center space-x-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${configItem.color}`}>
          {configItem.text}
        </span>
        {amount && (
          <span className="text-lg font-bold text-gray-900">
            {amount} MAD
          </span>
        )}
      </div>
    );
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
    <div className="max-w-6xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">{dispute.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(dispute.status)}
                <span className="text-sm text-gray-500">
                  Ouverte le {new Date(dispute.opened_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/disputes/${dispute.id}/messages`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la dispute */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de la dispute</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de dispute</label>
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{getDisputeTypeLabel(dispute.dispute_type)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{dispute.description}</p>
              </div>

              {dispute.resolution_notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes de résolution</label>
                  <p className="text-gray-900 bg-green-50 p-4 rounded-lg border border-green-200">
                    {dispute.resolution_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Demande d'achat concernée */}
          {dispute.purchase_request && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Demande d'achat concernée</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lien</label>
                    <p className="text-gray-900">{dispute.purchase_request.link_listing?.title || 'Lien'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                    <p className="text-gray-900 font-semibold">{dispute.purchase_request.proposed_price} MAD</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Texte d'ancrage</label>
                    <p className="text-gray-900">{dispute.purchase_request.anchor_text}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL cible</label>
                    <a 
                      href={dispute.purchase_request.target_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      {dispute.purchase_request.target_url}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
                
                {dispute.purchase_request.placed_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL placée</label>
                    <a 
                      href={dispute.purchase_request.placed_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      {dispute.purchase_request.placed_url}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preuves */}
          {dispute.evidence_files && dispute.evidence_files.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preuves fournies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dispute.evidence_files.map((file, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <a 
                      href={file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {file.split('/').pop()}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut et résolution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statut et résolution</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut actuel</label>
                {getStatusBadge(dispute.status)}
              </div>
              
              {dispute.resolution_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Résolution</label>
                  {getResolutionBadge(dispute.resolution_type, dispute.resolution_amount)}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Ouverte le {new Date(dispute.opened_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {dispute.resolved_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Résolue le {new Date(dispute.resolved_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {dispute.closed_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <XCircle className="w-4 h-4" />
                    <span>Fermée le {new Date(dispute.closed_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parties impliquées */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parties impliquées</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initié par</label>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{dispute.initiator?.name}</span>
                  {isInitiator && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Vous
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Répondant</label>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{dispute.respondent?.name}</span>
                  {!isInitiator && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Vous
                    </span>
                  )}
                </div>
              </div>

              {dispute.assigned_admin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin assigné</label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{dispute.assigned_admin.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail; 