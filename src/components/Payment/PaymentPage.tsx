import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  ArrowLeft,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { addFundsToBalance, getUserBalance } from '../../lib/supabase';
import { getCurrentUser } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface PaymentPageState {
  requiredAmount?: number;
  returnTo?: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentPageState;
  
  const [amount, setAmount] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState<'bank_transfer' | 'paypal' | 'stripe' | 'manual'>('bank_transfer');
  const [currentBalance, setCurrentBalance] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/paiement', 'Paiement | Back.ma');
    loadUserBalance();
  }, []);

  const loadUserBalance = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const balance = await getUserBalance(user.id);
      setCurrentBalance(balance);

      // Si un montant requis est spécifié, le pré-remplir
      if (state?.requiredAmount) {
        setAmount(state.requiredAmount.toString());
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
      toast.error('Erreur lors du chargement du solde');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    try {
      setProcessing(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

      await addFundsToBalance(user.id, parseFloat(amount), paymentMethod);
      
      toast.success('Paiement traité avec succès !');
      
      // Rediriger vers la page précédente ou le panier
      if (state?.returnTo) {
        navigate(state.returnTo);
      } else {
        navigate('/dashboard/balance');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Erreur lors du traitement du paiement');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return {
          title: 'Virement bancaire',
          description: 'Effectuez un virement vers notre compte bancaire',
          details: 'RIB: MA123 4567 8901 2345 6789 0123\nBanque: Bank Al-Maghrib\nBIC: BAMAMAMC'
        };
      case 'paypal':
        return {
          title: 'PayPal',
          description: 'Paiement sécurisé via PayPal',
          details: 'Email: paiement@back.ma'
        };
      case 'stripe':
        return {
          title: 'Carte bancaire',
          description: 'Paiement sécurisé par carte bancaire',
          details: 'Visa, Mastercard, American Express acceptées'
        };
      case 'manual':
        return {
          title: 'Paiement manuel',
          description: 'Contactez-nous pour un paiement manuel',
          details: 'Email: contact@back.ma\nTéléphone: +212 5 22 12 34 56'
        };
      default:
        return { title: '', description: '', details: '' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const paymentInfo = getPaymentMethodInfo(paymentMethod);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Recharger votre compte</h1>
          <p className="text-gray-600 mt-1">
            Ajoutez des fonds à votre compte pour acheter des liens
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de paiement */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de paiement</h2>
              
              {/* Solde actuel */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Solde actuel</span>
                  <span className="font-semibold text-gray-900">{currentBalance.toLocaleString()} MAD</span>
                </div>
              </div>

              {/* Montant */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à ajouter (MAD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                {state?.requiredAmount && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Montant recommandé: {state.requiredAmount.toLocaleString()} MAD
                  </p>
                )}
              </div>

              {/* Méthode de paiement */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Carte bancaire</option>
                  <option value="manual">Paiement manuel</option>
                </select>
              </div>

              {/* Bouton de paiement */}
              <button
                onClick={handlePayment}
                disabled={processing || !amount || parseFloat(amount) <= 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Confirmer le paiement</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Informations de paiement */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{paymentInfo.title}</h3>
              <p className="text-gray-600 mb-4">{paymentInfo.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-line">{paymentInfo.details}</pre>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations importantes</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paiement sécurisé</p>
                    <p className="text-xs text-gray-600">Toutes les transactions sont sécurisées et cryptées</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Crédit immédiat</p>
                    <p className="text-xs text-gray-600">Votre compte est crédité immédiatement après validation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Aucune commission</p>
                    <p className="text-xs text-gray-600">Aucune commission sur les rechargements</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {state?.requiredAmount && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Solde insuffisant</p>
                    <p className="text-xs text-yellow-700">
                      Pour finaliser votre commande, vous devez ajouter au moins {state.requiredAmount.toLocaleString()} MAD à votre compte.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 