import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createCampaign, 
  analyzeURL, 
  getLinkRecommendations,
  getCurrentUser,
  ensureUserProfile 
} from '../../lib/supabase';
import { Campaign, LinkOpportunity, URLAnalysis } from '../../types';

interface CampaignCreationFlowProps {
  onCampaignCreated?: (campaign: Campaign) => void;
}

const CampaignCreationFlow: React.FC<CampaignCreationFlowProps> = ({ onCampaignCreated }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire de campagne
  const [campaignData, setCampaignData] = useState({
    name: '',
    urls: [] as string[],
    language: 'Français',
    budget: 0
  });

  // État des analyses d'URL
  const [urlAnalyses, setUrlAnalyses] = useState<URLAnalysis[]>([]);
  const [analyzingUrls, setAnalyzingUrls] = useState(false);

  // État des recommandations
  const [recommendations, setRecommendations] = useState<LinkOpportunity[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // État de la campagne créée
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        // S'assurer que le profil utilisateur existe
        await ensureUserProfile(user.id);
      } catch (error) {
        console.error('Erreur de vérification auth:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // Étape 1: Informations de base de la campagne
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignData.name.trim()) {
      setError('Le nom de la campagne est requis');
      return;
    }

    if (campaignData.urls.length === 0) {
      setError('Au moins une URL est requise');
      return;
    }

    setError(null);
    setCurrentStep(2);
  };

  // Étape 2: Analyse des URLs
  const handleAnalyzeUrls = async () => {
    setAnalyzingUrls(true);
    setError(null);

    try {
      const analyses: URLAnalysis[] = [];
      
      for (const url of campaignData.urls) {
        try {
          const analysis = await analyzeURL(url);
          analyses.push(analysis);
        } catch (error) {
          console.error(`Erreur analyse URL ${url}:`, error);
          // Créer une analyse par défaut en cas d'erreur
          analyses.push({
            url,
            metrics: {
              traffic: 0,
              mc: 0,
              dr: 0,
              cf: 0,
              tf: 0
            },
            category: 'Général',
            analysis_status: 'completed',
            created_at: new Date().toISOString()
          });
        }
      }

      setUrlAnalyses(analyses);
      setCurrentStep(3);
    } catch (error) {
      console.error('Erreur lors de l\'analyse des URLs:', error);
      setError('Erreur lors de l\'analyse des URLs');
    } finally {
      setAnalyzingUrls(false);
    }
  };

  // Étape 3: Récupération des recommandations
  const handleGetRecommendations = async () => {
    setLoadingRecommendations(true);
    setError(null);

    try {
      // Créer d'abord la campagne
      const campaign = await createCampaign({
        name: campaignData.name,
        urls: campaignData.urls,
        language: campaignData.language,
        budget: campaignData.budget
      });

      setCreatedCampaign(campaign);

      // Récupérer les recommandations
      const recs = await getLinkRecommendations(campaign.id);
      const allOpportunities = [...recs.existing_articles, ...recs.new_articles];
      
      setRecommendations(allOpportunities);
      setCurrentStep(4);

      // Sauvegarder l'ID de campagne pour le panier
      localStorage.setItem('current_campaign_id', campaign.id);
      
      if (onCampaignCreated) {
        onCampaignCreated(campaign);
      }
    } catch (error) {
      console.error('Erreur lors de la création de campagne:', error);
      setError('Erreur lors de la création de campagne');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Étape 4: Sélection des liens et passage au panier
  const handleAddToCart = (opportunity: LinkOpportunity) => {
    // Ajouter au panier localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItem = {
      id: opportunity.id,
      listing: {
        id: opportunity.id,
        title: opportunity.site_name,
        description: `Lien ${opportunity.type === 'existing_article' ? 'existant' : 'nouveau'} sur ${opportunity.site_name}`,
        price: opportunity.price,
        category: opportunity.theme
      },
      targetUrl: campaignData.urls[0] || '',
      anchorText: '',
      quantity: 1,
      isVirtualLink: opportunity.type === 'new_article'
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));

    // Notification de succès
    alert(`Lien ajouté au panier: ${opportunity.site_name}`);
  };

  const handleProceedToCart = () => {
    navigate('/panier');
  };

  // Fonction pour ajouter une URL
  const addUrl = () => {
    setCampaignData(prev => ({
      ...prev,
      urls: [...prev.urls, '']
    }));
  };

  // Fonction pour supprimer une URL
  const removeUrl = (index: number) => {
    setCampaignData(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  // Fonction pour mettre à jour une URL
  const updateUrl = (index: number, value: string) => {
    setCampaignData(prev => ({
      ...prev,
      urls: prev.urls.map((url, i) => i === index ? value : url)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Créer une nouvelle campagne
        </h1>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Informations</span>
            <span>Analyse URLs</span>
            <span>Recommandations</span>
            <span>Panier</span>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Étape 1: Informations de base */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la campagne *
              </label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Campagne SEO E-commerce"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URLs à analyser *
              </label>
              {campaignData.urls.map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeUrl(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addUrl}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Ajouter une URL
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <select
                value={campaignData.language}
                onChange={(e) => setCampaignData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Français">Français</option>
                <option value="Anglais">Anglais</option>
                <option value="Arabe">Arabe</option>
                <option value="Espagnol">Espagnol</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (MAD)
              </label>
              <input
                type="number"
                value={campaignData.budget}
                onChange={(e) => setCampaignData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Continuer
            </button>
          </form>
        )}

        {/* Étape 2: Analyse des URLs */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Analyse des URLs
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">URLs à analyser:</h3>
              <ul className="list-disc list-inside space-y-1">
                {campaignData.urls.map((url, index) => (
                  <li key={index} className="text-gray-700">{url}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleAnalyzeUrls}
              disabled={analyzingUrls}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {analyzingUrls ? 'Analyse en cours...' : 'Analyser les URLs'}
            </button>
          </div>
        )}

        {/* Étape 3: Création de campagne et recommandations */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Résultats de l'analyse
            </h2>
            
            <div className="grid gap-4">
              {urlAnalyses.map((analysis, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">{analysis.url}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                    <div>
                      <span className="text-sm text-gray-600">Trafic:</span>
                      <p className="font-medium">{analysis.metrics.traffic.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">DR:</span>
                      <p className="font-medium">{analysis.metrics.dr}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">CF:</span>
                      <p className="font-medium">{analysis.metrics.cf}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">TF:</span>
                      <p className="font-medium">{analysis.metrics.tf}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Catégorie:</span>
                      <p className="font-medium">{analysis.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGetRecommendations}
              disabled={loadingRecommendations}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loadingRecommendations ? 'Création de campagne...' : 'Créer la campagne et obtenir les recommandations'}
            </button>
          </div>
        )}

        {/* Étape 4: Sélection des liens */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                Recommandations de liens
              </h2>
              <button
                onClick={handleProceedToCart}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Voir le panier
              </button>
            </div>

            <div className="grid gap-4">
              {recommendations.map((opportunity) => (
                <div key={opportunity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{opportunity.site_name}</h3>
                      <p className="text-sm text-gray-600">{opportunity.site_url}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {opportunity.quality_type}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {opportunity.type === 'existing_article' ? 'Article existant' : 'Nouvel article'}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {opportunity.theme}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>DR: {opportunity.site_metrics.dr || 'N/A'}</span>
                        <span>TF: {opportunity.site_metrics.tf || 'N/A'}</span>
                        <span>CF: {opportunity.site_metrics.cf || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {opportunity.price} {opportunity.currency}
                      </p>
                      <button
                        onClick={() => handleAddToCart(opportunity)}
                        className="mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {recommendations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune recommandation disponible pour le moment.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignCreationFlow;
