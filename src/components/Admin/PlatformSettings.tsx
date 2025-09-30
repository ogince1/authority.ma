import React from 'react';
import {
  Settings,
  Save,
  DollarSign,
  Shield,
  Users,
  Globe,
  Mail,
  Bell,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, getPlatformSettings, updatePlatformSettings, resetPlatformSettingsToDefaults } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface PlatformSettings {
  // Commissions
  commission_rate: number;
  deposit_commission_rate: number;
  minimum_commission: number;
  maximum_commission: number;
  
  // Limites
  max_websites_per_user: number;
  max_listings_per_website: number;
  max_purchase_requests_per_day: number;
  minimum_balance_for_withdrawal: number;
  
  // Paiements
  payment_methods: string[];
  auto_approve_payments: boolean;
  payment_processing_fee: number;
  
  // Notifications
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  admin_notification_email: string;
  
  // Sécurité
  require_email_verification: boolean;
  require_phone_verification: boolean;
  max_login_attempts: number;
  session_timeout_minutes: number;
  
  // Contenu
  auto_approve_websites: boolean;
  auto_approve_listings: boolean;
  
  // Maintenance
  maintenance_mode: boolean;
  maintenance_message: string;
}

const PlatformSettings: React.FC = () => {
  const [settings, setSettings] = React.useState<PlatformSettings>({
    commission_rate: 15,
    deposit_commission_rate: 5,
    minimum_commission: 5,
    maximum_commission: 50,
    max_websites_per_user: 10,
    max_listings_per_website: 50,
    max_purchase_requests_per_day: 20,
    minimum_balance_for_withdrawal: 100,
    payment_methods: ['card', 'bank_transfer'],
    auto_approve_payments: true,
    payment_processing_fee: 2.5,
    email_notifications_enabled: true,
    push_notifications_enabled: true,
    admin_notification_email: 'admin@back.ma',
    require_email_verification: true,
    require_phone_verification: false,
    max_login_attempts: 5,
    session_timeout_minutes: 60,
    auto_approve_websites: false,
    auto_approve_listings: true,
    maintenance_mode: false,
    maintenance_message: 'La plateforme est en maintenance. Veuillez réessayer plus tard.'
  });
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('commissions');

  React.useEffect(() => {
    trackPageView('/admin/settings', 'Paramètres Plateforme | Back.ma');
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      console.log('Chargement des paramètres de la plateforme...');
      const loadedSettings = await getPlatformSettings();
      
      // Mettre à jour l'état avec les paramètres chargés
      setSettings(prevSettings => ({
        ...prevSettings,
        ...loadedSettings
      }));
      
      console.log('Paramètres chargés:', loadedSettings);
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      console.log('Sauvegarde des paramètres:', settings);
      await updatePlatformSettings(settings);
      
      toast.success('Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      try {
        setSaving(true);
        await resetPlatformSettingsToDefaults();
        
        // Recharger les paramètres après réinitialisation
        await loadSettings();
        
        toast.success('Paramètres réinitialisés avec succès !');
      } catch (error) {
        console.error('Error resetting settings:', error);
        toast.error('Erreur lors de la réinitialisation');
      } finally {
        setSaving(false);
      }
    }
  };

  const tabs = [
    { id: 'commissions', name: 'Commissions', icon: DollarSign },
    { id: 'limits', name: 'Limites', icon: Shield },
    { id: 'payments', name: 'Paiements', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Sécurité', icon: Shield },
    { id: 'content', name: 'Contenu', icon: Globe },
    { id: 'maintenance', name: 'Maintenance', icon: AlertTriangle }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres de la Plateforme</h1>
            <p className="text-gray-600 mt-1">
              Configurez les paramètres généraux d'Back.ma
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={resetToDefaults}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'commissions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration des Commissions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de commission (%)
                </label>
                <input
                  type="number"
                  value={settings.commission_rate}
                  onChange={(e) => setSettings({...settings, commission_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Pourcentage prélevé sur chaque transaction</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission dépôt annonceur (%)
                </label>
                <input
                  type="number"
                  value={settings.deposit_commission_rate}
                  onChange={(e) => setSettings({...settings, deposit_commission_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Commission sur les dépôts des annonceurs</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission minimum (MAD)
                </label>
                <input
                  type="number"
                  value={settings.minimum_commission}
                  onChange={(e) => setSettings({...settings, minimum_commission: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission maximum (MAD)
                </label>
                <input
                  type="number"
                  value={settings.maximum_commission}
                  onChange={(e) => setSettings({...settings, maximum_commission: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'limits' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Limites Utilisateurs</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sites web max par utilisateur
                </label>
                <input
                  type="number"
                  value={settings.max_websites_per_user}
                  onChange={(e) => setSettings({...settings, max_websites_per_user: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annonces max par site
                </label>
                <input
                  type="number"
                  value={settings.max_listings_per_website}
                  onChange={(e) => setSettings({...settings, max_listings_per_website: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demandes d'achat max par jour
                </label>
                <input
                  type="number"
                  value={settings.max_purchase_requests_per_day}
                  onChange={(e) => setSettings({...settings, max_purchase_requests_per_day: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solde minimum pour retrait (MAD)
                </label>
                <input
                  type="number"
                  value={settings.minimum_balance_for_withdrawal}
                  onChange={(e) => setSettings({...settings, minimum_balance_for_withdrawal: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration des Paiements</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthodes de paiement autorisées
                </label>
                <div className="space-y-2">
                  {['card', 'bank_transfer', 'paypal', 'crypto'].map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment_methods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({
                              ...settings,
                              payment_methods: [...settings.payment_methods, method]
                            });
                          } else {
                            setSettings({
                              ...settings,
                              payment_methods: settings.payment_methods.filter(m => m !== method)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {method.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de traitement (%)
                  </label>
                  <input
                    type="number"
                    value={settings.payment_processing_fee}
                    onChange={(e) => setSettings({...settings, payment_processing_fee: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.auto_approve_payments}
                    onChange={(e) => setSettings({...settings, auto_approve_payments: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Approuver automatiquement les paiements
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration des Notifications</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.email_notifications_enabled}
                  onChange={(e) => setSettings({...settings, email_notifications_enabled: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Activer les notifications par email
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.push_notifications_enabled}
                  onChange={(e) => setSettings({...settings, push_notifications_enabled: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Activer les notifications push
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de notification admin
                </label>
                <input
                  type="email"
                  value={settings.admin_notification_email}
                  onChange={(e) => setSettings({...settings, admin_notification_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de Sécurité</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.require_email_verification}
                  onChange={(e) => setSettings({...settings, require_email_verification: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Exiger la vérification email
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.require_phone_verification}
                  onChange={(e) => setSettings({...settings, require_phone_verification: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Exiger la vérification téléphone
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tentatives de connexion max
                  </label>
                  <input
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => setSettings({...settings, max_login_attempts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout session (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.session_timeout_minutes}
                    onChange={(e) => setSettings({...settings, session_timeout_minutes: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="15"
                    max="480"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Modération du Contenu</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_websites}
                  onChange={(e) => setSettings({...settings, auto_approve_websites: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Approuver automatiquement les sites web
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_listings}
                  onChange={(e) => setSettings({...settings, auto_approve_listings: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Approuver automatiquement les annonces
                </label>
              </div>
              
            </div>
          </motion.div>
        )}

        {activeTab === 'maintenance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mode Maintenance</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Activer le mode maintenance
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de maintenance
                </label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings({...settings, maintenance_message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Message affiché aux utilisateurs pendant la maintenance..."
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Attention
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Le mode maintenance empêche l'accès à la plateforme pour tous les utilisateurs non-admin.
                      Utilisez-le uniquement pour les mises à jour importantes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlatformSettings; 