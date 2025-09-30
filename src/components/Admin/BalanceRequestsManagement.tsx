import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Check, 
  Clock, 
  User,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase, addFundsToBalance } from '../../lib/supabase';
import { emailServiceClient } from '../../utils/emailServiceClient';
import toast from 'react-hot-toast';

interface BalanceRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: 'add_funds' | 'withdraw_funds';
  amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description: string;
  payment_reference: string;
  publisher_payment_info: any; // Informations de paiement de l'éditeur
  admin_notes: string;
  created_at: string;
  updated_at: string;
  processed_at: string;
}

const BalanceRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BalanceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('balance_requests')
        .select(`
          *,
          user:users!balance_requests_user_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = (data || []).map(request => ({
        ...request,
        user_name: request.user?.name || 'Utilisateur inconnu',
        user_email: request.user?.email || 'Email inconnu'
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (processingId === requestId) return;

    try {
      setProcessingId(requestId);
      
      // Trouver la demande sélectionnée
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Demande non trouvée');
        return;
      }

      if (action === 'approve' && request.type === 'add_funds') {
        // Pour les recharges, utiliser notre fonction avec commission
        console.log(`💰 Approbation rechargement: ${request.amount} MAD pour utilisateur ${request.user_id}`);
        
        try {
          await addFundsToBalance(
            request.user_id,
            request.amount,
            request.payment_method as 'bank_transfer' | 'paypal' | 'stripe' | 'manual',
            request.payment_reference
          );
          
          // Mettre à jour le statut de la demande
          const { error: updateError } = await supabase
            .from('balance_requests')
            .update({ 
              status: 'approved',
              admin_notes: adminNotes || null,
              processed_at: new Date().toISOString()
            })
            .eq('id', requestId);

          if (updateError) {
            console.error('Error updating request status:', updateError);
            toast.error('Erreur lors de la mise à jour du statut');
            return;
          }
          
          toast.success('Demande approuvée avec commission appliquée !');
          
          // Envoyer un email de confirmation
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name, email, balance')
              .eq('id', request.user_id)
              .single();

            if (userData && !userError) {
              
              const newBalance = (userData.balance || 0) + request.amount;
              
              await emailServiceClient.sendTemplateEmail(
                'ADVERTISER_BALANCE_ADDED',
                userData.email,
                {
                  user_name: userData.name || 'Utilisateur',
                  amount: request.amount,
                  new_balance: newBalance,
                  transaction_date: new Date().toLocaleString('fr-FR'),
                  transaction_id: `ADMIN-${request.id}`,
                  dashboard_url: `${window.location.origin}/dashboard/balance`,
                  buy_links_url: `${window.location.origin}/buy-links`
                },
                ['balance_added', 'advertiser', 'transaction', 'admin_approved']
              );
              
              console.log('Email de recharge envoyé après approbation admin');
            }
          } catch (emailError) {
            console.error('Erreur envoi email après approbation admin:', emailError);
          }
          
        } catch (balanceError) {
          console.error('Error adding funds:', balanceError);
          toast.error('Erreur lors de l\'ajout des fonds');
          return;
        }
      } else {
        // Pour les autres actions (rejet, retraits), utiliser la fonction RPC
        const { data, error } = await supabase.rpc('admin_process_balance_request', {
          p_request_id: requestId,
          p_action: action,
          p_admin_notes: adminNotes || null
        });

        if (error) {
          console.error('Error processing request:', error);
          toast.error('Erreur lors du traitement de la demande');
          return;
        }

        if (data && data.success) {
          toast.success(action === 'approve' ? 'Demande approuvée !' : 'Demande rejetée !');
        }
      }
      
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      await loadRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Erreur lors du traitement de la demande');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add_funds':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'withdraw_funds':
        return <Building className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Demandes de Solde</h1>
            <p className="text-gray-600 mt-1">
              Gérez les recharges et retraits des utilisateurs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {requests.length} demande(s)
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approuvées</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total traité</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests
                  .filter(r => r.status === 'approved')
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toFixed(0)} MAD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Demandes Récentes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Méthode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.user_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(request.type)}
                      <span className="ml-2 text-sm text-gray-900">
                        {request.type === 'add_funds' ? 'Rechargement' : 'Retrait'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.amount.toFixed(2)} MAD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {request.payment_method.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleProcessRequest(request.id, 'approve')}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingId === request.id ? 'Traitement...' : 'Approuver'}
                          </button>
                          <button
                            onClick={() => handleProcessRequest(request.id, 'reject')}
                            disabled={processingId === request.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Détails de la demande
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Utilisateur</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.user_name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.type === 'add_funds' ? 'Rechargement' : 'Retrait'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.amount.toFixed(2)} MAD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Méthode de paiement</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              {selectedRequest.payment_reference && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Référence de paiement</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.payment_reference}</p>
                </div>
              )}
              
              {selectedRequest.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.description}</p>
                </div>
              )}

              {selectedRequest.publisher_payment_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Informations de paiement</label>
                  <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {JSON.stringify(selectedRequest.publisher_payment_info, null, 2)}
                  </pre>
                </div>
              )}

              {/* Notes admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes admin
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ajoutez des notes pour cette demande..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                
                {selectedRequest.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleProcessRequest(selectedRequest.id, 'approve')}
                      disabled={processingId === selectedRequest.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processingId === selectedRequest.id ? 'Traitement...' : 'Approuver'}
                    </button>
                    <button
                      onClick={() => handleProcessRequest(selectedRequest.id, 'reject')}
                      disabled={processingId === selectedRequest.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceRequestsManagement;