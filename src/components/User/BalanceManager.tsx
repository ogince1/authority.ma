import React from 'react';
import { 
  Wallet, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Upload,
  Receipt,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CreditTransaction } from '../../types';
import { 
  getUserBalance, 
  getCreditTransactions, 
  addFundsToBalance,
  supabase
} from '../../lib/supabase';
import { getCurrentUser } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';
import PayPalPayment from '../Payment/PayPalPayment';
import StripePayment from '../Payment/StripePayment';

interface BalanceRequest {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw_funds';
  amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

const BalanceManager: React.FC = () => {
  const [balance, setBalance] = React.useState<number>(0);
  const [transactions, setTransactions] = React.useState<CreditTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddFunds, setShowAddFunds] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'paypal' | 'stripe' | 'bank_transfer'>('paypal');
  const [amount, setAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'bank_transfer' | 'paypal' | 'stripe'>('bank_transfer');
  const [description, setDescription] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [userRole, setUserRole] = React.useState<string>('');
  const [publisherPaymentInfo, setPublisherPaymentInfo] = React.useState<any>(null);
  
  // ✅ Nouvel état pour les onglets
  const [activeTab, setActiveTab] = React.useState<'transactions' | 'requests'>('transactions');
  const [paymentRequests, setPaymentRequests] = React.useState<BalanceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/dashboard/balance', 'Gestion du Solde | Back.ma');
    fetchBalanceAndTransactions();
    
    // ✅ Si ?success=true dans l'URL, basculer sur l'onglet requests
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setActiveTab('requests');
      fetchPaymentRequests();
    }
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

