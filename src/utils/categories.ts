import { ProjectCategory, RealProjectCategory, ProjectType, IndustrySector } from '../types';

// Configuration des catégories digitales
export const DIGITAL_CATEGORIES = {
  mvp: {
    label: 'MVP',
    description: 'Produit Minimum Viable prêt à être lancé',
    icon: '🚀',
    seoTitle: 'MVP à Vendre au Maroc - Produits Minimum Viable | GoHaya',
    seoDescription: 'Découvrez notre sélection de MVP (Produits Minimum Viable) à vendre au Maroc. Projets digitaux innovants et rentables à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Les MVP (Minimum Viable Products) sont des produits avec juste assez de fonctionnalités pour être utilisables par les premiers clients et fournir des commentaires pour le développement futur.'
  },
  startup: {
    label: 'Startup',
    description: 'Entreprise établie avec traction prouvée',
    icon: '🏢',
    seoTitle: 'Startups à Vendre au Maroc - Entreprises Digitales | GoHaya',
    seoDescription: 'Achetez des startups établies au Maroc. Entreprises digitales avec traction et revenus prouvés à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Startups établies avec une base de clients, des revenus réguliers et une équipe en place. Parfait pour les investisseurs cherchant des opportunités de croissance.'
  },
  website: {
    label: 'Site Web',
    description: 'Site web ou template prêt à l\'emploi',
    icon: '🌐',
    seoTitle: 'Sites Web à Vendre au Maroc - Templates et Sites Complets | GoHaya',
    seoDescription: 'Achetez des sites web complets, templates et solutions web prêtes à l\'emploi au Maroc. Projets web rentables à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Sites web complets, templates personnalisables et solutions web prêtes à être déployées pour votre business.'
  },
  site_web_actif: {
    label: 'Site Web Actif',
    description: 'Site web avec trafic et revenus existants',
    icon: '📈',
    seoTitle: 'Sites Web Actifs à Vendre au Maroc - Trafic et Revenus Garantis | GoHaya',
    seoDescription: 'Achetez des sites web actifs avec trafic établi et revenus prouvés au Maroc. Investissement digital rentable à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Sites web avec trafic établi, revenus récurrents et audience engagée. Idéal pour un investissement digital immédiat.'
  },
  domaine_site_trafic: {
    label: 'Domaine + Site + Trafic',
    description: 'Package complet domaine, site et trafic',
    icon: '🔗',
    seoTitle: 'Domaines avec Site et Trafic au Maroc - Package Complet | GoHaya',
    seoDescription: 'Achetez des domaines avec site web et trafic inclus au Maroc. Package complet pour démarrer votre business digital à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Package complet incluant domaine premium, site web développé et trafic qualifié. Solution clé en main pour entrepreneurs.'
  },
  startup_tech: {
    label: 'Startup Tech',
    description: 'Startup technologique innovante',
    icon: '💻',
    seoTitle: 'Startups Tech à Vendre au Maroc - Technologies Innovantes | GoHaya',
    seoDescription: 'Découvrez des startups technologiques innovantes à vendre au Maroc. IA, blockchain, IoT et autres technologies émergentes à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Startups spécialisées dans les technologies émergentes comme l\'IA, blockchain, IoT, et autres innovations technologiques.'
  },
  application_mobile: {
    label: 'Application Mobile',
    description: 'Application mobile iOS/Android développée',
    icon: '📱',
    seoTitle: 'Applications Mobiles à Vendre au Maroc - iOS et Android | GoHaya',
    seoDescription: 'Achetez des applications mobiles développées pour iOS et Android au Maroc. Apps rentables avec base utilisateurs à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Applications mobiles complètes pour iOS et Android avec base d\'utilisateurs, revenus et potentiel de croissance.'
  },
  plateforme_saas: {
    label: 'Plateforme SaaS',
    description: 'Solution SaaS avec abonnements récurrents',
    icon: '☁️',
    seoTitle: 'Plateformes SaaS à Vendre au Maroc - Solutions Cloud Rentables | GoHaya',
    seoDescription: 'Investissez dans des plateformes SaaS avec revenus récurrents au Maroc. Solutions cloud B2B et B2C à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Plateformes SaaS avec modèle d\'abonnement récurrent, base de clients fidèles et revenus prévisibles.'
  }
} as const;

