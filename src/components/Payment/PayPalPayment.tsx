import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PayPalPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (paymentId: string, amount: number) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  amount,
  currency,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [testMode, setTestMode] = useState(false);

  // Convertir MAD en EUR pour PayPal (taux approximatif 1 MAD = 0.09 EUR)
  const paypalCurrency = 'EUR';
  const paypalAmount = currency === 'MAD' ? (amount * 0.09).toFixed(2) : amount.toString();

  useEffect(() => {
    // Vérifier si les clés PayPal sont configurées
    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    
    if (!paypalClientId || paypalClientId === 'your_paypal_client_id_here') {
      console.log('🔍 Debug - Mode test PayPal activé (clés non configurées)');
      setTestMode(true);
      setLoading(false);
      return;
    }

    // Charger le script PayPal seulement si les clés sont configurées
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${paypalCurrency}`;
    script.async = true;
    script.onload = () => {
      setPaypalLoaded(true);
      setLoading(false);
    };
    script.onerror = () => {
      setLoading(false);
      onError('Erreur lors du chargement de PayPal');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [paypalCurrency, onError]);

  useEffect(() => {
    if (paypalLoaded && window.paypal) {
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: paypalAmount,
                  currency_code: paypalCurrency
                },
                description: `Rechargement de compte - Back.ma (${amount} ${currency})`,
                custom_id: `balance_recharge_${Date.now()}`
              }
            ],
            application_context: {
              shipping_preference: 'NO_SHIPPING'
            }
          });
        },

        onApprove: async (data: any, actions: any) => {
          try {
            setPaymentStatus('pending');
            
            // Capturer le paiement
            const order = await actions.order.capture();
            
            if (order.status === 'COMPLETED') {
              setPaymentStatus('success');
              
              // Extraire les informations du paiement
              const paymentId = order.id;
              const capturedAmount = parseFloat(order.purchase_units[0].amount.value);
              
              // Convertir le montant EUR reçu en MAD pour la base de données
              const madAmount = currency === 'MAD' ? (capturedAmount / 0.09) : capturedAmount;
              
              // Appeler le callback de succès avec le montant original en MAD
              onSuccess(paymentId, amount);
              
              toast.success('Paiement PayPal réussi !');
            } else {
              throw new Error('Paiement non complété');
            }
          } catch (error) {
            console.error('Erreur PayPal:', error);
            setPaymentStatus('error');
            onError('Erreur lors du traitement du paiement');
          }
        },

        onError: (err: any) => {
          console.error('Erreur PayPal:', err);
          setPaymentStatus('error');
          onError('Erreur lors du paiement PayPal');
        },

        onCancel: () => {
          onCancel();
        }
      }).render('#paypal-button-container');
    }
  }, [paypalLoaded, paypalAmount, paypalCurrency, amount, currency, onSuccess, onError, onCancel]);

  // Mode test - simulation PayPal
  const handleTestPayment = async () => {
    setLoading(true);
    setPaymentStatus('pending');
    
    try {
      // Simuler un délai de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentId = `paypal_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setPaymentStatus('success');
      onSuccess(paymentId, amount);
      toast.success('Paiement PayPal de test réussi !');
      
    } catch (error) {
      setPaymentStatus('error');
      onError('Erreur lors du paiement de test');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Chargement de PayPal...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="text-center mb-6">
        <DollarSign className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Paiement PayPal
        </h3>
        <p className="text-gray-600">
          Montant à payer : <span className="font-semibold">{amount} {currency}</span>
        </p>
        {currency === 'MAD' && (
          <p className="text-sm text-gray-500 mt-1">
            (Converti en {paypalAmount} EUR pour PayPal)
          </p>
        )}
        
        {testMode && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Mode Test :</strong> PayPal n'est pas configuré. Utilisez le bouton de test ci-dessous.
            </p>
          </div>
        )}
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

      <div className="space-y-4">
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

        {testMode ? (
          <div className="space-y-4">
            <button
              onClick={handleTestPayment}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Simulation du paiement...
                </>
              ) : (
                'Simuler le paiement PayPal'
              )}
            </button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Pour activer de vrais paiements PayPal :</p>
              <p>1. Configurez vos clés dans .env.local</p>
              <p>2. Suivez le guide PAYMENT_SETUP_GUIDE.md</p>
            </div>
          </div>
        ) : (
          <div id="paypal-button-container" className="w-full"></div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            En utilisant PayPal, vous acceptez leurs{' '}
            <a href="https://www.paypal.com/fr/webapps/mpp/ua/legalhub-full" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-blue-500 hover:underline">
              conditions d'utilisation
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PayPalPayment; 