import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertTriangle, RefreshCw, Calendar, Users, DollarSign } from 'lucide-react';
import { 
  getLinkPurchaseRequests,
  autoConfirmExpiredRequests,
  getCurrentUser
} from '../../lib/supabase';
import { LinkPurchaseRequest } from '../../types';
import toast from 'react-hot-toast';
import { trackPageView } from '../../utils/analytics';

const AutoConfirmationManager: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<LinkPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  useEffect(() => {
    trackPageView('/admin/auto-confirmation', 'Gestion Confirmation Automatique | Back.ma');
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      // Récupérer toutes les demandes en attente de confirmation
      const requests = await getLinkPurchaseRequests({ status: 'pending_confirmation' });
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutoConfirmation = async () => {
    try {
      setProcessing(true);
      const result = await autoConfirmExpiredRequests();
      
      if (result.success) {
        toast.success(`${result.count} demande(s) confirmée(s) automatiquement`);
        setLastRun(new Date());
        loadPendingRequests();
      } else {
        toast.error(result.error || 'Erreur lors de la confirmation automatique');
      }
    } catch (error) {
      console.error('Error running auto confirmation:', error);
      toast.error('Erreur lors de l\'exécution de la confirmation automatique');
    } finally {
      setProcessing(false);
    }
  };

  const getExpiredRequests = () => {
    const now = new Date();
    return pendingRequests.filter(request => {
      if (!request.confirmation_deadline) return false;
      return new Date(request.confirmation_deadline) < now;
    });
  };

  const getExpiringSoonRequests = () => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return pendingRequests.filter(request => {
      if (!request.confirmation_deadline) return false;
      const deadline = new Date(request.confirmation_deadline);
      return deadline > now && deadline <= oneHourFromNow;
    });
  };

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expiré';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const expiredRequests = getExpiredRequests();
  const expiringSoonRequests = getExpiringSoonRequests();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Confirmation Automatique</h1>
              <p className="text-gray-600 mt-1">
                Gestion des confirmations automatiques après 48h
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastRun && (
              <div className="text-sm text-gray-500">
                Dernière exécution: {lastRun.toLocaleString()}
              </div>
            )}
            <button
              onClick={handleRunAutoConfirmation}
              disabled={processing}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                processing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {processing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Traitement...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Exécuter Maintenant</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expiredRequests.length}</p>
              <p className="text-sm text-gray-600">Expirées</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expiringSoonRequests.length}</p>
              <p className="text-sm text-gray-600">Expirent bientôt</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pendingRequests.reduce((sum, req) => sum + req.proposed_price, 0).toLocaleString()} MAD
              </p>
              <p className="text-sm text-gray-600">Montant total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      {pendingRequests.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune demande en attente</h3>
          <p className="text-gray-600">
            Toutes les demandes ont été traitées.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Demandes en attente de confirmation</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {pendingRequests.map((request, index) => {
              const isExpired = request.confirmation_deadline && new Date(request.confirmation_deadline) < new Date();
              const isExpiringSoon = request.confirmation_deadline && 
                new Date(request.confirmation_deadline) <= new Date(Date.now() + 60 * 60 * 1000);
              
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 ${isExpired ? 'bg-orange-50' : isExpiringSoon ? 'bg-yellow-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.link_listing?.title || 'Lien'}
                        </h3>
                        {isExpired && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            Expiré
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Expire bientôt
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Annonceur:</span>
                          <p className="font-medium text-gray-900">{request.advertiser?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Éditeur:</span>
                          <p className="font-medium text-gray-900">{request.publisher?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Prix:</span>
                          <p className="font-medium text-gray-900">{request.proposed_price.toLocaleString()} MAD</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`flex items-center space-x-2 ${
                        isExpired ? 'text-orange-600' : isExpiringSoon ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {request.confirmation_deadline ? formatTimeRemaining(request.confirmation_deadline) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {request.confirmation_deadline ? 
                          new Date(request.confirmation_deadline).toLocaleString() : 
                          'Pas de délai'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoConfirmationManager;
