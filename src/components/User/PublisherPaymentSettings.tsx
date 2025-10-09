import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Building, 
  Mail, 
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface BankAccountInfo {
  bank_name?: string;
  account_holder?: string;
  iban?: string;
  rib?: string;
  swift_code?: string;
}

const PublisherPaymentSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankAccountInfo, setBankAccountInfo] = useState<BankAccountInfo>({});
  const [paypalEmail, setPaypalEmail] = useState('');
  const [preferredMethod, setPreferredMethod] = useState<'bank_transfer' | 'paypal'>('bank_transfer');

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_publisher_payment_info');

      if (error) {
        console.error('Error loading payment info:', error);
        toast.error('Erreur lors du chargement des informations');
        return;
      }

      if (data && data.length > 0) {
        const info = data[0];
        setBankAccountInfo(info.bank_account_info || {});
        setPaypalEmail(info.paypal_email || '');
        setPreferredMethod(info.preferred_withdrawal_method || 'bank_transfer');
      }
    } catch (error) {
      console.error('Error loading payment info:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase.rpc('update_publisher_payment_info', {
        p_bank_account_info: bankAccountInfo,
        p_paypal_email: paypalEmail || null,
        p_preferred_method: preferredMethod
      });

      if (error) {
        console.error('Error updating payment info:', error);
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      if (data?.success) {
        toast.success('Informations de paiement mises à jour !');
      } else {
        toast.error(data?.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error updating payment info:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateBankInfo = (field: keyof BankAccountInfo, value: string) => {
    setBankAccountInfo(prev => ({
      ...prev,
      [field]: value
    }));
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Informations de Paiement</h2>
        <p className="text-gray-600 mt-1">Configurez vos méthodes de retrait pour recevoir vos revenus</p>
      </div>

      {/* Méthode préférée */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthode de retrait préférée</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="bank_transfer"
              checked={preferredMethod === 'bank_transfer'}
              onChange={(e) => setPreferredMethod(e.target.value as any)}
              className="text-blue-600"
            />
            <Building className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Virement bancaire</p>
              <p className="text-sm text-gray-500">Retrait direct sur votre compte bancaire</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="paypal"
              checked={preferredMethod === 'paypal'}
              onChange={(e) => setPreferredMethod(e.target.value as any)}
              className="text-blue-600"
            />
            <Mail className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">PayPal</p>
              <p className="text-sm text-gray-500">Retrait via votre compte PayPal</p>
            </div>
          </label>
        </div>
      </div>

      {/* Informations bancaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations bancaires</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la banque
            </label>
            <input
              type="text"
              value={bankAccountInfo.bank_name || ''}
              onChange={(e) => updateBankInfo('bank_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: CIH Banque"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titulaire du compte
            </label>
            <input
              type="text"
              value={bankAccountInfo.account_holder || ''}
              onChange={(e) => updateBankInfo('account_holder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <input
              type="text"
              value={bankAccountInfo.iban || ''}
              onChange={(e) => updateBankInfo('iban', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="MA64 2301 3074 1645 1211 0289 0048"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RIB
            </label>
            <input
              type="text"
              value={bankAccountInfo.rib || ''}
              onChange={(e) => updateBankInfo('rib', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="230 130 7416451211028900 48"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code SWIFT/BIC (optionnel)
            </label>
            <input
              type="text"
              value={bankAccountInfo.swift_code || ''}
              onChange={(e) => updateBankInfo('swift_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="CIHMMAMC"
            />
          </div>
        </div>
      </div>

      {/* Informations PayPal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations PayPal</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email PayPal
          </label>
          <input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="votre-email@paypal.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email associé à votre compte PayPal pour recevoir les paiements
          </p>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sauvegarde...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Informations sur les retraits */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">💡 À propos des retraits</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Les demandes de retrait sont traitées par l'administration</p>
          <p>• Les virements bancaires prennent 2-5 jours ouvrés</p>
          <p>• Les retraits PayPal sont traités sous 24h</p>
          <p>• Montant minimum de retrait : 50 MAD</p>
        </div>
      </div>
    </div>
  );
};

export default PublisherPaymentSettings;
