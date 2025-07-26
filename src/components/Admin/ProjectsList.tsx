import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import { getAllProjects, deleteProject, getProjects, getCurrentUser } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterIndustryTag, setFilterIndustryTag] = React.useState<string>('all');
  const [filterProjectType, setFilterProjectType] = React.useState<string>('all');
  const [filterIndustrySector, setFilterIndustrySector] = React.useState<string>('all');

  React.useEffect(() => {
    fetchProjects();
  }, [location]);

  const fetchProjects = async () => {
    try {
      // Si on est dans le dashboard utilisateur, récupérer seulement les projets de l'utilisateur
      const isUserDashboard = location.pathname.includes('/dashboard');
      const currentUser = isUserDashboard ? await getCurrentUser() : null;
      
      const projectsData = isUserDashboard && currentUser 
        ? await getProjects({ user_id: currentUser.id })
        : await getAllProjects();
        
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Projet supprimé avec succès');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || project.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesIndustryTag = filterIndustryTag === 'all' || project.industry_tags.includes(filterIndustryTag);
    const matchesProjectType = filterProjectType === 'all' || project.project_type === filterProjectType;
    const matchesIndustrySector = filterIndustrySector === 'all' || project.industry_sector === filterIndustrySector;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesIndustryTag && matchesProjectType && matchesIndustrySector;
  });

  // Get unique industry tags from all projects
  const allIndustryTags = [...new Set(projects.flatMap(p => p.industry_tags))].sort();

  const getCategoryLabel = (category: string) => {
    const categoryLabels: { [key: string]: string } = {
      // Digital categories
      'mvp': 'MVP',
      'startup': 'Startup',
      'website': 'Site Web',
      'site_web_actif': 'Site Web Actif',
      'domaine_site_trafic': 'Domaine + Site + Trafic',
      'startup_tech': 'Startup Tech',
      'application_mobile': 'Application Mobile',
      'plateforme_saas': 'Plateforme SaaS',
      // Real categories
      'fonds_commerce': 'Fonds de Commerce',
      'local_commercial': 'Local Commercial',
      'projet_industriel': 'Projet Industriel',
      'franchise': 'Franchise',
      'restaurant_luxe': 'Restaurant de Luxe',
      'salon_luxe': 'Salon de Luxe',
      'immobilier': 'Immobilier',
      'hotellerie': 'Hôtellerie',
      'industrie': 'Industrie',
      'agriculture': 'Agriculture',
      'energie': 'Énergie',
      'logistique': 'Logistique',
      'mines': 'Mines',
      'art': 'Art et Collections',
      'commerce': 'Commerce'
    };
    return categoryLabels[category] || category;
  };

  const getProjectTypeLabel = (projectType: string) => {
    switch (projectType) {
      case 'digital': return 'Digital';
      case 'real': return 'Réel';
      default: return projectType;
    }
  };

  const getIndustrySectorLabel = (sector: string) => {
    const sectorLabels: { [key: string]: string } = {
      'immobilier': 'Immobilier',
      'artisanat': 'Artisanat',
      'services': 'Services',
      'e-commerce': 'E-commerce',
      'technologie': 'Technologie',
      'sante': 'Santé',
      'education': 'Éducation',
      'finance': 'Finance',
      'tourisme': 'Tourisme',
      'agriculture': 'Agriculture',
      'industrie': 'Industrie',
      'energie': 'Énergie',
      'logistique': 'Logistique',
      'art': 'Art',
      'franchise': 'Franchise',
      'hotellerie': 'Hôtellerie',
      'commerce': 'Commerce',
      'marketing': 'Marketing',
      'conseil': 'Conseil',
      'transport': 'Transport'
    };
    return sectorLabels[sector] || sector;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'sold': return 'Vendu';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-gray-600">Gérez vos projets sur la marketplace</p>
        </div>
        <Link
          to={location.pathname.includes('/admin') ? '/admin/projects/new' : '/dashboard/projects/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Projet</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Project Type Filter */}
          <select
            value={filterProjectType}
            onChange={(e) => setFilterProjectType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="digital">Digital</option>
            <option value="real">Réel</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes catégories</option>
            {/* Digital categories */}
            <optgroup label="Digital">
              <option value="mvp">MVP</option>
              <option value="startup">Startup</option>
              <option value="website">Site Web</option>
              <option value="site_web_actif">Site Web Actif</option>
              <option value="domaine_site_trafic">Domaine + Site + Trafic</option>
              <option value="startup_tech">Startup Tech</option>
              <option value="application_mobile">Application Mobile</option>
              <option value="plateforme_saas">Plateforme SaaS</option>
            </optgroup>
            {/* Real categories */}
            <optgroup label="Réel">
              <option value="fonds_commerce">Fonds de Commerce</option>
              <option value="local_commercial">Local Commercial</option>
              <option value="projet_industriel">Projet Industriel</option>
              <option value="franchise">Franchise</option>
              <option value="restaurant_luxe">Restaurant de Luxe</option>
              <option value="salon_luxe">Salon de Luxe</option>
              <option value="immobilier">Immobilier</option>
              <option value="hotellerie">Hôtellerie</option>
              <option value="industrie">Industrie</option>
              <option value="agriculture">Agriculture</option>
              <option value="energie">Énergie</option>
              <option value="logistique">Logistique</option>
              <option value="mines">Mines</option>
              <option value="art">Art et Collections</option>
              <option value="commerce">Commerce</option>
            </optgroup>
          </select>

          {/* Industry Sector Filter */}
          <select
            value={filterIndustrySector}
            onChange={(e) => setFilterIndustrySector(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous secteurs</option>
            <option value="immobilier">Immobilier</option>
            <option value="artisanat">Artisanat</option>
            <option value="services">Services</option>
            <option value="e-commerce">E-commerce</option>
            <option value="technologie">Technologie</option>
            <option value="sante">Santé</option>
            <option value="education">Éducation</option>
            <option value="finance">Finance</option>
            <option value="tourisme">Tourisme</option>
            <option value="agriculture">Agriculture</option>
            <option value="industrie">Industrie</option>
            <option value="energie">Énergie</option>
            <option value="logistique">Logistique</option>
            <option value="art">Art</option>
            <option value="franchise">Franchise</option>
            <option value="hotellerie">Hôtellerie</option>
            <option value="commerce">Commerce</option>
            <option value="marketing">Marketing</option>
            <option value="conseil">Conseil</option>
            <option value="transport">Transport</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="sold">Vendu</option>
          </select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-600">
            {filteredProjects.length} projet(s)
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun projet trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {location.pathname.includes('/dashboard') 
                ? "Vous n'avez pas encore créé de projet."
                : "Aucun projet ne correspond à vos critères de recherche."}
            </p>
            <Link
              to={location.pathname.includes('/admin') ? '/admin/projects/new' : '/dashboard/projects/new'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {location.pathname.includes('/dashboard') ? 'Créer le premier projet' : 'Créer un projet'}
            </Link>
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secteur
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
                {filteredProjects.map((project, index) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={project.images[0] || 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg'}
                            alt={project.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {project.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {project.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.project_type === 'digital' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {getProjectTypeLabel(project.project_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getCategoryLabel(project.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {getIndustrySectorLabel(project.industry_sector)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.price.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/project/${project.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-gray-600"
                          title="Voir sur le site"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={location.pathname.includes('/admin') ? `/admin/projects/${project.id}/edit` : `/dashboard/projects/${project.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;