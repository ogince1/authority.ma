import React from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  CreditCard,
  Wallet,
  Download,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'refund' | 'commission';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  reference?: string;
  payment_method?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  related_transaction?: {
    id: string;
    amount: number;
    type: string;
  };
}

const TransactionsManagement: React.FC = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    trackPageView('/admin/transactions', 'Gestion Transactions | Back.ma');
    loadTransactions();
    loadStats();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const { data: transactionsData, error } = await supabase
        .from('credit_transactions')
        .select(`
          *,
          user:users(
            id,
            name,
            email
          ),
          related_transaction:credit_transactions(
            id,
            amount,
            type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculer les statistiques
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('type, amount, status, created_at');

      if (transactionsData) {
        const totalRevenue = transactionsData
          .filter(t => t.type === 'credit' && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalRefunds = transactionsData
          .filter(t => t.type === 'refund' && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalCommissions = transactionsData
          .filter(t => t.type === 'commission' && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const pendingTransactions = transactionsData
          .filter(t => t.status === 'pending').length;

        const todayRevenue = transactionsData
          .filter(t => t.type === 'credit' && t.status === 'completed' && 
            new Date(t.created_at).toDateString() === new Date().toDateString())
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        setStats({
          total_revenue: totalRevenue,
          total_refunds: totalRefunds,
          total_commissions: totalCommissions,
          pending_transactions: pendingTransactions,
          today_revenue: todayRevenue,
          total_transactions: transactionsData.length
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const handleStatusChange = async (transactionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('credit_transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success(`Statut de la transaction mis à jour`);
      loadTransactions();
      loadStats();
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'Utilisateur', 'Type', 'Montant', 'Statut', 'Description', 'Date'],
      ...filteredTransactions.map(transaction => [
        transaction.id,
        transaction.user?.name || 'N/A',
        transaction.type,
        transaction.amount.toString(),
        transaction.status,
        transaction.description,
        new Date(transaction.created_at).toLocaleDateString('fr-FR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export des transactions terminé');
  };

  const getTypeBadge = (type: string) => {
    const config = {
      credit: { color: 'bg-green-100 text-green-800', text: 'Crédit', icon: TrendingUp },
      debit: { color: 'bg-red-100 text-red-800', text: 'Débit', icon: TrendingDown },
      refund: { color: 'bg-blue-100 text-blue-800', text: 'Remboursement', icon: TrendingUp },
      commission: { color: 'bg-purple-100 text-purple-800', text: 'Commission', icon: DollarSign }
    };

    const configItem = config[type as keyof typeof config] || config.credit;
    const Icon = configItem.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {configItem.text}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', text: 'Terminée', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', text: 'Échouée', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Annulée', icon: XCircle }
    };

    const configItem = config[status as keyof typeof config] || config.pending;
    const Icon = configItem.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {configItem.text}
      </span>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Transactions</h1>
            <p className="text-gray-600 mt-1">
              Suivez et gérez toutes les transactions financières
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportTransactions}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-green-900">Revenus Totaux</div>
                  <div className="text-lg font-bold text-green-900">{stats.total_revenue.toLocaleString()} MAD</div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Aujourd'hui</div>
                  <div className="text-lg font-bold text-blue-900">{stats.today_revenue.toLocaleString()} MAD</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-red-900">Remboursements</div>
                  <div className="text-lg font-bold text-red-900">{stats.total_refunds.toLocaleString()} MAD</div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-purple-900">Commissions</div>
                  <div className="text-lg font-bold text-purple-900">{stats.total_commissions.toLocaleString()} MAD</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="credit">Crédits</option>
              <option value="debit">Débits</option>
              <option value="refund">Remboursements</option>
              <option value="commission">Commissions</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="completed">Terminées</option>
              <option value="failed">Échouées</option>
              <option value="cancelled">Annulées</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {transaction.id.slice(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {transaction.user?.name?.charAt(0).toUpperCase() || transaction.user?.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.user?.name || 'Utilisateur'}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(transaction.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      transaction.type === 'credit' || transaction.type === 'refund' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' || transaction.type === 'refund' ? '+' : '-'}
                      {transaction.amount.toLocaleString()} MAD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {transaction.status === 'pending' && (
                        <select
                          value={transaction.status}
                          onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">En attente</option>
                          <option value="completed">Terminée</option>
                          <option value="failed">Échouée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {transactions.length === 0 ? 'Aucune transaction' : 'Aucune transaction trouvée'}
            </h3>
            <p className="text-gray-500">
              {transactions.length === 0 
                ? 'Aucune transaction n\'a été effectuée sur la plateforme.'
                : 'Aucune transaction ne correspond à vos critères de recherche.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails transaction */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Détails de la transaction
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Utilisateur</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.user?.name}</p>
                  <p className="text-xs text-gray-500">{selectedTransaction.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant</label>
                  <p className="text-sm font-bold text-gray-900">{selectedTransaction.amount.toLocaleString()} MAD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de création</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                {selectedTransaction.reference && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Référence</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.reference}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsManagement; 