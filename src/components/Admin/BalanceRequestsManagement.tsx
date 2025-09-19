import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Check, 
  X, 
  Clock, 
  User,
  CreditCard,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, [filterStatus, filterType]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_balance_requests');

      if (error) {
        console.error('Error loading balance requests:', error);
        toast.error('Erreur lors du chargement des demandes');
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading balance requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (processingId === requestId) return;

    try {
      setProcessingId(requestId);
      
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
        setShowModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        loadRequests(); // Recharger la liste
      } else {
        toast.error(data?.message || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Erreur lors du traitement de la demande');
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (request: BalanceRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvée
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Terminée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'add_funds' ? 'Ajout de fonds' : 'Retrait de fonds';
  };

  const getTypeIcon = (type: string) => {
    return type === 'add_funds' ? (
      <div className="p-2 bg-green-100 rounded-lg">
        <DollarSign className="h-5 w-5 text-green-600" />
      </div>
    ) : (
      <div className="p-2 bg-red-100 rounded-lg">
        <CreditCard className="h-5 w-5 text-red-600" />
      </div>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Virement bancaire';
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Carte bancaire';
      case 'manual':
        return 'Manuel';
      case 'platform':
        return 'Frais de plateforme';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Demandes de Balance</h1>
          <p className="text-gray-600 mt-1">Gérez les demandes d'ajout et de retrait de fonds</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="completed">Terminées</option>
              <option value="rejected">Rejetées</option>
              <option value="all">Toutes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tous</option>
              <option value="add_funds">Ajout de fonds</option>
              <option value="withdraw_funds">Retrait de fonds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Demandes de Balance ({requests.length})
          </h2>
        </div>

        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune demande trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getTypeIcon(request.type)}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {getTypeLabel(request.type)}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{request.user_name} ({request.user_email})</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium text-gray-900">{request.amount.toLocaleString()} MAD</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>{getPaymentMethodLabel(request.payment_method)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        {request.description && (
                          <div className="mt-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4 inline mr-1" />
                            {request.description}
                          </div>
                        )}

                        {request.payment_reference && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Référence:</span> {request.payment_reference}
                          </div>
                        )}

                        {request.admin_notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <span className="font-medium">Notes admin:</span> {request.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(request)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Traiter
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de traitement */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Traiter la demande de {getTypeLabel(selectedRequest.type).toLowerCase()}
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Utilisateur:</span></div>
                    <div>{selectedRequest.user_name}</div>
                    
                    <div><span className="font-medium">Email:</span></div>
                    <div>{selectedRequest.user_email}</div>
                    
                    <div><span className="font-medium">Montant:</span></div>
                    <div className="font-semibold text-green-600">{selectedRequest.amount.toLocaleString()} MAD</div>
                    
                    <div><span className="font-medium">Méthode:</span></div>
                    <div>{getPaymentMethodLabel(selectedRequest.payment_method)}</div>
                    
                    <div><span className="font-medium">Date:</span></div>
                    <div>{new Date(selectedRequest.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>

                  {selectedRequest.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="font-medium text-sm">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
                    </div>
                  )}

                  {selectedRequest.payment_reference && (
                    <div className="mt-2">
                      <span className="font-medium text-sm">Référence:</span>
                      <p className="text-sm text-gray-600">{selectedRequest.payment_reference}</p>
                    </div>
                  )}

                  {/* Informations de paiement pour les retraits */}
                  {selectedRequest.type === 'withdraw_funds' && selectedRequest.publisher_payment_info && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="font-medium text-sm">Informations de paiement de l'éditeur:</span>
                      
                      {/* Informations bancaires */}
                      {selectedRequest.publisher_payment_info.bank_account_info && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <p className="font-medium text-gray-700 mb-1">🏦 Compte bancaire:</p>
                          <div className="space-y-1">
                            {selectedRequest.publisher_payment_info.bank_account_info.bank_name && (
                              <div>Banque: {selectedRequest.publisher_payment_info.bank_account_info.bank_name}</div>
                            )}
                            {selectedRequest.publisher_payment_info.bank_account_info.account_holder && (
                              <div>Titulaire: {selectedRequest.publisher_payment_info.bank_account_info.account_holder}</div>
                            )}
                            {selectedRequest.publisher_payment_info.bank_account_info.iban && (
                              <div>IBAN: {selectedRequest.publisher_payment_info.bank_account_info.iban}</div>
                            )}
                            {selectedRequest.publisher_payment_info.bank_account_info.rib && (
                              <div>RIB: {selectedRequest.publisher_payment_info.bank_account_info.rib}</div>
                            )}
                            {selectedRequest.publisher_payment_info.bank_account_info.swift_code && (
                              <div>SWIFT: {selectedRequest.publisher_payment_info.bank_account_info.swift_code}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Email PayPal */}
                      {selectedRequest.publisher_payment_info.paypal_email && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <p className="font-medium text-gray-700">💳 PayPal: {selectedRequest.publisher_payment_info.paypal_email}</p>
                        </div>
                      )}
                      
                      {/* Méthode préférée */}
                      {selectedRequest.publisher_payment_info.preferred_withdrawal_method && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Méthode préférée:</span> {
                            selectedRequest.publisher_payment_info.preferred_withdrawal_method === 'bank_transfer' 
                              ? 'Virement bancaire' 
                              : 'PayPal'
                          }
                        </div>
                      )}
                      
                      {/* Calcul de commission */}
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <p className="font-medium text-yellow-800">💰 Calcul des frais:</p>
                        <div className="mt-1 space-y-1 text-yellow-700">
                          <div>Montant demandé: {selectedRequest.amount.toLocaleString()} MAD</div>
                          <div>Commission plateforme (20%): {(selectedRequest.amount * 0.20).toLocaleString()} MAD</div>
                          <div className="font-semibold border-t border-yellow-300 pt-1">
                            Montant net à verser: {(selectedRequest.amount * 0.80).toLocaleString()} MAD
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes administrateur (optionnel)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ajoutez des notes pour l'utilisateur..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleProcessRequest(selectedRequest.id, 'reject')}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processingId === selectedRequest.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      <span>Rejeter</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleProcessRequest(selectedRequest.id, 'approve')}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processingId === selectedRequest.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Approuver</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BalanceRequestsManagement;