  const fetchPaymentRequests = async () => {
    try {
      setRequestsLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('balance_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRequests(data || []);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchBalanceAndTransactions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Récupérer aussi le profil pour connaître le rôle
      const { getCurrentUserProfile } = await import('../../lib/supabase');
      const [userBalance, userTransactions, userProfile] = await Promise.all([
        getUserBalance(user.id),
        getCreditTransactions(user.id),
        getCurrentUserProfile()
      ]);

      setBalance(userBalance);
      setTransactions(userTransactions);
      setUserRole(userProfile?.role || '');
      
      // Charger les informations de paiement pour les éditeurs
      if (userProfile?.role === 'publisher') {
        try {
          const { data: paymentInfo, error: paymentError } = await supabase.rpc('get_publisher_payment_info');
          if (!paymentError && paymentInfo && paymentInfo.length > 0) {
            setPublisherPaymentInfo(paymentInfo[0]);
            // Définir la méthode préférée comme méthode par défaut
            setPaymentMethod(paymentInfo[0].preferred_withdrawal_method || 'bank_transfer');
          }
        } catch (error) {
          console.error('Error loading payment info:', error);
        }
      }
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

    // Pour PayPal, ouvrir le modal de paiement
    if (paymentMethod === 'paypal') {
      console.log('🔍 Debug - Ouverture du modal de paiement pour:', paymentMethod);
      setSelectedPaymentMethod(paymentMethod);
      setShowPaymentModal(true);
      console.log('🔍 Debug - showPaymentModal mis à true');
      return;
    }

    // Empêcher le paiement par carte bancaire
    if (paymentMethod === 'stripe') {
      toast.error('Le paiement par carte bancaire est temporairement indisponible. Veuillez choisir une autre méthode.');
      return;
    }

    // Pour virement bancaire, créer une demande pour l'admin
    if (paymentMethod === 'bank_transfer') {
      try {
        setLoading(true);
        const { data: result, error } = await supabase.rpc('request_add_funds', {
          p_amount: parseFloat(amount),
          p_payment_method: paymentMethod,
          p_description: description || 'Demande d\'ajout de fonds par virement bancaire',
          p_payment_reference: description // Utiliser la description comme référence
        });

        if (error) {
          console.error('Error creating add funds request:', error);
          toast.error('Erreur lors de la création de la demande');
          return;
        }

        if (result && result.success) {
          toast.success('Demande envoyée à l\'administrateur pour validation !');
          setShowAddFunds(false);
          setAmount('');
          setDescription('');
          
          // ✅ Basculer sur l'onglet demandes et recharger
          setActiveTab('requests');
          await fetchPaymentRequests();
        } else {
          toast.error(result?.message || 'Erreur lors de la création de la demande');
        }
      } catch (error) {
        console.error('Error creating add funds request:', error);
        toast.error('Erreur lors de la création de la demande');
      } finally {
        setLoading(false);
      }
    } else {
      // Pour les autres méthodes non supportées
      toast.error('Méthode de paiement non supportée pour les demandes manuelles');
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

      // Créer une demande de retrait pour l'admin
        const { data: result, error } = await supabase.rpc('request_withdraw_funds', {
          p_amount: parseFloat(amount),
          p_payment_method: paymentMethod,
          p_description: description || 'Demande de retrait de revenus'
        });

      if (error) {
        console.error('Error creating withdraw request:', error);
        toast.error('Erreur lors de la création de la demande');
        return;
      }

      if (result && result.success) {
        toast.success('Demande de retrait envoyée à l\'administrateur !');
        setShowWithdraw(false);
        setAmount('');
        setDescription('');
      } else {
        toast.error(result?.message || 'Erreur lors de la création de la demande');
      }
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
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
      case 'commission':
        return 'text-green-600';
      case 'withdrawal':
      case 'purchase':
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
      case 'platform':
        return 'Frais de plateforme';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gestion du Solde
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez votre solde et consultez vos transactions
              </p>
            </div>
          </div>
        </motion.div>

        {/* ✅ Onglets Transactions / Demandes de paiement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'transactions'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Transactions</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('requests');
                  if (paymentRequests.length === 0) {
                    fetchPaymentRequests();
                  }
                }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'requests'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Receipt className="h-4 w-4" />
                <span>Demandes de Paiement</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Solde actuel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Solde actuel</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {balance.toLocaleString()} MAD
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {balance > 0 ? 'Fonds disponibles' : 'Solde insuffisant'}
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* ✅ Contenu selon l'onglet actif */}
        {activeTab === 'transactions' ? (
          <>
        {/* Actions selon le rôle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`grid gap-6 ${userRole === 'publisher' || userRole === 'advertiser' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} mb-8`}
        >
          {/* Annonceurs : Seulement ajouter des fonds */}
          {userRole === 'advertiser' && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ajouter des fonds</h3>
                <p className="text-gray-600 text-sm mb-4">Rechargez votre compte pour effectuer des achats</p>
                <button
                  onClick={() => setShowAddFunds(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  <span>Ajouter des fonds</span>
                </button>
              </div>
            </div>
          )}
        
          {/* Éditeurs : Seulement retirer des fonds */}
          {userRole === 'publisher' && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Minus className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Retirer mes revenus</h3>
                <p className="text-gray-600 text-sm mb-4">Retirez vos gains de la plateforme</p>
                <button
                  onClick={() => setShowWithdraw(true)}
                  disabled={balance <= 0}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Minus className="h-5 w-5" />
                  <span>Retirer mes revenus</span>
                </button>
              </div>
            </div>
          )}
        
          {/* Admin ou rôle non défini : Les deux boutons */}
          {(!userRole || (userRole !== 'advertiser' && userRole !== 'publisher')) && (
            <>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ajouter des fonds</h3>
                  <p className="text-gray-600 text-sm mb-4">Rechargez votre compte</p>
                  <button
                    onClick={() => setShowAddFunds(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Ajouter des fonds</span>
                  </button>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Minus className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Retirer des fonds</h3>
                  <p className="text-gray-600 text-sm mb-4">Retirez des fonds de votre compte</p>
                  <button
                    onClick={() => setShowWithdraw(true)}
                    disabled={balance <= 0}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Minus className="h-5 w-5" />
                    <span>Retirer des fonds</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Historique des transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
        >
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Historique des transactions</h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
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
                      {transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'commission' ? '+' : '-'}
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
        </motion.div>

      {/* Modal Ajouter des fonds - Seulement pour annonceurs */}
      {showAddFunds && (userRole === 'advertiser' || !userRole || (userRole !== 'advertiser' && userRole !== 'publisher')) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter des fonds</h3>
            
            {/* Information sur la commission */}
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-orange-600 mt-0.5">💡</div>
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Commission de dépôt</p>
                  <p className="mb-2">Une commission de <strong>5%</strong> sera déduite automatiquement de votre dépôt.</p>
                  <div className="text-xs text-orange-700">
                    <p>• <strong>Exemple :</strong> Dépôt de 1000 MAD → 950 MAD crédités</p>
                    <p>• Commission perçue par la plateforme : 50 MAD</p>
                  </div>
                </div>
              </div>
            </div>
            
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
                
                {/* Calcul en temps réel */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Montant déposé :</span>
                        <span className="font-medium">{parseFloat(amount).toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission (5%) :</span>
                        <span className="font-medium text-orange-600">-{(parseFloat(amount) * 0.05).toFixed(2)} MAD</span>
                      </div>
                      <div className="border-t border-gray-300 pt-1 flex justify-between font-semibold">
                        <span>Montant crédité :</span>
                        <span className="text-green-600">{(parseFloat(amount) * 0.95).toFixed(2)} MAD</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const selectedMethod = e.target.value as any;
                    // Empêcher la sélection de Stripe (carte bancaire)
                    if (selectedMethod === 'stripe') {
                      toast.error('Le paiement par carte bancaire est temporairement indisponible');
                      return;
                    }
                    setPaymentMethod(selectedMethod);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe" disabled>Carte bancaire (Temporairement indisponible)</option>
                </select>
                
                {/* Note d'information sur les méthodes de paiement */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 mt-0.5">💳</div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Options de paiement disponibles</p>
                      <p>• <strong>PayPal :</strong> Vous pouvez payer avec votre compte PayPal ou directement avec votre carte bancaire</p>
                      <p>• <strong>Virement bancaire :</strong> Paiement sécurisé par virement (traitement manuel)</p>
                    </div>
                  </div>
                </div>
                
                {/* Informations PayPal */}
                {paymentMethod === 'paypal' && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="text-green-600 mt-0.5">💳</div>
                      <div className="text-sm text-green-800">
                        <p className="font-medium">Paiement via PayPal</p>
                        <p>Vous serez redirigé vers PayPal où vous pourrez choisir de payer avec :</p>
                        <ul className="mt-2 ml-4 list-disc">
                          <li>Votre compte PayPal</li>
                          <li>Votre carte bancaire (Visa, Mastercard, etc.)</li>
                          <li>Votre compte bancaire</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations bancaires pour virement */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="text-blue-600 mt-0.5">🏦</div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Informations bancaires pour le virement :</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Banque :</span>
                        <span className="text-gray-900">CIH Banque</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Titulaire :</span>
                        <span className="text-gray-900">Back SAS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">RIB :</span>
                        <span className="text-gray-900 font-mono">230 130 7416451211028900 48</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">IBAN :</span>
                        <span className="text-gray-900 font-mono">MA64 2301 3074 1645 1211 0289 0048</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Code SWIFT :</span>
                        <span className="text-gray-900 font-mono">CIHMMAMC</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <p className="font-medium">Important :</p>
                      <p>• Effectuez le virement avec le montant exact</p>
                      <p>• Mentionnez votre email dans la référence du virement</p>
                      <p>• La validation peut prendre 24-48h après réception</p>
                    </div>
                  </div>
                )}
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

      {/* Modal Retirer des fonds - Seulement pour éditeurs */}
      {showWithdraw && (userRole === 'publisher' || !userRole || (userRole !== 'advertiser' && userRole !== 'publisher')) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {userRole === 'publisher' ? 'Retirer mes revenus' : 'Retirer des fonds'}
            </h3>
            
            {userRole === 'publisher' && (
              <div className="space-y-3">
                
                {/* Informations de paiement manquantes */}
                {(!publisherPaymentInfo?.bank_account_info?.iban && !publisherPaymentInfo?.paypal_email) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="text-blue-600 mt-0.5">💡</div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Configurez vos informations de paiement</p>
                        <p>Pour faciliter vos retraits, ajoutez vos informations bancaires et PayPal dans votre profil.</p>
                        <button
                          onClick={() => window.location.href = '/dashboard/profile'}
                          className="mt-2 text-blue-600 hover:text-blue-800 underline text-xs"
                        >
                          Aller aux paramètres de paiement →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
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
                
                {/* Calculateur pour les éditeurs */}
                {userRole === 'publisher' && amount && parseFloat(amount) > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span>Montant demandé:</span>
                      <span className="font-medium">{parseFloat(amount).toLocaleString()} MAD</span>
                    </div>
                  </div>
                )}
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

          </>
        ) : (
          /* ✅ Onglet Demandes de Paiement */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Bannière de confirmation */}
            {new URLSearchParams(window.location.search).get('success') === 'true' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      ✅ Demande d'ajout de solde créée avec succès!
                    </h3>
                    <p className="text-green-700 mb-3">
                      Votre demande a été envoyée à l'administration pour validation.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-gray-900 mb-2">Prochaines étapes:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        <li>Notre équipe vérifie votre demande (généralement sous 24h)</li>
                        <li>Vous recevrez une notification par email</li>
                        <li>Le solde sera ajouté à votre compte après validation</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des demandes */}
            {requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : paymentRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune demande de paiement
                </h3>
                <p className="text-gray-500">
                  Vous n'avez pas encore fait de demande d'ajout de solde ou de retrait
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.type === 'deposit' ? '📥 Ajout de solde' : '💰 Demande de retrait'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(request.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {request.status === 'pending' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </span>
                      )}
                      {request.status === 'completed' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complétée
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejetée
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Montant</p>
                        <p className="text-xl font-bold text-gray-900">
                          {request.amount.toLocaleString()} MAD
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Méthode</p>
                        <p className="text-sm font-medium text-gray-900">
                          {request.payment_method === 'bank_transfer' ? 'Virement bancaire' :
                           request.payment_method === 'paypal' ? 'PayPal' : 'Carte'}
                        </p>
                      </div>
                    </div>

                    {request.description && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{request.description}</p>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="mt-4 bg-yellow-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">Note admin:</p>
                        <p className="text-sm text-gray-700">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
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
    </div>
  );
};

export default BalanceManager;