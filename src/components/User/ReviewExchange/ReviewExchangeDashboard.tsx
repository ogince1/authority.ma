import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Plus, 
  TrendingUp, 
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Upload,
  Send
} from 'lucide-react';
import { 
  getReviewCredits,
  getAvailableReviewRequests,
  getMyReviewRequests,
  getMyReviewTasks,
  createReviewRequest,
  claimReviewRequest,
  submitReviewProof,
  validateReviewReceived
} from '../../../lib/supabase';
import toast from 'react-hot-toast';

const ReviewExchangeDashboard: React.FC = () => {
  const [credits, setCredits] = useState<any>(null);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-requests' | 'my-tasks'>('available');
  
  // Modal créer demande
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [platform, setPlatform] = useState<'google' | 'trustpilot'>('google');
  const [businessName, setBusinessName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [category, setCategory] = useState('');
  const [instructions, setInstructions] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Modal soumettre preuve
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Modal guidelines sécurité
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [creditsData, availableData, myRequestsData, myTasksData] = await Promise.all([
        getReviewCredits(),
        getAvailableReviewRequests(),
        getMyReviewRequests(),
        getMyReviewTasks()
      ]);
      
      setCredits(creditsData);
      setAvailableRequests(availableData);
      setMyRequests(myRequestsData);
      setMyTasks(myTasksData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName.trim() || !businessUrl.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setCreating(true);
      await createReviewRequest({
        platform,
        business_name: businessName,
        business_url: businessUrl,
        category,
        instructions
      });

      toast.success('Demande créée avec succès ! (-2 crédits)');
      setShowCreateModal(false);
      setBusinessName('');
      setBusinessUrl('');
      setCategory('');
      setInstructions('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleClaimRequest = async (requestId: string) => {
    try {
      await claimReviewRequest(requestId);
      toast.success('Demande prise ! Vous avez 24h pour laisser l\'avis');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!screenshotUrl.trim() || !reviewText.trim()) {
      toast.error('Veuillez fournir la capture d\'écran et le texte de l\'avis');
      return;
    }

    try {
      setSubmitting(true);
      await submitReviewProof(selectedTask.id, screenshotUrl, reviewText);
      toast.success('Preuve soumise ! En attente de validation');
      setShowProofModal(false);
      setScreenshotUrl('');
      setReviewText('');
      setSelectedTask(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (requestId: string) => {
    try {
      await validateReviewReceived(requestId);
      toast.success('Avis validé ! Le reviewer a gagné 1 crédit');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🌟 Échange d'Avis
          </h1>
          <p className="text-gray-600 text-lg">
            Google My Business & Trustpilot - Donnant-donnant 1 pour 1
          </p>
          
          {/* Warning Banner */}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  ⚠️ Important : Risques de détection
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    <strong>Google et Trustpilot détectent les échanges d'avis.</strong> 
                    Risques : suppression des avis, pénalité SEO, suspension du profil.
                  </p>
                  <button
                    onClick={() => setShowSafetyModal(true)}
                    className="mt-2 text-yellow-800 underline hover:text-yellow-900 font-medium"
                  >
                    📖 Lire les guidelines de sécurité
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Carte de crédits */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5" />
                <span className="text-blue-100">Crédits disponibles</span>
              </div>
              <div className="text-4xl font-bold">{credits?.credits_balance || 0}</div>
              <p className="text-blue-100 text-sm mt-1">Avis demandables: {Math.floor((credits?.credits_balance || 0) / 2)}</p>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-blue-100">Avis donnés</span>
              </div>
              <div className="text-4xl font-bold">{credits?.total_reviews_given || 0}</div>
              <p className="text-blue-100 text-sm mt-1">+{credits?.total_reviews_given || 0} crédits gagnés</p>
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5" />
                <span className="text-blue-100">Avis reçus</span>
              </div>
              <div className="text-4xl font-bold">{credits?.total_reviews_received || 0}</div>
              <p className="text-blue-100 text-sm mt-1">Réputation améliorée</p>
            </div>
            
            <div className="flex items-center justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={(credits?.credits_balance || 0) < 2}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Demander un avis</span>
              </button>
            </div>
          </div>
          
          {(credits?.credits_balance || 0) < 2 && (
            <div className="mt-4 bg-white/20 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Vous avez besoin de 2 crédits minimum pour demander un avis. 
              Laissez des avis pour gagner des crédits !
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'available'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌐 Demandes disponibles ({availableRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'my-requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Mes demandes ({myRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'my-tasks'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✍️ Mes avis à laisser ({myTasks.length})
          </button>
        </div>

        {/* Contenu des tabs */}
        <div className="space-y-4">
          {activeTab === 'available' && (
            <>
              {availableRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune demande disponible</h3>
                  <p className="text-gray-600">Revenez plus tard ou créez votre propre demande</p>
                </div>
              ) : (
                availableRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.platform === 'google' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {request.platform === 'google' ? '🔍 Google My Business' : '⭐ Trustpilot'}
                          </span>
                          {request.category && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {request.category}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{request.business_name}</h3>
                        
                        {request.instructions && (
                          <p className="text-gray-600 mb-3">{request.instructions}</p>
                        )}
                        
                        <a 
                          href={request.business_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Voir le profil</span>
                        </a>
                        
                        <p className="text-gray-500 text-sm mt-3">
                          Demandé par {request.requester?.name} • Il y a {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleClaimRequest(request.id)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Je laisse cet avis</span>
                        <span className="bg-white/20 px-2 py-1 rounded text-sm">+1 crédit</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </>
          )}

          {activeTab === 'my-requests' && (
            <>
              {myRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune demande créée</h3>
                  <p className="text-gray-600 mb-4">Créez votre première demande d'avis</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl"
                  >
                    Créer une demande
                  </button>
                </div>
              ) : (
                myRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{request.business_name}</h3>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'pending_validation' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status === 'completed' ? '✅ Complétée' :
                           request.status === 'pending_validation' ? '⏳ En validation' :
                           request.status === 'in_progress' ? '🔄 En cours' :
                           '⌛ En attente'}
                        </span>
                      </div>
                    </div>
                    
                    {request.status === 'pending_validation' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <p className="font-semibold mb-2">📸 Avis soumis par {request.reviewer?.name}</p>
                        <p className="text-sm text-gray-700 mb-3">{request.review_text}</p>
                        {request.review_screenshot_url && (
                          <img 
                            src={request.review_screenshot_url} 
                            alt="Preuve" 
                            className="max-w-md rounded-lg mb-3"
                          />
                        )}
                        <button
                          onClick={() => handleValidate(request.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          ✅ Valider l'avis
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'my-tasks' && (
            <>
              {myTasks.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun avis à laisser</h3>
                  <p className="text-gray-600">Prenez une demande disponible pour gagner des crédits</p>
                </div>
              ) : (
                myTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{task.business_name}</h3>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                          task.platform === 'google' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.platform === 'google' ? 'Google' : 'Trustpilot'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Expire: {new Date(task.expires_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {task.instructions && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm"><strong>Instructions:</strong> {task.instructions}</p>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-xs text-yellow-800">
                          <strong>Conseil :</strong> Laissez l'avis de manière naturelle, avec des détails spécifiques, 
                          et attendez 2-3 jours après votre visite réelle.
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <a
                        href={task.business_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
                      >
                        Ouvrir {task.platform === 'google' ? 'Google' : 'Trustpilot'} →
                      </a>
                      
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowProofModal(true);
                          }}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          ✅ J'ai laissé l'avis
                        </button>
                      )}
                      
                      {task.status === 'pending_validation' && (
                        <div className="flex-1 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-center">
                          ⏳ En attente de validation
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Modal guidelines sécurité */}
        {showSafetyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6 text-red-600">⚠️ Guidelines de Sécurité</h2>
              
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-bold text-red-800 mb-2">🚨 RISQUES RÉELS</h3>
                  <ul className="text-red-700 space-y-1 text-sm">
                    <li>• <strong>115 millions d'avis supprimés</strong> par Google en 2023</li>
                    <li>• <strong>Pénalité SEO</strong> → Baisse de visibilité sur Google</li>
                    <li>• <strong>Suspension du profil</strong> → Perte totale</li>
                    <li>• <strong>Atteinte à la réputation</strong> → "Entreprise qui triche"</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">🛡️ COMMENT ÉVITER LA DÉTECTION</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">✅ À FAIRE :</h4>
                      <ul className="space-y-1 text-blue-600">
                        <li>• <strong>1 avis par semaine max</strong></li>
                        <li>• <strong>Textes uniques</strong> et détaillés</li>
                        <li>• <strong>Comptes avec historique</strong> d'activité</li>
                        <li>• <strong>Délai de 2-3 jours</strong> après visite</li>
                        <li>• <strong>Mentionner des détails</strong> spécifiques</li>
                        <li>• <strong>Éviter les mots-clés</strong> répétitifs</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2">❌ À ÉVITER :</h4>
                      <ul className="space-y-1 text-red-600">
                        <li>• <strong>Avis en masse</strong> (plusieurs/jour)</li>
                        <li>• <strong>Textes similaires</strong> ou copiés</li>
                        <li>• <strong>Comptes nouveaux</strong> et vides</li>
                        <li>• <strong>Avis immédiat</strong> après visite</li>
                        <li>• <strong>Même IP</strong> ou géolocalisation suspecte</li>
                        <li>• <strong>"Super service, je recommande"</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">💡 EXEMPLES DE TEXTES SÉCURISÉS</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    <div>
                      <strong>❌ Suspect :</strong> "Super service, je recommande !"
                    </div>
                    <div>
                      <strong>✅ Sécurisé :</strong> "J'ai testé ce restaurant hier soir. Le plat principal était excellent, 
                      l'équipe très professionnelle. Seul bémol : l'attente de 15min pour être servis, mais ça valait le coup. 
                      Je reviendrai certainement avec des amis."
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-bold text-yellow-800 mb-2">📋 CHECKLIST AVANT CHAQUE AVIS</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>□ Mon compte a un historique d'activité</div>
                    <div>□ J'ai attendu 2-3 jours après la visite</div>
                    <div>□ Mon texte est unique et détaillé</div>
                    <div>□ Je n'ai pas laissé d'avis cette semaine</div>
                    <div>□ Je mentionne des détails spécifiques</div>
                    <div>□ Mon IP/géolocalisation est cohérente</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSafetyModal(false)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
                >
                  J'ai compris
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal créer demande */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">Créer une demande d'avis</h2>
              
              <form onSubmit={handleCreateRequest} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Plateforme *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPlatform('google')}
                      className={`p-4 border-2 rounded-xl ${
                        platform === 'google' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      🔍 Google My Business
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatform('trustpilot')}
                      className={`p-4 border-2 rounded-xl ${
                        platform === 'trustpilot' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      ⭐ Trustpilot
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nom du business *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Restaurant Le Jardin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL du profil *</label>
                  <input
                    type="url"
                    value={businessUrl}
                    onChange={(e) => setBusinessUrl(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie (optionnel)</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Restaurant, Immobilier, Tech..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Instructions (optionnel)</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Précisez ce que vous souhaitez dans l'avis..."
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Coût:</strong> 2 crédits (-2) • Vous aurez: {(credits?.credits_balance || 0) - 2} crédits après
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">⚠️ Rappel de sécurité</p>
                      <p>Assurez-vous que les avis seront laissés de manière naturelle et espacée dans le temps pour éviter la détection.</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Création...' : 'Créer la demande (-2 crédits)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal soumettre preuve */}
        {showProofModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full"
            >
              <h2 className="text-2xl font-bold mb-6">Soumettre la preuve de l'avis</h2>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="font-semibold">{selectedTask.business_name}</p>
                <p className="text-sm text-gray-600">{selectedTask.platform === 'google' ? 'Google My Business' : 'Trustpilot'}</p>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">URL de la capture d'écran *</label>
                  <input
                    type="url"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="https://... (utilisez imgur.com ou imgbb.com)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Uploadez votre capture sur imgur.com puis collez le lien ici
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Texte de votre avis *</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Copiez le texte de l'avis que vous avez laissé..."
                    required
                  />
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800">
                      <strong>💡 Astuce :</strong> Un bon avis mentionne des détails spécifiques (nom du serveur, 
                      plat commandé, ambiance, délai d'attente, etc.) plutôt que des phrases génériques.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Envoi...' : 'Soumettre pour validation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProofModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewExchangeDashboard;
