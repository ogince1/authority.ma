import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getUserBalance,
  createCreditTransaction,
  getCreditTransactions
} from '../../lib/supabase';
import { CreditTransaction } from '../../types';

interface PaymentProcessorProps {
  amount: number;
  description: string;
  onSuccess?: (transaction: CreditTransaction) => void;
  onError?: (error: string) => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  description,
  onSuccess,
  onError
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'bank_transfer' | 'paypal' | 'stripe'>('balance');
  const [paymentDetails, setPaymentDetails] = useState({
    bankAccount: '',
    paypalEmail: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }

        setUser(currentUser);
        const balance = await getUserBalance(currentUser.id);
        setUserBalance(balance);
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        onError?.('Erreur lors du chargement des données utilisateur');
      }
    };

    loadUserData();
  }, [navigate, onError]);

  const handlePayment = async () => {
    if (!user) {
      onError?.('Utilisateur non connecté');
      return;
    }

    setLoading(true);

    try {
      let transactionData: any = {
        user_id: user.id,
        type: 'deposit' as const,
        amount: amount,
        description: description,
        payment_method: paymentMethod
      };

      // Ajouter les détails spécifiques selon la méthode de paiement
      switch (paymentMethod) {
        case 'bank_transfer':
          if (!paymentDetails.bankAccount) {
            throw new Error('Numéro de compte bancaire requis');
          }
          transactionData.payment_reference = paymentDetails.bankAccount;
          break;
        case 'paypal':
          if (!paymentDetails.paypalEmail) {
            throw new Error('Email PayPal requis');
          }
          transactionData.payment_reference = paymentDetails.paypalEmail;
          break;
        case 'stripe':
          if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
            throw new Error('Informations de carte requises');
          }
          transactionData.payment_reference = `****${paymentDetails.cardNumber.slice(-4)}`;
          break;
      }

      // Créer la transaction
      const transaction = await createCreditTransaction(transactionData);
      
      // Mettre à jour le solde local
      const newBalance = await getUserBalance(user.id);
      setUserBalance(newBalance);

      onSuccess?.(transaction);
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      onError?.(error instanceof Error ? error.message : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const canPayWithBalance = userBalance >= amount;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Paiement</h2>

        {/* Résumé du paiement */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Montant à payer:</span>
            <span className="text-2xl font-bold text-green-600">{amount} MAD</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">Description:</span>
            <span className="text-gray-900">{description}</span>
          </div>
        </div>

        {/* Solde actuel */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Solde actuel:</span>
            <span className="text-lg font-medium text-blue-600">{userBalance} MAD</span>
          </div>
          {!canPayWithBalance && (
            <p className="text-sm text-red-600 mt-2">
              Solde insuffisant. Veuillez recharger votre compte.
            </p>
          )}
        </div>

        {/* Méthodes de paiement */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900">Méthode de paiement</h3>

          {/* Paiement par solde */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="balance"
                checked={paymentMethod === 'balance'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="mr-3"
                disabled={!canPayWithBalance}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Solde du compte</span>
                  <span className="text-sm text-gray-600">{userBalance} MAD</span>
                </div>
                {!canPayWithBalance && (
                  <p className="text-sm text-red-600">Solde insuffisant</p>
                )}
              </div>
            </label>
          </div>

          {/* Virement bancaire */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-medium">Virement bancaire</span>
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Numéro de compte bancaire"
                      value={paymentDetails.bankAccount}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankAccount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Le virement sera traité dans les 24-48h
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* PayPal */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-medium">PayPal</span>
                {paymentMethod === 'paypal' && (
                  <div className="mt-2">
                    <input
                      type="email"
                      placeholder="Email PayPal"
                      value={paymentDetails.paypalEmail}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, paypalEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Carte bancaire */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-medium">Carte bancaire</span>
                {paymentMethod === 'stripe' && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Numéro de carte"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-md hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || (paymentMethod === 'balance' && !canPayWithBalance)}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Traitement...' : 'Payer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessor;
