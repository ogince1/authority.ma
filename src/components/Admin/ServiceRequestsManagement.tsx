import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Euro,
  Package,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllServiceRequests, updateServiceRequestStatus } from '../../lib/supabase';
import { ServiceRequest } from '../../types';
import toast from 'react-hot-toast';

const ServiceRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllServiceRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading service requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const result = await updateServiceRequestStatus(requestId, newStatus, adminNotes);
      if (result.success) {
        toast.success('Statut mis à jour avec succès');
        loadRequests();
        setShowModal(false);
        setAdminNotes('');
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
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
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <RefreshCw className="h-3 w-3 mr-1" />
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminée
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
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

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Services</h1>
          <p className="text-gray-600 mt-1">Gérez les demandes de services des annonceurs</p>
        </div>
        <button
          onClick={loadRequests}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { key: 'all', label: 'Total', color: 'gray' },
          { key: 'pending', label: 'En attente', color: 'yellow' },
          { key: 'approved', label: 'Approuvées', color: 'blue' },
          { key: 'in_progress', label: 'En cours', color: 'purple' },
          { key: 'completed', label: 'Terminées', color: 'green' },
          { key: 'cancelled', label: 'Annulées', color: 'red' },
        ].map(({ key, label, color }) => (
          <div
            key={key}
            className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 cursor-pointer transition-colors ${
              filter === key ? `bg-${color}-100 border-${color}-300` : ''
            }`}
            onClick={() => setFilter(key)}
          >
            <div className="text-2xl font-bold text-gray-900">{statusCounts[key as keyof typeof statusCounts]}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Demandes de Services ({filteredRequests.length})
          </h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Aucune demande de service pour le moment'
                : `Aucune demande avec le statut "${filter}"`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.service?.name}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{request.user?.name || request.user?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Euro className="h-4 w-4" />
                        <span>{request.total_price} MAD (x{request.quantity})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {request.client_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Notes du client:</p>
                            <p className="text-sm text-blue-700">{request.client_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Settings className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Notes admin:</p>
                            <p className="text-sm text-gray-700">{request.admin_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Gérer cette demande"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de gestion */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gérer la demande de service
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de la demande */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Détails de la demande</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <p className="font-medium">{selectedRequest.service?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Client:</span>
                    <p className="font-medium">{selectedRequest.user?.name || selectedRequest.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantité:</span>
                    <p className="font-medium">{selectedRequest.quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Prix total:</span>
                    <p className="font-medium">{selectedRequest.total_price} MAD</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Statut actuel:</span>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Date de création:</span>
                    <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {/* Notes du client */}
              {selectedRequest.client_notes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Notes du client</h3>
                  <p className="text-blue-700">{selectedRequest.client_notes}</p>
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
                  placeholder="Ajoutez des notes pour le client..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {selectedRequest.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Approuver
                    </button>
                  )}
                  {selectedRequest.status !== 'in_progress' && selectedRequest.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'in_progress')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Marquer en cours
                    </button>
                  )}
                  {selectedRequest.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Marquer terminé
                    </button>
                  )}
                  {selectedRequest.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'cancelled')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestsManagement;
