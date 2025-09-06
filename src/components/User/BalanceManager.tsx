import React from 'react';
import { 
  Wallet, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CreditTransaction } from '../../types';
import { 
  getUserBalance, 
  getCreditTransactions, 
  addFundsToBalance, 
  withdrawFunds 
} from '../../lib/supabase';
import { getCurrentUser } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';
import PayPalPayment from '../Payment/PayPalPayment';
import StripePayment from '../Payment/StripePayment';

const BalanceManager: React.FC = () => {
  const [balance, setBalance] = React.useState<number>(0);
  const [transactions, setTransactions] = React.useState<CreditTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddFunds, setShowAddFunds] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'paypal' | 'stripe' | 'bank_transfer' | 'manual'>('paypal');
  const [amount, setAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'bank_transfer' | 'paypal' | 'stripe' | 'manual'>('bank_transfer');
  const [description, setDescription] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');

  React.useEffect(() => {
    trackPageView('/dashboard/balance', 'Gestion du Solde | Back.ma');
    fetchBalanceAndTransactions();
  }, []);

  // Debug: Surveiller l'état du modal
  React.useEffect(() => {
    console.log('🔍 Debug - État du modal de paiement:', {
      showPaymentModal,
      selectedPaymentMethod,
      amount,
      showAddFunds
    });
  }, [showPaymentModal, selectedPaymentMethod, amount, showAddFunds]);

  // Debug: Surveiller les changements d'état
  React.useEffect(() => {
    console.log('🔍 Debug - État général:', {
      loading,
      balance,
      paymentMethod,
      showAddFunds,
      showWithdraw,
      showPaymentModal
    });
  }, [loading, balance, paymentMethod, showAddFunds, showWithdraw, showPaymentModal]);

  const fetchBalanceAndTransactions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [userBalance, userTransactions] = await Promise.all([
        getUserBalance(user.id),
        getCreditTransactions(user.id)
      ]);

      setBalance(userBalance);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error fetching balance and transactions:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    console.log('🔍 Debug - Méthode de paiement sélectionnée:', paymentMethod);
    console.log('🔍 Debug - Montant:', amount);

    // Pour PayPal et Stripe, ouvrir le modal de paiement
    if (paymentMethod === 'paypal' || paymentMethod === 'stripe') {
      console.log('🔍 Debug - Ouverture du modal de paiement pour:', paymentMethod);
      setSelectedPaymentMethod(paymentMethod);
      setShowPaymentModal(true);
      console.log('🔍 Debug - showPaymentModal mis à true');
      return;
    }

    // Pour les autres méthodes (virement bancaire, manuel)
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

      await addFundsToBalance(user.id, parseFloat(amount), paymentMethod);
      
      toast.success('Fonds ajoutés avec succès');
      setShowAddFunds(false);
      setAmount('');
      fetchBalanceAndTransactions();
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Erreur lors de l\'ajout des fonds');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, paidAmount: number) => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

      await addFundsToBalance(user.id, paidAmount, selectedPaymentMethod, paymentId);
      
      toast.success('Paiement traité avec succès !');
      setShowPaymentModal(false);
      setShowAddFunds(false);
      setAmount('');
      fetchBalanceAndTransactions();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Erreur lors du traitement du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setShowPaymentModal(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    if (parseFloat(amount) > balance) {
      toast.error('Montant supérieur au solde disponible');
      return;
    }

    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

      await withdrawFunds(user.id, parseFloat(amount), description || 'Retrait de fonds');
      
      toast.success('Retrait traité avec succès');
      setShowWithdraw(false);
      setAmount('');
      setDescription('');
      fetchBalanceAndTransactions();
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error('Erreur lors du retrait');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <Upload className="h-4 w-4 text-green-600" />;
      case 'commission':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'purchase':
      case 'commission':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'purchase':
        return 'Achat';
      case 'refund':
        return 'Remboursement';
      case 'commission':
        return 'Commission';
      default:
        return type;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Virement bancaire';
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Carte bancaire';
      case 'manual':
        return 'Manuel';
      default:
        return 'Non spécifié';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === 'all') return true;
    return transaction.type === filterType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Solde</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre solde et consultez vos transactions
          </p>
        </div>
      </div>

      {/* Solde actuel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Solde actuel</p>
            <p className="text-3xl font-bold">{balance.toLocaleString()} MAD</p>
            <p className="text-blue-100 text-sm mt-1">
              {balance > 0 ? 'Fonds disponibles' : 'Solde insuffisant'}
            </p>
          </div>
          <Wallet className="h-12 w-12 text-blue-200" />
        </div>
      </motion.div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowAddFunds(true)}
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter des fonds</span>
        </button>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={balance <= 0}
          className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="h-5 w-5" />
          <span>Retirer des fonds</span>
        </button>
      </div>

      {/* Historique des transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Historique des transactions</h2>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                <option value="deposit">Dépôts</option>
                <option value="withdrawal">Retraits</option>
                <option value="purchase">Achats</option>
                <option value="refund">Remboursements</option>
                <option value="commission">Commissions</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune transaction trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {getTransactionLabel(transaction.type)} • {getPaymentMethodLabel(transaction.payment_method)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                      {transaction.amount.toLocaleString()} MAD
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajouter des fonds */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter des fonds</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (MAD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Carte bancaire</option>
                  <option value="manual">Manuel</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddFunds(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddFunds}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Traitement...' : 'Ajouter'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Retirer des fonds */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retirer des fonds</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (MAD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  max={balance}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solde disponible: {balance.toLocaleString()} MAD
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Raison du retrait"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowWithdraw(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Traitement...' : 'Retirer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de paiement PayPal/Stripe */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Paiement sécurisé
                </h3>
                <button
                  onClick={handlePaymentCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedPaymentMethod === 'paypal' && (
                <PayPalPayment
                  amount={parseFloat(amount)}
                  currency="MAD"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              )}

              {selectedPaymentMethod === 'stripe' && (
                <StripePayment
                  amount={parseFloat(amount)}
                  currency="MAD"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BalanceManager;