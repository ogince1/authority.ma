import React from 'react';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Shield,
  ShieldOff,
  Mail,
  Calendar,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Download,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  balance?: number;
  status: 'active' | 'suspended' | 'pending';
  total_transactions?: number;
  total_websites?: number;
  total_listings?: number;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [showUserModal, setShowUserModal] = React.useState(false);

  React.useEffect(() => {
    trackPageView('/admin/users', 'Gestion Utilisateurs | Back.ma');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Récupérer tous les utilisateurs avec leurs statistiques
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          credit_transactions(count),
          websites(count),
          link_listings(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformer les données
      const transformedUsers = usersData?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        balance: user.balance || 0,
        status: user.status || 'active',
        total_transactions: user.credit_transactions?.[0]?.count || 0,
        total_websites: user.websites?.[0]?.count || 0,
        total_listings: user.link_listings?.[0]?.count || 0
      })) || [];

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Statut de l'utilisateur mis à jour`);
      loadUsers(); // Recharger les données
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Rôle de l'utilisateur mis à jour`);
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Nom', 'Email', 'Rôle', 'Statut', 'Solde', 'Date création', 'Dernière connexion'],
      ...filteredUsers.map(user => [
        user.name || 'N/A',
        user.email,
        user.role || 'Utilisateur',
        user.status,
        user.balance?.toString() || '0',
        new Date(user.created_at).toLocaleDateString('fr-FR'),
        user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export des utilisateurs terminé');
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', text: 'Actif', icon: CheckCircle },
      suspended: { color: 'bg-red-100 text-red-800', text: 'Suspendu', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: AlertTriangle }
    };

    const configItem = config[status as keyof typeof config] || config.active;
    const Icon = configItem.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {configItem.text}
      </span>
    );
  };

  const getRoleBadge = (role?: string) => {
    const config = {
      admin: { color: 'bg-purple-100 text-purple-800', text: 'Admin' },
      publisher: { color: 'bg-blue-100 text-blue-800', text: 'Éditeur' },
      advertiser: { color: 'bg-green-100 text-green-800', text: 'Annonceur' }
    };

    const configItem = config[role as keyof typeof config] || { color: 'bg-gray-100 text-gray-800', text: 'Utilisateur' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.color}`}>
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-1">
              Gérez tous les utilisateurs de la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportUsers}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
            <button
              onClick={() => setShowUserModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter Utilisateur
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-blue-900">Total Utilisateurs</div>
                <div className="text-lg font-bold text-blue-900">{users.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-green-900">Actifs</div>
                <div className="text-lg font-bold text-green-900">
                  {users.filter(u => u.status === 'active').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-yellow-900">En attente</div>
                <div className="text-lg font-bold text-yellow-900">
                  {users.filter(u => u.status === 'pending').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-red-900">Suspendus</div>
                <div className="text-lg font-bold text-red-900">
                  {users.filter(u => u.status === 'suspended').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendus</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Admins</option>
              <option value="publisher">Éditeurs</option>
              <option value="advertiser">Annonceurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activité
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
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Nom non défini'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.balance?.toLocaleString()} MAD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-4">
                        <span title="Transactions">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          {user.total_transactions}
                        </span>
                        <span title="Sites web">
                          <Activity className="w-4 h-4 inline mr-1" />
                          {user.total_websites}
                        </span>
                        <span title="Annonces">
                          <FileText className="w-4 h-4 inline mr-1" />
                          {user.total_listings}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                      {user.last_sign_in_at && (
                        <div className="text-xs text-gray-400">
                          Dernière connexion: {new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="active">Actif</option>
                        <option value="suspended">Suspendu</option>
                        <option value="pending">En attente</option>
                      </select>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Admin</option>
                        <option value="publisher">Éditeur</option>
                        <option value="advertiser">Annonceur</option>
                      </select>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {users.length === 0 ? 'Aucun utilisateur' : 'Aucun utilisateur trouvé'}
            </h3>
            <p className="text-gray-500">
              {users.length === 0 
                ? 'Aucun utilisateur n\'est encore inscrit sur la plateforme.'
                : 'Aucun utilisateur ne correspond à vos critères de recherche.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails utilisateur */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Détails de l'utilisateur
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <p className="text-sm text-gray-900">{selectedUser.name || 'Non défini'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rôle</label>
                  <p className="text-sm text-gray-900">{selectedUser.role || 'Utilisateur'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{selectedUser.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Solde</label>
                  <p className="text-sm text-gray-900">{selectedUser.balance?.toLocaleString()} MAD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'inscription</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
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

export default UsersManagement; 