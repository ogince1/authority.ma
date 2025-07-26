import React from 'react';
import { 
  Search, 
  Filter, 
  Eye,
  Check,
  X,
  Clock,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Proposal, Project } from '../../types';
import { getProposals, updateProposalStatus, getProjects } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ProposalsList: React.FC = () => {
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [selectedProposal, setSelectedProposal] = React.useState<Proposal | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [proposalsData, projectsData] = await Promise.all([
        getProposals(),
        getProjects()
      ]);
      setProposals(proposalsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (proposalId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateProposalStatus(proposalId, status);
      setProposals(proposals.map(p => 
        p.id === proposalId ? { ...p, status } : p
      ));
      toast.success(`Proposition ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès`);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Projet inconnu';
  };

  const getProjectSlug = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.slug || '';
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectTitle(proposal.project_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'accepted': return 'Acceptée';
      case 'rejected': return 'Refusée';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return Check;
      case 'rejected': return X;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Propositions</h1>
          <p className="text-gray-600">Gérez toutes les propositions d'achat reçues</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            {proposals.filter(p => p.status === 'pending').length} en attente
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
            {proposals.filter(p => p.status === 'accepted').length} acceptées
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Acceptées</option>
            <option value="rejected">Refusées</option>
          </select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-600">
            {filteredProposals.length} proposition(s) trouvée(s)
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <MessageSquare className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune proposition trouvée
            </h3>
            <p className="text-gray-600">
              Aucune proposition ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acheteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix Proposé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map((proposal, index) => {
                  const StatusIcon = getStatusIcon(proposal.status);
                  return (
                    <motion.tr
                      key={proposal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {proposal.buyer_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {proposal.buyer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {proposal.buyer_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getProjectTitle(proposal.project_id)}
                        </div>
                        <Link
                          to={`/project/${getProjectSlug(proposal.project_id)}`}
                          target="_blank"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          Voir le projet
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {proposal.proposed_price.toLocaleString()} MAD
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusLabel(proposal.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(proposal.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {proposal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(proposal.id, 'accepted')}
                                className="text-green-600 hover:text-green-900"
                                title="Accepter"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(proposal.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                title="Refuser"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proposal Detail Modal */}
      {showModal && selectedProposal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de la Proposition
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Buyer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Informations de l'Acheteur
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{selectedProposal.buyer_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </label>
                      <div className="mt-1 flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${selectedProposal.buyer_email}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedProposal.buyer_email}
                        </a>
                      </div>
                    </div>
                    {selectedProposal.buyer_phone && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Téléphone
                        </label>
                        <div className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <a
                            href={`tel:${selectedProposal.buyer_phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {selectedProposal.buyer_phone}
                          </a>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de la proposition
                      </label>
                      <div className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-900">
                          {new Date(selectedProposal.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Projet Concerné
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getProjectTitle(selectedProposal.project_id)}
                      </p>
                      <Link
                        to={`/project/${getProjectSlug(selectedProposal.project_id)}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1"
                      >
                        Voir le projet
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Proposal Details */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Détails de la Proposition
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix Proposé
                      </label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        {selectedProposal.proposed_price.toLocaleString()} MAD
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedProposal.status)}`}>
                          {getStatusLabel(selectedProposal.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {selectedProposal.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message de l'Acheteur
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedProposal.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedProposal.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleStatusUpdate(selectedProposal.id, 'rejected')}
                      className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedProposal.id, 'accepted')}
                      className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      Accepter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsList;