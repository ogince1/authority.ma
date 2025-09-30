import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface StripePaymentProps {
  amount: number;
  currency: string;
  onSuccess: (paymentId: string, amount: number) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  currency,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      // Simulation d'un paiement Stripe
      // En production, vous utiliseriez l'API Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler un succès (en production, vérifiez la réponse de Stripe)
      const paymentId = `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setPaymentStatus('success');
      onSuccess(paymentId, amount);
      toast.success('Paiement par carte réussi !');
      
    } catch (error) {
      console.error('Erreur Stripe:', error);
      setPaymentStatus('error');
      onError('Erreur lors du traitement du paiement');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="text-center mb-6">
        <CreditCard className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Paiement par Carte Bancaire
        </h3>
        <p className="text-gray-600">
          Montant à payer : <span className="font-semibold">{amount} {currency}</span>
        </p>
      </div>

      {paymentStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">Paiement réussi !</span>
          </div>
        </motion.div>
      )}

      {paymentStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Erreur de paiement</span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Informations de paiement</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Montant :</span>
              <span className="font-medium">{amount} {currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Frais :</span>
              <span className="font-medium">0 {currency}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total :</span>
                <span>{amount} {currency}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du titulaire de la carte
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de carte
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'expiration
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MM/AA"
                maxLength={5}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Lock className="h-4 w-4" />
          <span>Paiement sécurisé par Stripe</span>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Traitement...
              </>
            ) : (
              `Payer ${amount} ${currency}`
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Vos informations de paiement sont sécurisées et cryptées.
            <br />
            En utilisant ce service, vous acceptez nos{' '}
            <a href="/terms" className="text-blue-500 hover:underline">
              conditions d'utilisation
            </a>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default StripePayment; 