// Configuration des catégories réelles
export const REAL_CATEGORIES = {
  fonds_commerce: {
    label: 'Fonds de Commerce',
    description: 'Commerce établi avec clientèle et emplacement',
    icon: '🏪',
    seoTitle: 'Fonds de Commerce à Vendre au Maroc - Commerces Établis | GoHaya',
    seoDescription: 'Achetez des fonds de commerce établis au Maroc. Commerces avec clientèle fidèle et emplacement stratégique à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Fonds de commerce avec clientèle établie, emplacement premium et historique de rentabilité prouvé.'
  },
  local_commercial: {
    label: 'Local Commercial',
    description: 'Espace commercial équipé et situé',
    icon: '🏢',
    seoTitle: 'Locaux Commerciaux à Vendre au Maroc - Espaces Commerciaux | GoHaya',
    seoDescription: 'Trouvez des locaux commerciaux à vendre dans les meilleures zones du Maroc. Espaces équipés et rentables à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Locaux commerciaux équipés dans des emplacements stratégiques, prêts pour votre activité commerciale.'
  },
  projet_industriel: {
    label: 'Projet Industriel',
    description: 'Unité industrielle ou projet de production',
    icon: '🏭',
    seoTitle: 'Projets Industriels à Vendre au Maroc - Unités de Production | GoHaya',
    seoDescription: 'Investissez dans des projets industriels au Maroc. Unités de production, usines et projets manufacturiers à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets industriels incluant unités de production, usines équipées et projets manufacturiers rentables.'
  },
  franchise: {
    label: 'Franchise',
    description: 'Franchise établie avec concept éprouvé',
    icon: '🔗',
    seoTitle: 'Franchises à Vendre au Maroc - Concepts Éprouvés | GoHaya',
    seoDescription: 'Achetez des franchises établies au Maroc. Concepts éprouvés avec support et formation inclus à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Franchises avec concept éprouvé, support du franchiseur et formation complète pour les nouveaux propriétaires.'
  },
  restaurant_luxe: {
    label: 'Restaurant de Luxe',
    description: 'Restaurant haut de gamme établi',
    icon: '🍽️',
    seoTitle: 'Restaurants de Luxe à Vendre au Maroc - Gastronomie Haut de Gamme | GoHaya',
    seoDescription: 'Achetez des restaurants de luxe au Maroc. Établissements haut de gamme avec clientèle fidèle à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Restaurants de luxe avec réputation établie, clientèle fidèle et emplacement premium dans les meilleures zones.'
  },
  salon_luxe: {
    label: 'Salon de Luxe',
    description: 'Salon de beauté ou spa haut de gamme',
    icon: '💅',
    seoTitle: 'Salons de Luxe à Vendre au Maroc - Beauté et Bien-être | GoHaya',
    seoDescription: 'Investissez dans des salons de beauté et spas de luxe au Maroc. Établissements haut de gamme rentables à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Salons de beauté et spas de luxe avec équipements haut de gamme, clientèle fidèle et services premium.'
  },
  immobilier: {
    label: 'Immobilier',
    description: 'Projets immobiliers et biens d\'investissement',
    icon: '🏘️',
    seoTitle: 'Projets Immobiliers à Vendre au Maroc - Investissement Immobilier | GoHaya',
    seoDescription: 'Découvrez des projets immobiliers d\'investissement au Maroc. Biens rentables et opportunités immobilières à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets immobiliers d\'investissement incluant résidences, commerces et biens locatifs rentables.'
  },
  hotellerie: {
    label: 'Hôtellerie',
    description: 'Hôtels, riads et établissements touristiques',
    icon: '🏨',
    seoTitle: 'Hôtels et Riads à Vendre au Maroc - Secteur Touristique | GoHaya',
    seoDescription: 'Achetez des hôtels, riads et établissements touristiques au Maroc. Investissement dans le tourisme à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Établissements hôteliers incluant hôtels, riads, maisons d\'hôtes et autres structures touristiques rentables.'
  },
  industrie: {
    label: 'Industrie',
    description: 'Projets industriels et manufacturiers',
    icon: '⚙️',
    seoTitle: 'Projets Industriels à Vendre au Maroc - Manufacturing | GoHaya',
    seoDescription: 'Investissez dans l\'industrie au Maroc. Projets manufacturiers et industriels rentables à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets industriels diversifiés incluant manufacturing, transformation et production industrielle.'
  },
  agriculture: {
    label: 'Agriculture',
    description: 'Projets agricoles et agro-alimentaires',
    icon: '🌾',
    seoTitle: 'Projets Agricoles à Vendre au Maroc - Agro-business | GoHaya',
    seoDescription: 'Découvrez des projets agricoles et agro-alimentaires au Maroc. Investissement dans l\'agriculture moderne à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets agricoles modernes incluant cultures, élevage et transformation agro-alimentaire.'
  },
  energie: {
    label: 'Énergie',
    description: 'Projets énergétiques et renouvelables',
    icon: '⚡',
    seoTitle: 'Projets Énergétiques à Vendre au Maroc - Énergies Renouvelables | GoHaya',
    seoDescription: 'Investissez dans les énergies renouvelables au Maroc. Projets solaires, éoliens et énergétiques à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets énergétiques incluant solaire, éolien et autres sources d\'énergie renouvelable rentables.'
  },
  logistique: {
    label: 'Logistique',
    description: 'Projets de transport et logistique',
    icon: '🚚',
    seoTitle: 'Projets Logistiques à Vendre au Maroc - Transport et Distribution | GoHaya',
    seoDescription: 'Achetez des projets logistiques au Maroc. Transport, distribution et solutions logistiques à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets logistiques incluant transport, distribution, entreposage et solutions logistiques intégrées.'
  },
  mines: {
    label: 'Mines',
    description: 'Projets miniers et ressources naturelles',
    icon: '⛏️',
    seoTitle: 'Projets Miniers à Vendre au Maroc - Ressources Naturelles | GoHaya',
    seoDescription: 'Investissez dans les mines et ressources naturelles au Maroc. Projets miniers rentables à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Projets miniers incluant extraction, transformation et exploitation de ressources naturelles.'
  },
  art: {
    label: 'Art et Collections',
    description: 'Collections d\'art et objets de valeur',
    icon: '🎨',
    seoTitle: 'Collections d\'Art à Vendre au Maroc - Objets de Valeur | GoHaya',
    seoDescription: 'Achetez des collections d\'art et objets de valeur au Maroc. Investissement dans l\'art et antiquités à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Collections d\'art, antiquités et objets de valeur pour investisseurs et collectionneurs.'
  },
  commerce: {
    label: 'Commerce',
    description: 'Commerces et activités commerciales',
    icon: '🛒',
    seoTitle: 'Commerces à Vendre au Maroc - Activités Commerciales | GoHaya',
    seoDescription: 'Trouvez des commerces à vendre au Maroc. Activités commerciales rentables et établies à Casablanca, Rabat, Marrakech, Tanger.',
    longDescription: 'Commerces établis incluant retail, distribution et autres activités commerciales rentables.'
  }
} as const;

