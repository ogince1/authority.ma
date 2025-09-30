import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Calendar, 
  DollarSign,
  User,
  Tag,
  CheckCircle,
  Mail,
  Phone,
  Globe,
  TrendingUp,
  Eye,
  Clock,
  MapPin,
  MessageSquare,
  Shield,
  Link as LinkIcon,
  Globe as GlobeIcon,
  Users,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Website, LinkListing } from '../types';
import { getWebsiteById, getLinkListings } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import LinkCard from '../components/Links/LinkCard';
import { trackPageView } from '../utils/analytics';
import toast from 'react-hot-toast';

const WebsiteDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [website, setWebsite] = React.useState<Website | null>(null);
  const [linkListings, setLinkListings] = React.useState<LinkListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'links' | 'contact'>('overview');

  React.useEffect(() => {
    const fetchWebsite = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const websiteData = await getWebsiteById(slug);
        if (websiteData) {
          setWebsite(websiteData);
          
          // Fetch link listings for this website
          const linksData = await getLinkListings({ 
            status: 'active'
          });
          setLinkListings(linksData);
          
          // Track page view
          trackPageView(`/site/${slug}`, `${websiteData.title} | Back.ma`);
        }
      } catch (error) {
        console.error('Error fetching website:', error);
        toast.error('Erreur lors du chargement du site web');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [slug]);

  const formatTraffic = (traffic?: number) => {
    if (!traffic) return 'N/A';
    if (traffic >= 1000000) {
      return `${(traffic / 1000000).toFixed(1)}M`;
    } else if (traffic >= 1000) {
      return `${(traffic / 1000).toFixed(1)}K`;
    }
    return traffic.toString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'blog':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ecommerce':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'actualites':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'lifestyle':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tech':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'business':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNicheColor = (niche: string) => {
    switch (niche) {
      case 'immobilier':
        return 'bg-orange-100 text-orange-800';
      case 'sante':
        return 'bg-red-100 text-red-800';
      case 'tech':
        return 'bg-blue-100 text-blue-800';
      case 'finance':
        return 'bg-green-100 text-green-800';
      case 'education':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'average':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <>
        <SEOHead 
          title="Chargement... | Back.ma"
          description="Chargement des détails du site web"
        />
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!website) {
    return (
      <>
        <SEOHead 
          title="Site web non trouvé | Back.ma"
          description="Le site web demandé n'existe pas"
        />
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Site web non trouvé</h1>
            <p className="text-gray-600 mb-6">Le site web que vous recherchez n'existe pas ou a été supprimé.</p>
            <Link
              to="/sites-web"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour aux sites web
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${website.title} | Back.ma`}
        description={website.description}
      />
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600">Accueil</Link>
              <span>/</span>
              <Link to="/liens" className="hover:text-blue-600">Liens</Link>
              <span>/</span>
              <span className="text-gray-900">{website.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2">
              {/* Header du site web */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Link
                      to="/liens"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center space-x-4">
                      {website.logo ? (
                        <img 
                          src={website.logo} 
                          alt={website.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                          <GlobeIcon className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {website.title}
                        </h1>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <ExternalLink className="h-3 w-3" />
                          <span>{website.url}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">DA: {website.metrics?.domain_authority || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Eye className="h-4 w-4" />
                      <span>{formatTraffic(website.metrics?.monthly_traffic)}/mois</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  {website.description}
                </p>

                {/* Catégories et niches */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(website.category)}`}>
                    {website.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNicheColor(website.niche)}`}>
                    {website.niche}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {website.owner_status}
                  </span>
                </div>

                {/* Métriques principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {website.available_link_spots}
                    </div>
                    <div className="text-xs text-gray-500">Emplacements</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {website.average_response_time || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Heures réponse</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {website.languages.length}
                    </div>
                    <div className="text-xs text-gray-500">Langues</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {website.payment_methods.length}
                    </div>
                    <div className="text-xs text-gray-500">Paiements</div>
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Aperçu
                    </button>
                    <button
                      onClick={() => setActiveTab('links')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'links'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Liens disponibles ({linkListings.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('contact')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'contact'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Contact
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Onglet Aperçu */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Métriques détaillées */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques SEO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Domain Authority</span>
                            <span className="font-semibold">{website.metrics?.domain_authority || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Page Authority</span>
                            <span className="font-semibold">{website.metrics?.page_authority || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Liens</span>
                            <span className="font-semibold">{website.metrics?.backlinks_count || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Mots-clés organiques</span>
                            <span className="font-semibold">{website.metrics?.organic_keywords || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Classement Alexa</span>
                            <span className="font-semibold">{website.metrics?.alexa_rank || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Pages indexées</span>
                            <span className="font-semibold">{website.metrics?.google_indexed_pages || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Qualité du contenu */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualité du contenu</h3>
                        <div className="flex items-center space-x-2">
                          <Star className={`h-5 w-5 ${getQualityColor(website.content_quality)}`} />
                          <span className={`font-medium ${getQualityColor(website.content_quality)}`}>
                            {website.content_quality.charAt(0).toUpperCase() + website.content_quality.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Langues */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Langues supportées</h3>
                        <div className="flex flex-wrap gap-2">
                          {website.languages.map((lang, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Méthodes de paiement */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de paiement acceptées</h3>
                        <div className="flex flex-wrap gap-2">
                          {website.payment_methods.map((method, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Screenshots */}
                      {website.screenshots && website.screenshots.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Captures d'écran</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {website.screenshots.slice(0, 4).map((screenshot, index) => (
                              <img
                                key={index}
                                src={screenshot}
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Onglet Liens */}
                  {activeTab === 'links' && (
                    <div>
                      {linkListings.length === 0 ? (
                        <div className="text-center py-12">
                          <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lien disponible</h3>
                          <p className="text-gray-500 mb-4">
                            Ce site web n'a pas encore d'annonces de liens actives.
                          </p>
                          <Link
                            to="/liens"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Voir tous les liens
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {linkListings.map((link) => (
                            <LinkCard
                              key={link.id}
                              listing={link}
                              onEdit={(listing) => {
                                // Rediriger vers la page de détail du lien
                                window.location.href = `/lien/${listing.slug}`;
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Onglet Contact */}
                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{website.contact_info.name}</div>
                              <div className="text-sm text-gray-500">Contact principal</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{website.contact_info.email}</div>
                              <div className="text-sm text-gray-500">Email</div>
                            </div>
                          </div>
                          {website.contact_info.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="h-5 w-5 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">{website.contact_info.phone}</div>
                                <div className="text-sm text-gray-500">Téléphone</div>
                              </div>
                            </div>
                          )}
                          {website.contact_info.whatsapp && (
                            <div className="flex items-center space-x-3">
                              <MessageSquare className="h-5 w-5 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">{website.contact_info.whatsapp}</div>
                                <div className="text-sm text-gray-500">WhatsApp</div>
                              </div>
                            </div>
                          )}
                          {website.contact_info.website && (
                            <div className="flex items-center space-x-3">
                              <Globe className="h-5 w-5 text-gray-400" />
                              <div>
                                <a 
                                  href={website.contact_info.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {website.contact_info.website}
                                </a>
                                <div className="text-sm text-gray-500">Site web</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacter l'éditeur</h3>
                        <p className="text-gray-600 mb-4">
                          Vous souhaitez acheter des liens sur ce site web ? Contactez directement l'éditeur.
                        </p>
                        <div className="flex space-x-4">
                          <a
                            href={`mailto:${website.contact_info.email}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <Mail className="h-4 w-4" />
                            <span>Envoyer un email</span>
                          </a>
                          {website.contact_info.phone && (
                            <a
                              href={`tel:${website.contact_info.phone}`}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                              <Phone className="h-4 w-4" />
                              <span>Appeler</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* CTA d'achat */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Acheter des liens
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Liens disponibles:</span>
                    <span className="font-semibold">{website.available_link_spots}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Temps de réponse:</span>
                    <span className="font-semibold">{website.average_response_time || 'N/A'}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Domain Authority:</span>
                    <span className="font-semibold">{website.metrics?.domain_authority || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Trafic mensuel:</span>
                    <span className="font-semibold">{formatTraffic(website.metrics?.monthly_traffic)}</span>
                  </div>
                </div>

                <Link
                  to={`/liens?website_id=${website.id}`}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <LinkIcon className="h-5 w-5" />
                  <span>Voir les liens</span>
                </Link>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Contactez l'éditeur pour négocier
                  </p>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  À propos de ce site
                </h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Site vérifié et approuvé</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Réponse rapide garantie</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Award className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Qualité de contenu {website.content_quality}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default WebsiteDetailPage; 