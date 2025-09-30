import React, { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWebsite } from '../../lib/supabase';
import { WebsiteCategory } from '../../types';
import { WEBSITE_CATEGORIES } from '../../utils/categories';
import toast from 'react-hot-toast';

interface WebsiteFormData {
  title: string;
  url: string;
  category: WebsiteCategory;
  available_link_spots: number;
  new_article_price: number;
  monthly_traffic: number;
  domain_authority: number;
  organic_keywords: number;
  languages: string[];
}

interface BulkWebsiteFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BulkWebsiteForm: React.FC<BulkWebsiteFormProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'add-sites' | 'configure-sites' | 'review'>('add-sites');
  const [websites, setWebsites] = useState<WebsiteFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkSitesText, setBulkSitesText] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleProcessBulkSites = async () => {
    if (!bulkSitesText.trim()) {
      toast.error('Veuillez saisir les sites web');
      return;
    }

    setProcessing(true);
    try {
      // Séparer les sites par ligne
      const siteLines = bulkSitesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (siteLines.length === 0) {
        toast.error('Aucun site valide trouvé');
        return;
      }

      const processedSites: WebsiteFormData[] = [];

      for (const siteLine of siteLines) {
        try {
          // Détecter si c'est une URL ou un titre + URL
          let title = '';
          let url = '';

          if (siteLine.startsWith('http://') || siteLine.startsWith('https://')) {
            // C'est une URL directe
            url = siteLine;
            title = generateTitleFromUrl(url);
          } else {
            // C'est probablement "Titre - URL" ou juste "Titre"
            const parts = siteLine.split(' - ');
            if (parts.length >= 2) {
              title = parts[0].trim();
              url = parts[1].trim();
            } else {
              // Essayer de détecter une URL dans le texte
              const urlMatch = siteLine.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch) {
                url = urlMatch[1];
                title = siteLine.replace(urlMatch[1], '').trim();
                if (!title) {
                  title = generateTitleFromUrl(url);
                }
              } else {
                // Pas d'URL trouvée, ignorer cette ligne
                continue;
              }
            }
          }

          // Valider l'URL
          new URL(url);
          
          const newSite: WebsiteFormData = {
            title: title,
            url: url,
            category: 'computers_technology' as WebsiteCategory,
            available_link_spots: 1,
            new_article_price: 100,
            monthly_traffic: 0,
            domain_authority: 0,
            organic_keywords: 0,
            languages: ['Français']
          };

          processedSites.push(newSite);
        } catch (error) {
          console.warn('Site invalide ignoré:', siteLine);
        }
      }

      if (processedSites.length === 0) {
        toast.error('Aucun site valide trouvé');
        return;
      }

      setWebsites(processedSites);
      setBulkSitesText('');
      toast.success(`${processedSites.length} sites web traités avec succès !`);
      
    } catch (error) {
      console.error('Erreur lors du traitement des sites:', error);
      toast.error('Erreur lors du traitement des sites');
    } finally {
      setProcessing(false);
    }
  };

  // Générer un titre basé sur l'URL
  const generateTitleFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Enlever www. si présent
      const cleanHostname = hostname.replace(/^www\./, '');
      
      // Prendre le domaine principal
      const domain = cleanHostname.split('.')[0];
      
      // Capitaliser la première lettre
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Nouveau Site';
    }
  };

  const removeWebsite = (index: number) => {
    setWebsites(websites.filter((_, i) => i !== index));
  };

  const updateWebsite = (index: number, field: keyof WebsiteFormData, value: any) => {
    const updated = [...websites];
    updated[index] = { ...updated[index], [field]: value };
    setWebsites(updated);
  };

  const updateLanguages = (index: number, languagesString: string) => {
    const languages = languagesString.split(',').map(l => l.trim()).filter(l => l);
    updateWebsite(index, 'languages', languages.length > 0 ? languages : ['Français']);
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const validateWebsite = (website: WebsiteFormData, index: number): string[] => {
    const errors: string[] = [];
    
    if (!website.title || website.title.length < 3) {
      errors.push(`Site ${index + 1}: Titre requis (minimum 3 caractères)`);
    }
    
    if (!website.url || !website.url.match(/^https?:\/\/.+/)) {
      errors.push(`Site ${index + 1}: URL valide requise (doit commencer par http:// ou https://)`);
    }
    
    if (!website.category) {
      errors.push(`Site ${index + 1}: Catégorie requise`);
    }
    
    if (website.available_link_spots < 1) {
      errors.push(`Site ${index + 1}: Nombre d'emplacements invalide (minimum 1)`);
    }
    
    if (website.new_article_price < 10) {
      errors.push(`Site ${index + 1}: Prix invalide (minimum 10 MAD)`);
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Validation
    const allErrors: string[] = [];
    websites.forEach((website, index) => {
      allErrors.push(...validateWebsite(website, index));
    });
    
    if (allErrors.length > 0) {
      allErrors.forEach(error => toast.error(error));
      setLoading(false);
      return;
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const website of websites) {
      try {
        const websiteData = {
          ...website,
          description: `${website.title} - Site web ajouté en masse`,
          slug: generateSlug(website.title),
          meta_title: website.title,
          meta_description: `${website.title} - Site web ajouté en masse`,
          metrics: {
            monthly_traffic: website.monthly_traffic,
            domain_authority: website.domain_authority,
            organic_keywords: website.organic_keywords
          },
          is_new_article: true
        };

        await createWebsite(websiteData);
        successCount++;
      } catch (error) {
        failedCount++;
        console.error('Error creating website:', error);
      }
    }
    
    setLoading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} sites web créés avec succès !`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} sites web n'ont pas pu être créés`);
    }
    
    if (successCount > 0) {
      onSuccess?.();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Globe className="h-8 w-8 mr-3 text-blue-600" />
                Ajout multiple de sites web
              </h1>
              <p className="text-gray-600 mt-2">
                Ajoutez plusieurs sites web en une seule fois
              </p>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { key: 'add-sites', label: 'Ajouter les sites', icon: Plus },
              { key: 'configure-sites', label: 'Configurer', icon: Globe },
              { key: 'review', label: 'Créer les sites', icon: Save }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.key;
              const isCompleted = ['add-sites', 'configure-sites'].indexOf(step) > index;
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-blue-600 bg-blue-600 text-white' :
                    isCompleted ? 'border-green-600 bg-green-600 text-white' :
                    'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {stepItem.label}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          {/* Step 1: Add Sites */}
          {step === 'add-sites' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Ajouter vos sites web
              </h2>
              
              <p className="text-gray-600">
                Ajoutez vos sites web en collant les URLs ou "Titre - URL" une par ligne.
              </p>

              {/* Zone de saisie en lot */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter les sites en lot</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sites web (un par ligne) *
                    </label>
                    <textarea
                      value={bulkSitesText}
                      onChange={(e) => setBulkSitesText(e.target.value)}
                      placeholder={`https://example.com
Mon Blog Tech - https://monblogtech.ma
Guide Voyage - https://guidevoyage.ma
Actualités Maroc - https://actualites.ma`}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Vous pouvez coller des URLs directes ou "Titre - URL". Les titres seront détectés automatiquement.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleProcessBulkSites}
                      disabled={processing || !bulkSitesText.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Traiter les sites</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des sites ajoutés */}
              {websites.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Sites ajoutés ({websites.length})
                    </h3>
                    <button
                      onClick={() => setStep('configure-sites')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continuer
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {websites.map((site, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{site.title}</p>
                          <p className="text-sm text-gray-600">{site.url}</p>
                        </div>
                        <button
                          onClick={() => removeWebsite(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure Sites */}
          {step === 'configure-sites' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Configurer les sites ({websites.length} ajoutés)
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Configurez les paramètres pour chaque site web
                  </p>
                </div>
              </div>

              {/* Liste des sites web avec configuration */}
              <div className="space-y-4">
                {websites.map((website, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Site #{index + 1}: {website.title || 'Nouveau site'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Catégorie */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catégorie *
                        </label>
                        <select
                          value={website.category}
                          onChange={(e) => updateWebsite(index, 'category', e.target.value as WebsiteCategory)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {WEBSITE_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Langues */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Langues
                        </label>
                        <input
                          type="text"
                          value={website.languages.join(', ')}
                          onChange={(e) => updateLanguages(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Français, Anglais"
                        />
                      </div>

                      {/* Emplacements */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emplacements disponibles *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={website.available_link_spots}
                          onChange={(e) => updateWebsite(index, 'available_link_spots', parseInt(e.target.value) || 1)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Prix */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix nouveaux articles (MAD) *
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={website.new_article_price}
                          onChange={(e) => updateWebsite(index, 'new_article_price', parseInt(e.target.value) || 10)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Trafic mensuel */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trafic mensuel
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={website.monthly_traffic}
                          onChange={(e) => updateWebsite(index, 'monthly_traffic', parseInt(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Domain Authority */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Domain Authority
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={website.domain_authority}
                          onChange={(e) => updateWebsite(index, 'domain_authority', parseInt(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep('review')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Continuer</span>
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Create */}
          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirmer la création ({websites.length} sites)
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Prêt à créer {websites.length} sites web
                    </p>
                    <p className="text-sm text-green-700">
                      Tous les sites seront créés avec les paramètres configurés
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Résumé</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sites web:</span>
                      <span className="font-medium">{websites.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prix moyen:</span>
                      <span className="font-medium">
                        {Math.round(
                          websites.reduce((sum, site) => sum + site.new_article_price, 0) / websites.length
                        )} MAD
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Aperçu des sites</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {websites.slice(0, 5).map((site, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded border">
                        <p className="font-medium truncate">{site.title}</p>
                        <p className="text-gray-500 truncate">{site.url}</p>
                      </div>
                    ))}
                    {websites.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... et {websites.length - 5} autres sites
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('configure-sites')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Créer {websites.length} sites web</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BulkWebsiteForm;
