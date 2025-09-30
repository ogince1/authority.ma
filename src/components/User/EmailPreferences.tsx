// Composant pour gérer les préférences email
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Bell, 
  Settings, 
  Check, 
  X, 
  Save,
  RefreshCw
} from 'lucide-react';
const EmailPreferences: React.FC = () => {
  // ✅ FIX: Gestion locale des préférences sans hook externe
  const [preferences, setPreferences] = useState({
    marketing_emails: true,
    transaction_emails: true,
    notification_emails: true,
    weekly_digest: false
  });
  const [loading, setLoading] = useState(false);
  
  const updatePreferences = async (newPreferences: any) => {
    setLoading(true);
    try {
      // Simulation d'une mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  React.useEffect(() => {
    setLocalPreferences(prev => ({
      ...preferences,
      marketing_emails: true // Toujours activé
    }));
  }, [preferences]);

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    // Empêcher la modification de marketing_emails
    if (key === 'marketing_emails') {
      return;
    }
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
  };

  const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);

  const preferenceOptions = [
    {
      key: 'welcome_emails' as const,
      title: 'Emails de bienvenue',
      description: 'Recevoir des emails de bienvenue et d\'onboarding',
      icon: Mail
    },
    {
      key: 'order_notifications' as const,
      title: 'Notifications de commandes',
      description: 'Être notifié des nouvelles commandes et de leur statut',
      icon: Bell
    },
    {
      key: 'site_notifications' as const,
      title: 'Notifications de sites',
      description: 'Recevoir des notifications sur l\'approbation/rejet de vos sites',
      icon: Settings
    },
    {
      key: 'weekly_reports' as const,
      title: 'Rapports hebdomadaires',
      description: 'Recevoir un résumé hebdomadaire de votre activité',
      icon: Mail
    },
    {
      key: 'marketing_emails' as const,
      title: 'Emails marketing',
      description: 'Recevoir des offres spéciales et des nouveautés (toujours activé)',
      icon: Bell
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Préférences Email</h2>
              <p className="text-gray-600">Configurez vos préférences de notifications par email</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {preferenceOptions.map((option, index) => (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <option.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${
                    localPreferences[option.key] ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {localPreferences[option.key] ? 'Activé' : 'Désactivé'}
                  </span>
                  
                  {option.key === 'marketing_emails' ? (
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 cursor-not-allowed opacity-75">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePreferenceChange(option.key, !localPreferences[option.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localPreferences[option.key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localPreferences[option.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-blue-100 rounded">
                    <Settings className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Modifications non sauvegardées
                    </p>
                    <p className="text-xs text-blue-700">
                      Vous avez des modifications en attente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleReset}
                    disabled={isSaving}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Annuler
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Informations importantes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Les emails de sécurité (réinitialisation de mot de passe) sont toujours envoyés</li>
              <li>• Vous pouvez modifier vos préférences à tout moment</li>
              <li>• Les modifications prennent effet immédiatement</li>
              <li>• Vous recevrez toujours les notifications critiques</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
