import React from 'react';
import {
  Globe,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  User,
  Calendar,
  BarChart3,
  Download,
  Shield,
  Settings,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { trackPageView } from '../../utils/analytics';
import { getCategoryOptions } from '../../utils/categories';
import { emailServiceClient } from '../../utils/emailServiceClient';
import toast from 'react-hot-toast';

interface Website {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';
  created_at: string;
  updated_at: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  link_listings_count?: number;
  total_earnings?: number;
  monthly_visitors?: number;
  domain_authority?: number;
  rejection_reason?: string;
}

const WebsitesManagement: React.FC = () => {
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [selectedWebsite, setSelectedWebsite] = React.useState<Website | null>(null);
  const [showWebsiteModal, setShowWebsiteModal] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    trackPageView('/admin/websites', 'Gestion Sites Web | Back.ma');
    loadWebsites();
  }, []);

  React.useEffect(() => {
    if (websites.length > 0) {
      loadStats();
    }
  }, [websites]);

  const loadWebsites = async () => {
    try {
      setLoading(true);

      const { data: websitesData, error } = await supabase
        .from('websites')
        .select(`
          *,
          user:users(
            id,
            name,
            email
          ),
          link_listings(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedWebsites = websitesData?.map(website => ({
        ...website,
        link_listings_count: website.link_listings?.[0]?.count || 0
      })) || [];

      setWebsites(transformedWebsites);
    } catch (error) {
      console.error('Error loading websites:', error);
      toast.error('Erreur lors du chargement des sites web');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = {
        total_websites: websites.length,
        active_websites: websites.filter(w => w.status === 'active').length,
        approved_websites: websites.filter(w => w.status === 'approved').length,
        pending_websites: websites.filter(w => w.status === 'pending').length,
        rejected_websites: websites.filter(w => w.status === 'rejected').length,
        suspended_websites: websites.filter(w => w.status === 'suspended').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredWebsites = websites.filter(website => {
    const matchesSearch = website.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         website.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         website.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || website.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || website.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleStatusChange = async (websiteId: string, newStatus: string, rejectionReason?: string) => {
    try {
      // Récupérer les informations du site avant la mise à jour
      const website = websites.find(w => w.id === websiteId);
      if (!website) return;

      const updateData: any = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('websites')
        .update(updateData)
        .eq('id', websiteId);

      if (error) throw error;

      // Envoyer l'email de notification selon le statut
      if (website.user) {
        try {
          if (newStatus === 'approved') {
            // Email d'approbation
               await emailServiceClient.sendTemplateEmail(
              'EDITOR_SITE_APPROVED',
              website.user.email,
              {
                user_name: website.user.name,
                site_name: website.title,
                site_url: website.url,
                dashboard_url: `${window.location.origin}/dashboard`
              },
              ['site_approved', 'editor', 'approval']
            );
          } else if (newStatus === 'rejected' && rejectionReason) {
            // Email de rejet
               await emailServiceClient.sendTemplateEmail(
              'EDITOR_SITE_REJECTED',
              website.user.email,
              {
                user_name: website.user.name,
                site_name: website.title,
                rejection_reason: rejectionReason,
                support_url: `${window.location.origin}/contact`
              },
              ['site_rejected', 'editor', 'feedback']
            );
          }
        } catch (emailError) {
          console.error('Erreur envoi email notification:', emailError);
          // Ne pas bloquer la mise à jour si l'email échoue
        }
      }

      toast.success(`Statut du site web mis à jour${newStatus === 'approved' ? ' et email envoyé' : ''}`);
      loadWebsites();
      loadStats();
    } catch (error) {
      console.error('Error updating website status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const exportWebsites = () => {
    const csvContent = [
      ['ID', 'Titre', 'URL', 'Catégorie', 'Statut', 'Propriétaire', 'Date création', 'Annonces'],
      ...filteredWebsites.map(website => [
        website.id,
        website.title,
        website.url,
        website.category,
        website.status,
        website.user?.name || 'N/A',
        new Date(website.created_at).toLocaleDateString('fr-FR'),
        website.link_listings_count?.toString() || '0'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sites_web_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export des sites web terminé');
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approuvé', icon: CheckCircle },
      active: { color: 'bg-green-100 text-green-800', text: 'Actif', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejeté', icon: XCircle },
      suspended: { color: 'bg-gray-100 text-gray-800', text: 'Suspendu', icon: AlertTriangle }
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

  const getCategoryBadge = (category: string) => {
    const colors = {
      'tech': 'bg-blue-100 text-blue-800',
      'business': 'bg-green-100 text-green-800',
      'lifestyle': 'bg-purple-100 text-purple-800',
      'health': 'bg-red-100 text-red-800',
      'education': 'bg-yellow-100 text-yellow-800',
      'entertainment': 'bg-pink-100 text-pink-800',
      'sports': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };

    const colorClass = colors[category as keyof typeof colors] || colors.other;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {category}
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Sites Web</h1>
            <p className="text-gray-600 mt-1">
              Modérez et gérez les sites web de la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportWebsites}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Total Sites</div>
                  <div className="text-lg font-bold text-blue-900">{stats.total_websites}</div>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-emerald-900">Actifs</div>
                  <div className="text-lg font-bold text-emerald-900">{stats.active_websites}</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-green-900">Approuvés</div>
                  <div className="text-lg font-bold text-green-900">{stats.approved_websites}</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-yellow-900">En attente</div>
                  <div className="text-lg font-bold text-yellow-900">{stats.pending_websites}</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-red-900">Rejetés</div>
                  <div className="text-lg font-bold text-red-900">{stats.rejected_websites}</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Suspendus</div>
                  <div className="text-lg font-bold text-gray-900">{stats.suspended_websites}</div>
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
                placeholder="Rechercher un site web..."
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
              <option value="pending">En attente</option>
              <option value="active">Actifs</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
              <option value="suspended">Suspendus</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getCategoryOptions().map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des sites web */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Web
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annonces
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
              {filteredWebsites.map((website) => (
                <motion.tr
                  key={website.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {website.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        <a 
                          href={website.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          {website.url}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {website.description?.substring(0, 50)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {website.user?.name?.charAt(0).toUpperCase() || website.user?.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {website.user?.name || 'Utilisateur'}
                        </div>
                        <div className="text-sm text-gray-500">{website.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(website.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(website.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {website.link_listings_count || 0} annonces
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(website.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedWebsite(website);
                          setShowWebsiteModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {website.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(website.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Raison du rejet:');
                              if (reason) {
                                handleStatusChange(website.id, 'rejected', reason);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {website.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(website.id, 'suspended')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspendre"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                      {website.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusChange(website.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Réactiver"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredWebsites.length === 0 && (
          <div className="p-8 text-center">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {websites.length === 0 ? 'Aucun site web' : 'Aucun site web trouvé'}
            </h3>
            <p className="text-gray-500">
              {websites.length === 0 
                ? 'Aucun site web n\'a été soumis sur la plateforme.'
                : 'Aucun site web ne correspond à vos critères de recherche.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails site web */}
      {showWebsiteModal && selectedWebsite && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Détails du site web
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titre</label>
                  <p className="text-sm text-gray-900">{selectedWebsite.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <a 
                    href={selectedWebsite.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedWebsite.url}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedWebsite.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                  <p className="text-sm text-gray-900">{selectedWebsite.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{selectedWebsite.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Propriétaire</label>
                  <p className="text-sm text-gray-900">{selectedWebsite.user?.name}</p>
                  <p className="text-xs text-gray-500">{selectedWebsite.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Annonces</label>
                  <p className="text-sm text-gray-900">{selectedWebsite.link_listings_count || 0} annonces</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de soumission</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedWebsite.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selectedWebsite.rejection_reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Raison du rejet</label>
                    <p className="text-sm text-red-600">{selectedWebsite.rejection_reason}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowWebsiteModal(false)}
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

export default WebsitesManagement; 