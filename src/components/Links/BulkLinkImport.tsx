import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Check, 
  X, 
  Search, 
  Filter,
  Globe,
  Link as LinkIcon,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Website, CreateLinkListingData } from '../../types';
import { getWebsites, createBulkLinkListings } from '../../lib/supabase';
import { getCurrentUser } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ExtractedLink {
  url: string;
  title: string;
  description?: string;
  anchorText?: string;
}

interface SelectedLink extends ExtractedLink {
  selected: boolean;
  listingData: Partial<CreateLinkListingData>;
}

interface BulkLinkImportProps {
  onSuccess: (created: any[]) => void;
  onCancel: () => void;
}

const BulkLinkImport: React.FC<BulkLinkImportProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'select-website' | 'add-links' | 'configure-links' | 'review'>('select-website');
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [extractedLinks, setExtractedLinks] = useState<SelectedLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<SelectedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Configuration par défaut pour tous les liens
  const [defaultConfig, setDefaultConfig] = useState({
    link_type: 'dofollow' as const,
    position: 'content' as const,
    price: 0,
    currency: 'MAD' as const,
    minimum_contract_duration: 1,
    max_links_per_page: 1,
    status: 'active' as const
  });

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    // Filtrer les liens selon le terme de recherche
    const filtered = extractedLinks.filter(link =>
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredLinks(filtered);
  }, [extractedLinks, searchTerm]);

  const fetchWebsites = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const websitesData = await getWebsites({ user_id: user.id });
      setWebsites(websitesData);
    } catch (error) {
      console.error('Error fetching websites:', error);
      toast.error('Erreur lors du chargement des sites web');
    }
  };

  const handleProcessBulkLinks = async () => {
    if (!bulkLinksText.trim() || !selectedWebsite) {
      toast.error('Veuillez saisir les liens');
      return;
    }

    setProcessing(true);
    try {
      // Séparer les liens par ligne
      const linkLines = bulkLinksText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (linkLines.length === 0) {
        toast.error('Aucun lien valide trouvé');
        return;
      }

      const processedLinks: SelectedLink[] = [];

      for (const url of linkLines) {
        try {
          // Valider l'URL
          new URL(url);
          
          // Détecter le titre automatiquement
          const title = await detectTitleFromUrl(url);
          
          const newLink: SelectedLink = {
            url: url,
            title: title,
            selected: true,
            listingData: {
              website_id: selectedWebsite.id,
              title: title,
              description: '',
              target_url: url,
              anchor_text: title,
              ...defaultConfig
            }
          };

          processedLinks.push(newLink);
        } catch (error) {
          console.warn('URL invalide ignorée:', url);
        }
      }

      if (processedLinks.length === 0) {
        toast.error('Aucun lien valide trouvé');
        return;
      }

      setExtractedLinks(processedLinks);
      setBulkLinksText('');
      toast.success(`${processedLinks.length} liens traités avec succès !`);
      
    } catch (error) {
      console.error('Erreur lors du traitement des liens:', error);
      toast.error('Erreur lors du traitement des liens');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    setExtractedLinks(prev => prev.filter((_, i) => i !== index));
    toast.success('Lien supprimé');
  };

  // Fonction pour détecter le titre depuis l'URL
  const detectTitleFromUrl = async (url: string): Promise<string> => {
    try {
      // Essayer d'extraire le titre depuis la page
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        const html = data.contents;
        
        // Parser le HTML pour extraire le titre
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Chercher le titre dans l'ordre de priorité
        const titleElement = doc.querySelector('title') || 
                           doc.querySelector('h1') || 
                           doc.querySelector('h2') ||
                           doc.querySelector('[property="og:title"]');
        
        if (titleElement) {
          const title = titleElement.textContent?.trim() || titleElement.getAttribute('content')?.trim();
          if (title && title.length > 3 && title.length < 100) {
            return title;
          }
        }
      }
    } catch (error) {
      console.warn('Impossible d\'extraire le titre pour:', url);
    }
    
    // Fallback : générer un titre basé sur l'URL
    return generateTitleFromUrl(url);
  };

  // Générer un titre basé sur l'URL
  const generateTitleFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extraire le nom du fichier ou du dossier
      const segments = pathname.split('/').filter(segment => segment);
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment) {
        // Nettoyer et formater
        return lastSegment
          .replace(/[-_]/g, ' ')
          .replace(/\.(html|php|asp|aspx)$/i, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      return 'Page du site';
    } catch {
      return 'Lien du site';
    }
  };

  const handleLinkSelection = (index: number, selected: boolean) => {
    const updatedLinks = [...extractedLinks];
    updatedLinks[index].selected = selected;
    setExtractedLinks(updatedLinks);
  };

  const handleBulkSelection = (selected: boolean) => {
    const updatedLinks = extractedLinks.map(link => ({
      ...link,
      selected
    }));
    setExtractedLinks(updatedLinks);
  };

  const handleConfigChange = (index: number, field: keyof CreateLinkListingData, value: any) => {
    const updatedLinks = [...extractedLinks];
    updatedLinks[index].listingData = {
      ...updatedLinks[index].listingData,
      [field]: value
    };
    setExtractedLinks(updatedLinks);
  };

  const handleBulkConfigChange = (field: keyof CreateLinkListingData, value: any) => {
    setDefaultConfig(prev => ({ ...prev, [field]: value }));
    
    // Appliquer aux liens sélectionnés
    const updatedLinks = extractedLinks.map(link => ({
      ...link,
      listingData: {
        ...link.listingData,
        [field]: value
      }
    }));
    setExtractedLinks(updatedLinks);
  };

  const handleCreateListings = async () => {
    const selectedLinks = extractedLinks.filter(link => link.selected);
    
    if (selectedLinks.length === 0) {
      toast.error('Aucun lien sélectionné');
      return;
    }

    setCreating(true);
    try {
      const listingsData = selectedLinks.map(link => link.listingData as CreateLinkListingData);
      
      const result = await createBulkLinkListings(listingsData);
      
      if (result.success) {
        toast.success(`${result.created.length} annonces créées avec succès !`);
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} erreurs lors de la création`);
        }
        onSuccess(result.created);
      } else {
        toast.error('Erreur lors de la création des annonces');
      }
    } catch (error) {
      console.error('Error creating listings:', error);
      toast.error('Erreur lors de la création des annonces');
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = extractedLinks.filter(link => link.selected).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Upload className="h-8 w-8 mr-3 text-blue-600" />
                Import en masse de liens
              </h1>
              <p className="text-gray-600 mt-2">
                Importez tous les liens d'un site web et configurez-les en lot
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
              { key: 'select-website', label: 'Sélectionner le site', icon: Globe },
              { key: 'add-links', label: 'Ajouter les liens', icon: Plus },
              { key: 'configure-links', label: 'Configurer', icon: Filter },
              { key: 'review', label: 'Créer les annonces', icon: Save }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.key;
              const isCompleted = ['select-website', 'add-links', 'configure-links'].indexOf(step) > index;
              
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
                  {index < 3 && (
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
          {/* Step 1: Select Website */}
          {step === 'select-website' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Sélectionnez le site web
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {websites.map(website => (
                  <motion.div
                    key={website.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedWebsite?.id === website.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedWebsite(website)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {website.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {website.url}
                        </p>
                      </div>
                      {selectedWebsite?.id === website.id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {selectedWebsite && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep('add-links')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Continuer</span>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Add Links */}
          {step === 'add-links' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Ajouter les liens pour {selectedWebsite?.title}
                </h2>
                <p className="text-gray-600">
                  Ajoutez manuellement les liens que vous souhaitez vendre sur votre site.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{selectedWebsite?.title}</p>
                    <p className="text-sm text-blue-700">{selectedWebsite?.url}</p>
                  </div>
                </div>
              </div>

              {/* Zone de saisie en lot */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter les liens en lot</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URLs des liens (une par ligne) *
                    </label>
                    <textarea
                      value={bulkLinksText}
                      onChange={(e) => setBulkLinksText(e.target.value)}
                      placeholder={`https://example.com/article1
https://example.com/article2
https://example.com/service1
https://example.com/contact`}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Collez vos URLs une par ligne. Les titres seront détectés automatiquement.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleProcessBulkLinks}
                      disabled={processing || !bulkLinksText.trim()}
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
                          <span>Traiter les liens</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des liens ajoutés */}
              {extractedLinks.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Liens ajoutés ({extractedLinks.length})
                    </h3>
                    <button
                      onClick={() => setStep('configure-links')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continuer
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {extractedLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{link.title}</p>
                          <p className="text-sm text-gray-600">{link.url}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveLink(index)}
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

          {/* Step 3: Configure Links */}
          {step === 'configure-links' && (
            <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configurer les liens ({extractedLinks.length} ajoutés)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les paramètres pour chaque lien que vous souhaitez vendre
                </p>
              </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkSelection(true)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => handleBulkSelection(false)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les liens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {selectedCount} sélectionnés
                </div>
              </div>

              {/* Default Configuration */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Configuration par défaut</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (MAD)
                    </label>
                    <input
                      type="number"
                      value={defaultConfig.price}
                      onChange={(e) => handleBulkConfigChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de lien
                    </label>
                    <select
                      value={defaultConfig.link_type}
                      onChange={(e) => handleBulkConfigChange('link_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="dofollow">Dofollow</option>
                      <option value="nofollow">Nofollow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={defaultConfig.position}
                      onChange={(e) => handleBulkConfigChange('position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="content">Contenu</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="footer">Footer</option>
                      <option value="header">Header</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée min (mois)
                    </label>
                    <input
                      type="number"
                      value={defaultConfig.minimum_contract_duration}
                      onChange={(e) => handleBulkConfigChange('minimum_contract_duration', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Links List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLinks.map((link, index) => (
                  <motion.div
                    key={link.url}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-lg transition-all ${
                      link.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={link.selected}
                        onChange={(e) => handleLinkSelection(index, e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                          <h3 className="font-medium text-gray-900 truncate">
                            {link.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {link.url}
                        </p>
                        {link.description && (
                          <p className="text-sm text-gray-500">
                            {link.description}
                          </p>
                        )}
                      </div>

                      {link.selected && (
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Prix"
                            value={link.listingData.price || ''}
                            onChange={(e) => handleConfigChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                          <select
                            value={link.listingData.link_type || 'dofollow'}
                            onChange={(e) => handleConfigChange(index, 'link_type', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="dofollow">Dofollow</option>
                            <option value="nofollow">Nofollow</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep('review')}
                  disabled={selectedCount === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Continuer ({selectedCount} sélectionnés)</span>
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review and Create */}
          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirmer la création ({selectedCount} annonces)
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Prêt à créer {selectedCount} annonces
                    </p>
                    <p className="text-sm text-green-700">
                      Toutes les annonces seront créées pour le site {selectedWebsite?.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Résumé</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Site web:</span>
                      <span className="font-medium">{selectedWebsite?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liens sélectionnés:</span>
                      <span className="font-medium">{selectedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prix moyen:</span>
                      <span className="font-medium">
                        {Math.round(
                          extractedLinks
                            .filter(link => link.selected)
                            .reduce((sum, link) => sum + (link.listingData.price || 0), 0) / selectedCount
                        ) || 0} MAD
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Aperçu des liens</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {extractedLinks.filter(link => link.selected).slice(0, 5).map((link, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded border">
                        <p className="font-medium truncate">{link.title}</p>
                        <p className="text-gray-500 truncate">{link.url}</p>
                      </div>
                    ))}
                    {selectedCount > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... et {selectedCount - 5} autres liens
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('configure-links')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleCreateListings}
                  disabled={creating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Créer {selectedCount} annonces</span>
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

export default BulkLinkImport;
