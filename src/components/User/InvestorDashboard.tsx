import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  TrendingUp, 
  Heart,
  Eye,
  Filter,
  PieChart,
  BarChart,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Zap,
  Star,
  ArrowLeft,
  Briefcase,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Project, FundraisingOpportunity, InvestmentInterest, ProjectFilterOptions } from '../../types';
import { 
  getProjects, 
  getFundraisingOpportunities,
  getInvestmentInterests,
  getCurrentUser
} from '../../lib/supabase';
import ProjectCard from '../Projects/ProjectCard';
import ProjectGrid from '../Projects/ProjectGrid';
import ProjectFilters from '../Projects/ProjectFilters';

const InvestorDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [opportunities, setOpportunities] = React.useState<FundraisingOpportunity[]>([]);
  const [interests, setInterests] = React.useState<InvestmentInterest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [digitalProjects, setDigitalProjects] = React.useState<Project[]>([]);
  const [digitalProjectsLoading, setDigitalProjectsLoading] = React.useState(true);
  
  // Nouveaux états pour la vue complète des projets
  const [showFullProjectsView, setShowFullProjectsView] = React.useState(false);
  const [allDigitalProjects, setAllDigitalProjects] = React.useState<Project[]>([]);
  const [allProjectsLoading, setAllProjectsLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<ProjectFilterOptions>({
    project_type: 'digital'
  });
  const [search, setSearch] = React.useState('');

  // Nouveaux états pour la vue complète des investissements
  const [showFullInvestmentsView, setShowFullInvestmentsView] = React.useState(false);
  const [allOpportunities, setAllOpportunities] = React.useState<FundraisingOpportunity[]>([]);
  const [allOpportunitiesLoading, setAllOpportunitiesLoading] = React.useState(false);
  const [investmentFilters, setInvestmentFilters] = React.useState({
    investment_stage: '',
    min_amount: '',
    max_amount: '',
    status: 'active'
  });

  // Vérifier si on doit afficher la vue complète basée sur l'URL
  React.useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'projects') {
      setShowFullProjectsView(true);
    } else if (view === 'investments') {
      setShowFullInvestmentsView(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Récupérer les projets actifs pour exploration
        const [projectsData, opportunitiesData, interestsData] = await Promise.all([
          getProjects(),
          getFundraisingOpportunities(),
          getInvestmentInterests()
        ]);
        
        setProjects(projectsData.slice(0, 6)); // Limite à 6 pour aperçu
        setOpportunities(opportunitiesData.slice(0, 6));
        setInterests(interestsData);
      } catch (error) {
        console.error('Error fetching investor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDigitalProjects = async () => {
      try {
        // Récupérer spécifiquement les projets digitaux
        const digitalProjectsData = await getProjects({
          project_type: 'digital'
        });
        setDigitalProjects(digitalProjectsData.slice(0, 6)); // Limite à 6 pour aperçu
      } catch (error) {
        console.error('Error fetching digital projects:', error);
      } finally {
        setDigitalProjectsLoading(false);
      }
    };

    fetchData();
    fetchDigitalProjects();
  }, []);

  // Nouveau useEffect pour charger tous les projets quand on passe en vue complète
  React.useEffect(() => {
    if (showFullProjectsView) {
      const fetchAllProjects = async () => {
        setAllProjectsLoading(true);
        try {
          const allProjectsData = await getProjects({
            ...filters,
            project_type: 'digital',
            search: search || undefined
          });
          setAllDigitalProjects(allProjectsData);
        } catch (error) {
          console.error('Error fetching all digital projects:', error);
        } finally {
          setAllProjectsLoading(false);
        }
      };

      fetchAllProjects();
    }
  }, [showFullProjectsView, filters, search]);

  // Nouveau useEffect pour charger toutes les opportunités d'investissement
  React.useEffect(() => {
    if (showFullInvestmentsView) {
      const fetchAllOpportunities = async () => {
        setAllOpportunitiesLoading(true);
        try {
          const allOpportunitiesData = await getFundraisingOpportunities();
          setAllOpportunities(allOpportunitiesData);
        } catch (error) {
          console.error('Error fetching all investment opportunities:', error);
        } finally {
          setAllOpportunitiesLoading(false);
        }
      };

      fetchAllOpportunities();
    }
  }, [showFullInvestmentsView]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleFiltersChange = (newFilters: ProjectFilterOptions) => {
    setFilters({
      ...newFilters,
      project_type: 'digital'
    });
  };

  const handleShowFullProjects = () => {
    setShowFullProjectsView(true);
    setShowFullInvestmentsView(false);
    setSearchParams({ view: 'projects' });
  };

  const handleShowFullInvestments = () => {
    setShowFullInvestmentsView(true);
    setShowFullProjectsView(false);
    setSearchParams({ view: 'investments' });
  };

  const handleBackToDashboard = () => {
    setShowFullProjectsView(false);
    setShowFullInvestmentsView(false);
    setSearchParams({});
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'pre_seed': return 'Pré-Seed';
      case 'seed': return 'Seed';
      case 'series_a': return 'Série A';
      case 'series_b': return 'Série B';
      case 'bridge': return 'Bridge';
      default: return stage;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'pre_seed': return 'bg-purple-100 text-purple-800';
      case 'seed': return 'bg-green-100 text-green-800';
      case 'series_a': return 'bg-blue-100 text-blue-800';
      case 'series_b': return 'bg-indigo-100 text-indigo-800';
      case 'bridge': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      name: 'Projets Explorés',
      value: projects.length,
      icon: Search,
      color: 'bg-blue-500',
      href: '/projects'
    },
    {
      name: 'Opportunités Actives',
      value: opportunities.length,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/investir'
    },
    {
      name: 'Mes Intérêts',
      value: interests.length,
      icon: Heart,
      color: 'bg-purple-500',
      href: '/dashboard/investment-interests'
    },
    {
      name: 'Projets Favoris',
      value: '0', // À implémenter
      icon: Eye,
      color: 'bg-indigo-500',
      href: '/dashboard/favorites'
    }
  ];

  const recentOpportunities = opportunities.slice(0, 3);

  // Vue complète des investissements avec filtres
  if (showFullInvestmentsView) {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour au Dashboard</span>
            </button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Opportunités d'Investissement</h1>
            <p className="text-gray-600">Découvrez toutes les levées de fonds disponibles</p>
          </div>
        </div>

        {/* Stats des investissements */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 mb-1">{allOpportunities.length}</div>
            <div className="text-sm text-gray-600">Opportunités Actives</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {allOpportunities.length > 0 
                ? `${(allOpportunities.reduce((sum, opp) => sum + opp.target_amount, 0) / 1000000).toFixed(1)}M`
                : '0M'
              }
            </div>
            <div className="text-sm text-gray-600">MAD Recherchés</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 mb-1">150+</div>
            <div className="text-sm text-gray-600">Investisseurs</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 mb-1">75%</div>
            <div className="text-sm text-gray-600">Taux de Financement</div>
          </div>
        </div>

        {/* Filtres pour les investissements */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtrer les Opportunités</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stade d'Investissement</label>
              <select 
                value={investmentFilters.investment_stage}
                onChange={(e) => setInvestmentFilters({...investmentFilters, investment_stage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les stades</option>
                <option value="pre_seed">Pré-Seed</option>
                <option value="seed">Seed</option>
                <option value="series_a">Série A</option>
                <option value="series_b">Série B</option>
                <option value="bridge">Bridge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant Min. (MAD)</label>
              <input 
                type="number"
                placeholder="0"
                value={investmentFilters.min_amount}
                onChange={(e) => setInvestmentFilters({...investmentFilters, min_amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant Max. (MAD)</label>
              <input 
                type="number"
                placeholder="∞"
                value={investmentFilters.max_amount}
                onChange={(e) => setInvestmentFilters({...investmentFilters, max_amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select 
                value={investmentFilters.status}
                onChange={(e) => setInvestmentFilters({...investmentFilters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Actif</option>
                <option value="completed">Terminé</option>
                <option value="pending">En attente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Résumé des résultats */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {allOpportunitiesLoading ? 'Chargement...' : `${allOpportunities.length} opportunité(s) d'investissement trouvée(s)`}
          </p>
        </div>

        {/* Grille des opportunités d'investissement */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {allOpportunitiesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl shadow-sm overflow-hidden animate-pulse">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allOpportunities.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune opportunité disponible
                </h3>
                <p className="text-gray-600 mb-6">
                  Revenez bientôt pour découvrir de nouvelles opportunités d'investissement.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allOpportunities.map((opportunity, index) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex-1">
                          Opportunité #{opportunity.id.slice(0, 8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(opportunity.investment_stage)}`}>
                          {getStageLabel(opportunity.investment_stage)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {opportunity.description_for_investors}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Montant recherché</span>
                          <span className="font-semibold text-blue-600">
                            {formatAmount(opportunity.target_amount)}
                          </span>
                        </div>
                        
                        {opportunity.equity_offered && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Capital offert</span>
                            <span className="font-semibold text-green-600">
                              {opportunity.equity_offered}%
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Investissement min.</span>
                          <span className="font-semibold text-gray-900">
                            {formatAmount(opportunity.minimum_investment)}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          to={`/investir/${opportunity.id}`}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                        >
                          <PieChart className="h-4 w-4 inline mr-2" />
                          Investir
                        </Link>
                        {opportunity.pitch_deck_url && (
                          <a
                            href={opportunity.pitch_deck_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vue complète des projets avec filtres
  if (showFullProjectsView) {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour au Dashboard</span>
            </button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Explorer les Projets Digitaux</h1>
            <p className="text-gray-600">Découvrez tous les projets disponibles</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtrer les Projets</h2>
          </div>
          <ProjectFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Résumé des résultats */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {allProjectsLoading ? 'Chargement...' : `${allDigitalProjects.length} projet(s) digital(s) trouvé(s)`}
          </p>
          
          {search && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Search className="h-4 w-4" />
              <span>Recherche: "{search}"</span>
            </div>
          )}
        </div>

        {/* Grille des projets */}
        <ProjectGrid
          projects={allDigitalProjects}
          loading={allProjectsLoading}
          emptyMessage={
            search 
              ? `Aucun projet digital trouvé pour "${search}"`
              : 'Aucun projet digital disponible pour le moment'
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Investisseur</h1>
          <p className="text-gray-600">Découvrez et investissez dans les meilleurs projets</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleShowFullProjects}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Explorer Projets</span>
          </button>
          <button
            onClick={handleShowFullInvestments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Voir Investissements</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              to={stat.href}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleShowFullProjects}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <PieChart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Projets Digitaux</div>
              <div className="text-sm text-gray-600">MVPs, Startups, Sites</div>
            </div>
          </button>
          
          <Link
            to="/projets-reels"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Projets Réels</div>
              <div className="text-sm text-gray-600">Immobilier, Commerce</div>
            </div>
          </Link>
          
          <button
            onClick={handleShowFullInvestments}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Levées de Fonds</div>
              <div className="text-sm text-gray-600">Investissements</div>
            </div>
          </button>
          
          <Link
            to="/dashboard/investment-interests"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Target className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Mes Intérêts</div>
              <div className="text-sm text-gray-600">Suivi investissements</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Explorer les Projets Digitaux - Section Intégrée */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💻</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Explorer les Projets Digitaux</h2>
                <p className="text-sm text-gray-600">Startups, MVPs, applications et plateformes SaaS</p>
              </div>
            </div>
            <button
              onClick={handleShowFullProjects}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Voir tous</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {digitalProjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                    </div>
                    <div className="flex space-x-2 mb-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-14"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-10 bg-gray-200 rounded flex-1"></div>
                      <div className="h-10 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : digitalProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {digitalProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProjectCard project={project} index={index} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun projet digital disponible
              </h3>
              <p className="text-gray-600 mb-4">
                Revenez plus tard pour découvrir de nouveaux projets digitaux.
              </p>
              <button
                onClick={handleShowFullProjects}
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                Explorer tous les projets
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Investment Opportunities */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Opportunités d'Investissement</h2>
            <button
              onClick={handleShowFullInvestments}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Voir toutes</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {recentOpportunities.length > 0 ? (
            <div className="space-y-4">
              {recentOpportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Levée de {opportunity.target_amount.toLocaleString()} MAD
                    </h3>
                    <p className="text-sm text-gray-600">
                      Stade: {getStageLabel(opportunity.investment_stage)} • 
                      Min: {opportunity.minimum_investment.toLocaleString()} MAD
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      opportunity.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {opportunity.status}
                    </span>
                    <Link
                      to={`/investir/${opportunity.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Voir détails
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune opportunité d'investissement disponible</p>
              <button
                onClick={handleShowFullInvestments}
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                Explorer les investissements
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;