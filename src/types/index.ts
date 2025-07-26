// Types pour les projets
export type ProjectCategory = 'mvp' | 'startup' | 'website' | 'site_web_actif' | 'domaine_site_trafic' | 'startup_tech' | 'application_mobile' | 'plateforme_saas';

export type RealProjectCategory = 'immobilier' | 'hotellerie' | 'industrie' | 'agriculture' | 'energie' | 'logistique' | 'mines' | 'art' | 'franchise' | 'fonds_commerce' | 'local_commercial' | 'projet_industriel' | 'restaurant_luxe' | 'salon_luxe' | 'commerce';

export type ProjectType = 'digital' | 'real';

export type IndustrySector = 'immobilier' | 'artisanat' | 'services' | 'e-commerce' | 'technologie' | 'sante' | 'education' | 'finance' | 'tourisme' | 'agriculture' | 'industrie' | 'energie' | 'logistique' | 'art' | 'franchise' | 'hotellerie' | 'commerce' | 'marketing' | 'conseil' | 'transport';

// Nouveau type pour l'objectif du projet
export type ProjectObjective = 'vente' | 'location' | 'levee_fonds';

// Nouveau type pour le statut du propriétaire
export type OwnerStatus = 'professionnel' | 'particulier' | 'entreprise';

// Interface pour les indicateurs de performance
export interface ProjectMetrics {
  monthly_traffic?: number; // Trafic mensuel (pour digital)
  leads_clients?: number; // Leads/clients existants
  revenue?: number; // Revenus (facultatif)
  material_condition?: string; // État du matériel/local
  additional_metrics?: Record<string, any>; // Métriques supplémentaires
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  project_type: ProjectType;
  real_category?: RealProjectCategory;
  industry_sector: IndustrySector;
  
  // Nouveau champ obligatoire : objectif
  objective: ProjectObjective;
  
  // Nouveau champ : statut du propriétaire
  owner_status: OwnerStatus;
  
  // Nouveau champ : indicateurs de performance
  metrics?: ProjectMetrics;
  
  price: number;
  images: string[];
  features: string[];
  tech_stack: string[];
  demo_url?: string;
  contact_info?: any;
  industry_tags: string[];
  status: 'active' | 'sold' | 'pending';
  meta_title?: string;
  meta_description?: string;
  slug: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  // Champs spécifiques aux projets réels
  is_real_project?: boolean;
  location?: string;
  property_details?: any;
  rental_option?: boolean;
  rental_price?: number;
  
  // Nouveau champ : prix à afficher ou pas (décision du client)
  show_price?: boolean;
}

export interface Proposal {
  id: string;
  project_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  proposed_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  website?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProposalData {
  project_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  proposed_price: number;
  message?: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  category: ProjectCategory;
  project_type: ProjectType;
  real_category?: RealProjectCategory;
  industry_sector: IndustrySector;
  
  // Nouveau champ obligatoire : objectif
  objective: ProjectObjective;
  
  // Nouveau champ : statut du propriétaire
  owner_status: OwnerStatus;
  
  // Nouveau champ : indicateurs de performance
  metrics?: ProjectMetrics;
  
  price: number;
  images: string[];
  features: string[];
  tech_stack: string[];
  demo_url?: string;
  industry_tags: string[];
  contact_info?: any;
  meta_title?: string;
  user_id?: string;
  meta_description?: string;
  slug: string;
  // Champs spécifiques aux projets réels
  is_real_project?: boolean;
  location?: string;
  property_details?: any;
  rental_option?: boolean;
  rental_price?: number;
  
  // Nouveau champ : prix à afficher ou pas (décision du client)
  show_price?: boolean;
}

export interface ProjectFilterOptions {
  category?: ProjectCategory;
  project_type?: ProjectType;
  real_category?: RealProjectCategory;
  industry_sector?: IndustrySector;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  industryTags?: string[];
  user_id?: string;
  location?: string;
  rental_option?: boolean;
}

export interface ProjectSubmission {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  project_type: ProjectType;
  real_category?: RealProjectCategory;
  industry_sector: IndustrySector;
  price: number;
  demo_url?: string;
  features: string[];
  tech_stack: string[];
  industry_tags: string[];
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_website?: string;
  additional_info?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  // Champs spécifiques aux projets réels
  is_real_project?: boolean;
  location?: string;
  property_details?: any;
  rental_option?: boolean;
  rental_price?: number;
}

export interface CreateProjectSubmissionData {
  title: string;
  description: string;
  category: ProjectCategory;
  project_type: ProjectType;
  real_category?: RealProjectCategory;
  industry_sector: IndustrySector;
  
  // Nouveau champ obligatoire : objectif
  objective: ProjectObjective;
  
  // Nouveau champ : statut du propriétaire
  owner_status: OwnerStatus;
  
  // Nouveau champ : indicateurs de performance
  metrics?: ProjectMetrics;
  
  price: number;
  demo_url?: string;
  features: string[];
  tech_stack: string[];
  industry_tags: string[];
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_website?: string;
  additional_info?: string;
  // Champs spécifiques aux projets réels
  is_real_project?: boolean;
  location?: string;
  property_details?: any;
  rental_option?: boolean;
  rental_price?: number;
  
  // Nouveau champ : prix à afficher ou pas (décision du client)
  show_price?: boolean;
}

export interface FundraisingOpportunity {
  id: string;
  project_id: string;
  target_amount: number;
  investment_stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'bridge';
  equity_offered?: number;
  pitch_deck_url?: string;
  financial_projections_url?: string;
  description_for_investors: string;
  minimum_investment: number;
  status: 'active' | 'funded' | 'closed' | 'paused';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentInterest {
  id: string;
  fundraising_id: string;
  investor_name: string;
  investor_email: string;
  investor_phone?: string;
  investment_amount: number;
  message?: string;
  status: 'pending' | 'contacted' | 'rejected';
  created_at: string;
}

export interface CreateInvestmentInterestData {
  fundraising_id: string;
  investor_name: string;
  investor_email: string;
  investor_phone?: string;
  investment_amount: number;
  message?: string;
}

export interface CreateFundraisingData {
  project_id: string;
  target_amount: number;
  investment_stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'bridge';
  equity_offered?: number;
  pitch_deck_url?: string;
  financial_projections_url?: string;
  description_for_investors: string;
  minimum_investment: number;
  status?: 'active' | 'funded' | 'closed' | 'paused';
  user_id?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  images: string[];
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  meta_title?: string;
  meta_description?: string;
  author_id: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  images: string[];
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  meta_title?: string;
  meta_description?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface SuccessStory {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  founder_name: string;
  founder_image?: string;
  company_logo?: string;
  industry: string;
  description: string;
  story_content: string;
  challenge?: string;
  solution?: string;
  results?: string;
  metrics: Record<string, any>;
  images: string[];
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSuccessStoryData {
  title: string;
  slug: string;
  company_name: string;
  founder_name: string;
  founder_image?: string;
  company_logo?: string;
  industry: string;
  description: string;
  story_content: string;
  challenge?: string;
  solution?: string;
  results?: string;
  metrics: Record<string, any>;
  images: string[];
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  meta_title?: string;
  meta_description?: string;
}