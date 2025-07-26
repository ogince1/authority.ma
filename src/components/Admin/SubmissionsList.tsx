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
  ExternalLink,
  FileText,
  Code,
  Globe,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ProjectSubmission } from '../../types';
import { 
  getProjectSubmissions, 
  updateProjectSubmissionStatus, 
  approveProjectSubmission 
} from '../../lib/supabase';
import toast from 'react-hot-toast';

const SubmissionsList: React.FC = () => {
  const [submissions, setSubmissions] = React.useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = React.useState<ProjectSubmission | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [adminNotes, setAdminNotes] = React.useState('');

  React.useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const submissionsData = await getProjectSubmissions();
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (submissionId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      if (status === 'approved') {
        await approveProjectSubmission(submissionId, adminNotes);
        toast.success('Demande approuvée et projet créé avec succès !');
      } else {
        await updateProjectSubmissionStatus(submissionId, status, adminNotes);
        toast.success('Demande refusée avec succès');
      }
      
      setSubmissions(submissions.map(s => 
        s.id === submissionId ? { ...s, status, admin_notes: adminNotes } : s
      ));
      setShowModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Refusée';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return Check;
      case 'rejected': return X;
      default: return Clock;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mvp': return 'MVP';
      case 'startup': return 'Startup';
      case 'website': return 'Site Web';
      default: return category;
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
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Demandes de Vente</h1>
          <p className="text-gray-600">Gérez les demandes de vente de projets soumises</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            {submissions.filter(s => s.status === 'pending').length} en attente
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
            {submissions.filter(s => s.status === 'approved').length} approuvées
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
              placeholder="Rechercher par titre, nom ou email..."
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
            <option value="approved">Approuvées</option>
            <option value="rejected">Refusées</option>
          </select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-600">
            {filteredSubmissions.length} demande(s) trouvée(s)
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande trouvée
            </h3>
            <p className="text-gray-600">
              Aucune demande ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
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
                {filteredSubmissions.map((submission, index) => {
                  const StatusIcon = getStatusIcon(submission.status);
                  return (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {submission.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.contact_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.contact_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(submission.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.price.toLocaleString()} MAD
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {submission.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Approuver"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowModal(true);
                                }}
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

      {/* Submission Detail Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de la Demande de Vente
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
                {/* Project Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Informations du Projet
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titre
                      </label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{selectedSubmission.title}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Catégorie
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{getCategoryLabel(selectedSubmission.category)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix Demandé
                      </label>
                      <p className="mt-1 text-lg font-semibold text-blue-600">
                        {selectedSubmission.price.toLocaleString()} MAD
                      </p>
                    </div>
                    {selectedSubmission.demo_url && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Démonstration
                        </label>
                        <div className="mt-1">
                          <a
                            href={selectedSubmission.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Voir la démo
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </label>
                    <p className="mt-1 text-sm text-gray-700">{selectedSubmission.description}</p>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    Détails Techniques
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fonctionnalités
                      </label>
                      <div className="mt-1 space-y-1">
                        {selectedSubmission.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <Check className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technologies
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedSubmission.tech_stack.map((tech, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Industry Tags - if available */}
                    {selectedSubmission.industry_tags && selectedSubmission.industry_tags.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Secteurs d'Activité
                        </label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedSubmission.industry_tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Informations de Contact
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSubmission.contact_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </label>
                      <div className="mt-1 flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${selectedSubmission.contact_email}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedSubmission.contact_email}
                        </a>
                      </div>
                    </div>
                    {selectedSubmission.contact_phone && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Téléphone
                        </label>
                        <div className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <a
                            href={`tel:${selectedSubmission.contact_phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {selectedSubmission.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedSubmission.contact_website && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Site Web
                        </label>
                        <div className="mt-1 flex items-center">
                          <Globe className="h-4 w-4 text-gray-400 mr-2" />
                          <a
                            href={selectedSubmission.contact_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {selectedSubmission.contact_website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {selectedSubmission.additional_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Informations Complémentaires
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.additional_info}
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedSubmission.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Notes d'Administration (optionnel)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ajoutez des notes pour expliquer votre décision..."
                    />
                  </div>
                )}

                {/* Existing Admin Notes */}
                {selectedSubmission.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Notes d'Administration
                    </label>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.admin_notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Statut de la Demande
                  </h4>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSubmission.status)}`}>
                      {getStatusLabel(selectedSubmission.status)}
                    </span>
                    <div className="text-sm text-gray-500">
                      Soumise le {new Date(selectedSubmission.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedSubmission.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleStatusUpdate(selectedSubmission.id, 'rejected')}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Traitement...' : 'Refuser'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedSubmission.id, 'approved')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {actionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Création...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Approuver et Créer le Projet</span>
                        </>
                      )}
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

export default SubmissionsList;