// Configuration des secteurs d'activité
export const INDUSTRY_SECTORS = {
  immobilier: { label: 'Immobilier', icon: '🏘️' },
  artisanat: { label: 'Artisanat', icon: '🎨' },
  services: { label: 'Services', icon: '🛠️' },
  'e-commerce': { label: 'E-commerce', icon: '🛒' },
  technologie: { label: 'Technologie', icon: '💻' },
  sante: { label: 'Santé', icon: '🏥' },
  education: { label: 'Éducation', icon: '📚' },
  finance: { label: 'Finance', icon: '💰' },
  tourisme: { label: 'Tourisme', icon: '✈️' },
  agriculture: { label: 'Agriculture', icon: '🌾' },
  industrie: { label: 'Industrie', icon: '⚙️' },
  energie: { label: 'Énergie', icon: '⚡' },
  logistique: { label: 'Logistique', icon: '🚚' },
  art: { label: 'Art', icon: '🎨' },
  franchise: { label: 'Franchise', icon: '🔗' },
  hotellerie: { label: 'Hôtellerie', icon: '🏨' },
  commerce: { label: 'Commerce', icon: '🛒' },
  marketing: { label: 'Marketing', icon: '📢' },
  conseil: { label: 'Conseil', icon: '💡' },
  transport: { label: 'Transport', icon: '🚗' }
} as const;

