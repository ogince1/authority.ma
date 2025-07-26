import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, CheckCircle, AlertCircle, UserPlus, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  syncUsers, 
  checkSyncStatus, 
  createUserWithProfile, 
  getUserStats,
  updateUserRole 
} from '../utils/fixUserSync';
import { UserRole } from '../types';

interface SyncStatus {
  inSync: boolean;
  authUsers: number;
  publicUsers: number;
  missingProfiles: number;
  details: string[];
}

interface UserStats {
  total: number;
  entrepreneurs: number;
  investors: number;
  withoutEmail: number;
}

const AdminUserSyncPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'entrepreneur' as UserRole
  });

  // Vérifier le statut au chargement
  useEffect(() => {
    checkStatus();
    loadUserStats();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await checkSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      toast.error('Erreur lors de la vérification du statut');
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncUsers();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
      // Recharger le statut après la synchronisation
      await checkStatus();
      await loadUserStats();
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithProfile(
        newUser.email,
        newUser.password,
        newUser.name,
        newUser.role
      );

      if (result.success) {
        toast.success(result.message);
        setNewUser({ email: '', password: '', name: '', role: 'entrepreneur' });
        setShowCreateUser(false);
        await checkStatus();
        await loadUserStats();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration - Synchronisation Utilisateurs
          </h1>
          <p className="text-gray-600">
            Gérez la synchronisation entre auth.users et public.users
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Sync Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">État de Synchronisation</h3>
              {syncStatus?.inSync ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            
            {syncStatus && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilisateurs Auth:</span>
                  <span className="font-semibold">{syncStatus.authUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilisateurs Publics:</span>
                  <span className="font-semibold">{syncStatus.publicUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profils Manquants:</span>
                  <span className={`font-semibold ${syncStatus.missingProfiles > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {syncStatus.missingProfiles}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className={`text-sm font-medium ${syncStatus.inSync ? 'text-green-600' : 'text-red-600'}`}>
                    {syncStatus.inSync ? '✅ Synchronisé' : '❌ Non synchronisé'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* User Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            
            {userStats && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{userStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrepreneurs:</span>
                  <span className="font-semibold text-blue-600">{userStats.entrepreneurs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investisseurs:</span>
                  <span className="font-semibold text-green-600">{userStats.investors}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Sans Email:</span>
                  <span className={`font-semibold ${userStats.withoutEmail > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {userStats.withoutEmail}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleSync}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Synchronisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synchroniser
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowCreateUser(true)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel Utilisateur
              </button>
              
              <button
                onClick={() => { checkStatus(); loadUserStats(); }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </button>
            </div>
          </motion.div>
        </div>

        {/* Missing Profiles Details */}
        {syncStatus && syncStatus.missingProfiles > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profils Manquants ({syncStatus.missingProfiles})
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium mb-2">
                Les utilisateurs suivants existent dans auth.users mais pas dans public.users :
              </p>
              <ul className="text-red-600 space-y-1">
                {syncStatus.details.map((email, index) => (
                  <li key={index} className="text-sm">• {email}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Créer un Nouvel Utilisateur
              </h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="entrepreneur">Entrepreneur</option>
                    <option value="investor">Investisseur</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserSyncPage;