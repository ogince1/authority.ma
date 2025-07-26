import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Calendar, 
  DollarSign,
  User,
  Code,
  CheckCircle,
  Mail,
  Phone,
  Globe,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Project, CreateProposalData } from '../types';
import { getProjectBySlug, createProposal } from '../lib/supabase';
import Header from '../components/Layout/Header';
import { trackProjectView, trackProposalSubmit } from '../utils/analytics';
import Footer from '../components/Layout/Footer';
import ProposalForm from '../components/Projects/ProposalForm';
import SEOHead from '../components/SEO/SEOHead';
import toast from 'react-hot-toast';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [proposalLoading, setProposalLoading] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  React.useEffect(() => {
    const fetchProject = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const projectData = await getProjectBySlug(slug);
        setProject(projectData);
        
        // Track project view
        if (projectData) {
          trackProjectView(
            projectData.id,
            projectData.title,
            projectData.category,
            projectData.price
          );
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  const handleProposalSubmit = async (data: CreateProposalData) => {
    setProposalLoading(true);
    try {
      await createProposal(data);
      toast.success('Proposition envoyée avec succès !');
      
      // Track proposal submission
      trackProposalSubmit(data.project_id, data.proposed_price);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Erreur lors de l\'envoi de la proposition');
    } finally {
      setProposalLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mvp':
        return 'MVP';
      case 'startup':
        return 'Startup';
      case 'website':
        return 'Site Web';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mvp':
        return 'bg-orange-100 text-orange-800';
      case 'startup':
        return 'bg-green-100 text-green-800';
      case 'website':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
                <div className="bg-white p-6 rounded-lg">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Projet non trouvé
            </h1>
            <p className="text-gray-600 mb-8">
              Le projet que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={project.meta_title || `${project.title} - ${getCategoryLabel(project.category)} à vendre | GoHaya`}
        description={project.meta_description || project.description}
        image={project.images[0]}
        url={`https://gohaya.com/project/${project.slug}`}
        type="article"
      />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux projets
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg overflow-hidden shadow-lg"
              >
                <div className="h-80 relative">
                  <img
                    src={project.images[selectedImageIndex] || project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(project.category)}`}>
                      {getCategoryLabel(project.category)}
                    </span>
                  </div>
                </div>
                {project.images.length > 1 && (
                  <div className="p-4 flex space-x-2 overflow-x-auto">
                    {project.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          index === selectedImageIndex ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${project.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <div className="text-3xl font-bold text-blue-600">
                  {formatPrice(project.price)}
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Publié le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  <span>Projet vérifié</span>
                </div>
              </div>

              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Demo Link */}
              {project.demo_url && (
                <div className="mb-8">
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Voir la Démo
                  </a>
                </div>
              )}

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Fonctionnalités Incluses
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {project.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Code className="mr-2 h-5 w-5 text-blue-600" />
                  Stack Technique
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Industry Tags */}
              {project.industry_tags.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Tag className="mr-2 h-5 w-5 text-emerald-600" />
                    Secteurs d'Activité
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.industry_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Project Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations du Projet
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Prix</div>
                      <div className="font-semibold">{formatPrice(project.price)}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Catégorie</div>
                      <div className="font-semibold">{getCategoryLabel(project.category)}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Publié le</div>
                      <div className="font-semibold">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Info */}
              {project.contact_info && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Vendeur
                  </h3>
                  <div className="space-y-3">
                    {project.contact_info.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600">{project.contact_info.email}</span>
                      </div>
                    )}
                    {project.contact_info.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600">{project.contact_info.phone}</span>
                      </div>
                    )}
                    {project.contact_info.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 text-gray-400 mr-3" />
                        <a
                          href={project.contact_info.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {project.contact_info.website}
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Proposal Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <ProposalForm
                  projectId={project.id}
                  projectPrice={project.price}
                  onSubmit={handleProposalSubmit}
                  loading={proposalLoading}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetailPage;