import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  CheckCircle, 
  XCircle, 
  PenTool,
  Send,
  Save,
  X,
  Clock,
  User,
  Globe,
  Euro,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { LinkPurchaseRequest } from '../../types';
import RichTextEditor from '../Editor/RichTextEditor';

const PurchaseRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<LinkPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LinkPurchaseRequest | null>(null);
  
  // États pour la rédaction d'articles
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleKeywords, setArticleKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [writerName, setWriterName] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // ✅ FIX: Pas de JOIN avec link_listings (contrainte FK supprimée)
      const { data, error } = await supabase
        .from('link_purchase_requests')
        .select(`
          *,
          advertiser:users!link_purchase_requests_user_id_fkey(id, name, email),
          publisher:users!link_purchase_requests_publisher_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // ✅ FIX: Enrichir manuellement avec link_listings ET websites
      if (data && data.length > 0) {
        const listingIds = data.map(r => r.link_listing_id).filter(Boolean);
        
        if (listingIds.length > 0) {
          // Charger link_listings et websites en parallèle
          const [listingsResult, websitesResult] = await Promise.all([
            supabase.from('link_listings').select('id, title, website_id, website:websites(id, title, url)').in('id', listingIds),
            supabase.from('websites').select('id, title, url, new_article_price').in('id', listingIds)
          ]);
          
          const listingMap = new Map(listingsResult.data?.map(l => [l.id, l]) || []);
          const websiteMap = new Map(websitesResult.data?.map(w => [w.id, w]) || []);
          
          // Enrichir les demandes
          data.forEach(request => {
            if (request.link_listing_id) {
              const listing = listingMap.get(request.link_listing_id);
              if (listing) {
                request.link_listing = listing;
              } else {
                const website = websiteMap.get(request.link_listing_id);
                if (website) {
                  request.link_listing = {
                    id: request.link_listing_id,
                    title: `Nouvel article sur ${website.title}`,
                    website_id: website.id,
                    website: {
                      id: website.id,
                      title: website.title,
                      url: website.url
                    }
                  } as any;
                }
              }
            }
          });
        }
      }
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'new_articles') return request.content_option === 'platform';
    if (filter === 'custom_content') return request.content_option === 'custom';
    return request.status === filter;
  });


  // Fonctions pour la rédaction d'articles
  const handleWriteArticle = (request: LinkPurchaseRequest) => {
    setSelectedRequest(request);
    setArticleTitle(request.article_title || '');
    setArticleContent(request.article_content || '');
    setArticleKeywords(request.article_keywords || []);
    setWriterName(request.writer_name || '');
    setShowArticleModal(true);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !articleKeywords.includes(keywordInput.trim())) {
      setArticleKeywords([...articleKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setArticleKeywords(articleKeywords.filter((_, i) => i !== index));
  };

  const handleSaveArticle = async () => {
    if (!selectedRequest || !articleTitle.trim() || !articleContent.trim()) {
      toast.error('Veuillez remplir le titre et le contenu de l\'article');
      return;
    }

    try {
      const { error } = await supabase
        .from('link_purchase_requests')
        .update({
          article_title: articleTitle.trim(),
          article_content: articleContent.trim(),
          article_keywords: articleKeywords,
          writer_name: writerName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Article sauvegardé avec succès');
      setShowArticleModal(false);
      loadRequests();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Erreur lors de la sauvegarde de l\'article');
    }
  };

  const handleSendArticleToClient = async () => {
    if (!selectedRequest) return;

    // Validation obligatoire avant envoi
    if (!articleTitle.trim() || !articleContent.trim()) {
      toast.error('Veuillez remplir le titre et le contenu de l\'article avant de l\'envoyer');
      return;
    }

    try {
      // Sauvegarder ET envoyer en une seule opération
      const { error } = await supabase
        .from('link_purchase_requests')
        .update({
          article_title: articleTitle.trim(),
          article_content: articleContent.trim(),
          article_keywords: articleKeywords,
          writer_name: writerName.trim(),
          extended_status: 'article_ready',
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // TODO: Envoyer un email de notification au client et à l'éditeur
      toast.success('Article sauvegardé et envoyé avec succès ! L\'éditeur peut maintenant ajouter l\'URL de placement.');
      setShowArticleModal(false);
      loadRequests();
    } catch (error) {
      console.error('Error sending article:', error);
      toast.error('Erreur lors de l\'envoi de l\'article');
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
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Acceptée
          </span>
        );
      case 'accepted_waiting_article':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FileText className="h-3 w-3 mr-1" />
            En attente d'article
          </span>
        );
      case 'article_ready':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FileText className="h-3 w-3 mr-1" />
            Article prêt
          </span>
        );
      case 'placement_pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Placement en attente
          </span>
        );
      case 'placement_completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Placement terminé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Refusée
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Demandes d'Achat</h1>
            <p className="text-gray-600 mt-1">
              Gérez toutes les demandes d'achat de liens et rédigez les articles
            </p>
          </div>
        </div>
        
        {/* Filtres */}
        <div className="mt-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'new_articles', label: 'Nouveaux articles' },
              { key: 'custom_content', label: 'Contenu personnalisé' },
              { key: 'pending', label: 'En attente' },
              { key: 'accepted', label: 'Acceptées' },
              { key: 'confirmed', label: 'Confirmées' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === filterOption.key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.link_listing?.title || 'Lien'}
                  </h3>
                  {getStatusBadge(request.extended_status || request.status)}
                  {request.content_option === 'platform' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      Article à rédiger
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span><strong>Annonceur:</strong> {request.advertiser?.name || request.advertiser?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span><strong>Éditeur:</strong> {request.publisher?.name || request.publisher?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4" />
                    <span><strong>Prix:</strong> {request.proposed_price} MAD</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span><strong>Date:</strong> {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {request.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Message:</span>
                    <p className="text-gray-600 mt-1">{request.message}</p>
                  </div>
                )}

                {request.content_option === 'platform' && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-orange-700">📝 Article à rédiger par la plateforme</span>
                    <p className="text-orange-600 mt-1">
                      URL cible: <a href={request.target_url} target="_blank" rel="noopener noreferrer" className="underline">
                        {request.target_url}
                      </a>
                    </p>
                    <p className="text-orange-600">
                      Texte d'ancrage: <strong>{request.anchor_text}</strong>
                    </p>
                  </div>
                )}

                {request.content_option === 'custom' && request.custom_content && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-700">📄 Contenu personnalisé:</span>
                    <p className="text-blue-600 mt-1 whitespace-pre-line">{request.custom_content}</p>
                  </div>
                )}

                {request.article_title && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-700">✅ Article rédigé:</span>
                    <p className="text-green-600 mt-1"><strong>{request.article_title}</strong></p>
                    {request.writer_name && (
                      <p className="text-green-600">Rédigé par: {request.writer_name}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    // Afficher les détails
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Voir détails"
                >
                  <Eye className="h-4 w-4" />
                </button>
                
                {/* Bouton pour rédiger un article */}
                {request.content_option === 'platform' && 
                 ['pending', 'accepted'].includes(request.status) && (
                  <button
                    onClick={() => handleWriteArticle(request)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Rédiger l'article"
                  >
                    <PenTool className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
            <p className="text-gray-600">Aucune demande ne correspond aux filtres sélectionnés</p>
          </div>
        )}
      </div>

      {/* Modal de rédaction d'article */}
      {showArticleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Rédiger l'article - {selectedRequest.link_listing?.title}
              </h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations de la demande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Informations de la demande</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Annonceur:</span> {selectedRequest.advertiser?.name}</div>
                  <div><span className="font-medium">Éditeur:</span> {selectedRequest.publisher?.name}</div>
                  <div><span className="font-medium">Prix:</span> {selectedRequest.proposed_price} MAD</div>
                  <div><span className="font-medium">URL cible:</span> 
                    <a href={selectedRequest.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">
                      {selectedRequest.target_url}
                    </a>
                  </div>
                  <div><span className="font-medium">Texte d'ancrage:</span> <strong>{selectedRequest.anchor_text}</strong></div>
                  <div><span className="font-medium">Site web:</span> {selectedRequest.link_listing?.website?.title}</div>
                </div>
              </div>

              {/* Nom du rédacteur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rédacteur (votre nom)
                </label>
                <input
                  type="text"
                  value={writerName}
                  onChange={(e) => setWriterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>

              {/* Titre de l'article */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'article
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Titre accrocheur de l'article"
                />
              </div>

              {/* Mots-clés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mots-clés ciblés
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ajouter un mot-clé"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                {articleKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {articleKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contenu de l'article */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de l'article
                </label>
                <RichTextEditor
                  value={articleContent}
                  onChange={setArticleContent}
                  placeholder="Rédigez l'article complet ici avec formatage professionnel..."
                  rows={15}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {articleContent.replace(/<[^>]*>/g, '').length} caractères
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowArticleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveArticle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Sauvegarder (brouillon)
              </button>
              <button
                onClick={handleSendArticleToClient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!articleTitle.trim() || !articleContent.trim()}
              >
                <Send className="h-4 w-4 mr-2 inline" />
                Sauvegarder et Envoyer au client
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestsManagement;