// Fonctions utilitaires
export const getDigitalCategoryInfo = (category: ProjectCategory) => {
  return DIGITAL_CATEGORIES[category] || {
    label: category,
    description: 'Catégorie de projet digital',
    icon: '💻',
    seoTitle: `${category} à Vendre au Maroc | GoHaya`,
    seoDescription: `Découvrez des projets ${category} à vendre au Maroc. Disponible à Casablanca, Rabat, Marrakech, Tanger.`,
    longDescription: `Projets ${category} disponibles sur notre marketplace.`
  };
};

export const getRealCategoryInfo = (category: RealProjectCategory) => {
  return REAL_CATEGORIES[category] || {
    label: category,
    description: 'Catégorie de projet réel',
    icon: '🏢',
    seoTitle: `${category} à Vendre au Maroc | GoHaya`,
    seoDescription: `Découvrez des projets ${category} à vendre au Maroc. Disponible à Casablanca, Rabat, Marrakech, Tanger.`,
    longDescription: `Projets ${category} disponibles sur notre marketplace.`
  };
};

export const getIndustrySectorInfo = (sector: IndustrySector) => {
  return INDUSTRY_SECTORS[sector] || {
    label: sector,
    icon: '🏢'
  };
};

export const getAllDigitalCategories = () => {
  return Object.keys(DIGITAL_CATEGORIES) as ProjectCategory[];
};

export const getAllRealCategories = () => {
  return Object.keys(REAL_CATEGORIES) as RealProjectCategory[];
};

export const getAllIndustrySectors = () => {
  return Object.keys(INDUSTRY_SECTORS) as IndustrySector[];
};

// Fonction pour déterminer le type de projet basé sur la catégorie
export const getProjectTypeFromCategory = (category: ProjectCategory): ProjectType => {
  const digitalCategories = Object.keys(DIGITAL_CATEGORIES);
  return digitalCategories.includes(category) ? 'digital' : 'real';
};

// Fonction pour générer l'URL SEO d'une catégorie
export const getCategoryUrl = (category: ProjectCategory | RealProjectCategory, type: ProjectType) => {
  const baseUrl = type === 'digital' ? '/projets-digitaux' : '/projets-reels';
  return `${baseUrl}/${category}`;
};

// Fonction pour obtenir toutes les catégories avec leurs informations
export const getAllCategoriesWithInfo = () => {
  const digitalCategories = Object.entries(DIGITAL_CATEGORIES).map(([key, info]) => ({
    key: key as ProjectCategory,
    type: 'digital' as ProjectType,
    ...info
  }));

  const realCategories = Object.entries(REAL_CATEGORIES).map(([key, info]) => ({
    key: key as RealProjectCategory,
    type: 'real' as ProjectType,
    ...info
  }));

  return [...digitalCategories, ...realCategories];
};