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
  AlertCircle,
  MessageSquare,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LinkListing, Website } from '../types';
import { getLinkListingById, getWebsiteById } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import LinkPurchaseForm from '../components/Links/LinkPurchaseForm';
import { trackPageView } from '../utils/analytics';
import toast from 'react-hot-toast';

const LinkDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = React.useState<LinkListing & { website?: Website } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showPurchaseForm, setShowPurchaseForm] = React.useState(false);

  React.useEffect(() => {
    const fetchLink = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const linkData = await getLinkListingById(slug);
        if (linkData) {
          // Fetch website data if available
          if (linkData.website_id) {
            try {
              const websiteData = await getWebsiteById(linkData.website_id);
              setLink({ ...linkData, website: websiteData });
            } catch (error) {
              console.error('Error fetching website:', error);
              setLink(linkData);
            }
          } else {
            setLink(linkData);
          }
          
          // Track page view
          trackPageView(`/lien/${slug}`, `${linkData.title} | Back.ma`);
        }
      } catch (error) {
        console.error('Error fetching link:', error);
        toast.error('Erreur lors du chargement du lien');
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [slug]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getLinkTypeColor = (type: string) => {
    switch (type) {
      case 'dofollow':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'nofollow':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sponsored':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ugc':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'header':
        return '🔝';
      case 'footer':
        return '🔽';
      case 'sidebar':
        return '📋';
      case 'content':
        return '📄';
      case 'menu':
        return '🍽️';
      case 'popup':
        return '💬';
      default:
        return '📍';
    }
  };

  if (loading) {
    return (
      <>
        <SEOHead 
          title="Chargement... | Back.ma"
          description="Chargement des détails du lien"
        />
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!link) {
    return (
      <>
        <SEOHead 
          title="Lien non trouvé | Back.ma"
          description="Le lien demandé n'existe pas"
        />
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lien non trouvé</h1>
            <p className="text-gray-600 mb-6">Le lien que vous recherchez n'existe pas ou a été supprimé.</p>
            <Link
              to="/liens"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour aux liens
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
        title={`${link.title} | Back.ma`}
        description={link.description}
        keywords={link.tags?.join(', ')}
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
              <span className="text-gray-900">{link.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2">
              {/* Header du lien */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/liens"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {link.title}
                      </h1>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLinkTypeColor(link.link_type)}`}>
                          {link.link_type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          {getPositionIcon(link.position)} {link.position}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(link.price, link.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      par mois
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  {link.description}
                </p>

                {/* Métriques principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {link.minimum_contract_duration}
                    </div>
                    <div className="text-xs text-gray-500">Mois min.</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {link.max_links_per_page || '∞'}
                    </div>
                    <div className="text-xs text-gray-500">Liens/page</div>
                  </div>
                </div>

                {/* Détails du lien */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails du lien</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>Ancre: <strong>"{link.anchor_text}"</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                        <span>URL: <strong>{link.target_url}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Durée minimale: <strong>{link.minimum_contract_duration} mois</strong></span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Informations du site web */}
              {link.website && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Site web hôte</h2>
                  
                  <div className="flex items-start space-x-4 mb-6">
                    {link.website.logo ? (
                      <img 
                        src={link.website.logo} 
                        alt={link.website.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {link.website.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <ExternalLink className="h-3 w-3" />
                        <span>{link.website.url}</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {link.website.description}
                      </p>
                    </div>
                  </div>

                  {/* Métriques du site */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {link.website.metrics?.domain_authority || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Domain Authority</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {link.website.metrics?.monthly_traffic ? 
                          `${(link.website.metrics.monthly_traffic / 1000).toFixed(0)}K` : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-gray-500">Visiteurs/mois</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {link.website.available_link_spots}
                      </div>
                      <div className="text-xs text-gray-500">Emplacements</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {link.website.average_response_time || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Heures réponse</div>
                    </div>
                  </div>

                  {/* Contact */}
                  {link.website.contact_info && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Contact:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{link.website.contact_info.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{link.website.contact_info.email}</span>
                        </div>
                        {link.website.contact_info.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{link.website.contact_info.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* CTA d'achat */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Acheter ce lien
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Prix par mois:</span>
                    <span className="font-semibold">{formatPrice(link.price, link.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Durée minimale:</span>
                    <span className="font-semibold">{link.minimum_contract_duration} mois</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type de lien:</span>
                    <span className="font-semibold">{link.link_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-semibold">{link.position}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPurchaseForm(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>Acheter maintenant</span>
                </button>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Demande d'achat envoyée à l'éditeur
                  </p>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Informations importantes
                </h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Lien vérifié et approuvé</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Activation sous 24-48h</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-purple-600 mt-0.5" />
                    <span>Support client disponible</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Paiement sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'achat */}
      <LinkPurchaseForm
        link={link}
        isOpen={showPurchaseForm}
        onClose={() => setShowPurchaseForm(false)}
        onSuccess={() => {
          // Optionnel: rediriger ou afficher un message de succès
        }}
      />

      <Footer />
    </>
  );
};

export default LinkDetailPage; 