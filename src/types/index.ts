// Types pour la plateforme de vente de liens au Maroc

// Types de sites web
export type WebsiteCategory = 'blog' | 'ecommerce' | 'actualites' | 'lifestyle' | 'tech' | 'business' | 'sante' | 'education' | 'immobilier' | 'automobile' | 'voyage' | 'cuisine' | 'sport' | 'culture' | 'politique' | 'economie';

// Types de liens
export type LinkType = 'dofollow' | 'nofollow' | 'sponsored' | 'ugc';

// Types de positionnement
export type LinkPosition = 'header' | 'footer' | 'sidebar' | 'content' | 'menu' | 'popup';

// Types de niches
export type WebsiteNiche = 'immobilier' | 'sante' | 'beaute' | 'mode' | 'tech' | 'finance' | 'education' | 'voyage' | 'cuisine' | 'sport' | 'automobile' | 'lifestyle' | 'business' | 'actualites' | 'culture' | 'politique' | 'economie' | 'art' | 'musique' | 'cinema';

// Statut du propriétaire du site
export type OwnerStatus = 'professionnel' | 'particulier' | 'entreprise' | 'agence';

// Interface pour les métriques du site
export interface WebsiteMetrics {
  monthly_traffic?: number; // Trafic mensuel
  domain_authority?: number; // Autorité du domaine (0-100)
  page_authority?: number; // Autorité de la page (0-100)
  backlinks_count?: number; // Nombre de backlinks
  organic_keywords?: number; // Mots-clés organiques
  alexa_rank?: number; // Classement Alexa
  google_indexed_pages?: number; // Pages indexées par Google
  social_media_followers?: Record<string, number>; // Followers réseaux sociaux
}

// Interface pour un site web (éditeur)
export interface Website {
  id: string;
  title: string;
  description: string;
  url: string;
  category: WebsiteCategory;
  niche: WebsiteNiche;
  owner_status: OwnerStatus;
  
  // Métriques du site
  metrics?: WebsiteMetrics;
  
  // Informations de contact
  contact_info: {
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
  };
  
  // Images et médias
  logo?: string;
  screenshots: string[];
  
  // Informations SEO
  meta_title?: string;
  meta_description?: string;
  slug: string;
  
  // Statut
  status: 'active' | 'inactive' | 'pending_approval' | 'suspended';
  
  // Informations de création
  user_id?: string;
  created_at: string;
  updated_at: string;
  
  // Champs spécifiques aux liens
  available_link_spots: number; // Nombre d'emplacements disponibles
  average_response_time?: number; // Temps de réponse moyen en heures
  payment_methods: string[]; // Méthodes de paiement acceptées
  languages: string[]; // Langues du site
  content_quality: 'excellent' | 'good' | 'average' | 'poor'; // Qualité du contenu
}

// Interface pour une annonce de lien
export interface LinkListing {
  id: string;
  website_id: string;
  title: string;
  description: string;
  target_url: string; // URL où le lien sera placé
  anchor_text: string; // Texte d'ancrage souhaité
  
  // Type et position du lien
  link_type: LinkType;
  position: LinkPosition;
  
  // Prix et conditions
  price: number; // Prix en MAD
  currency: 'MAD' | 'EUR' | 'USD';
  minimum_contract_duration: number; // Durée minimale en mois
  max_links_per_page?: number; // Nombre max de liens par page
  
  // Restrictions et conditions
  allowed_niches: WebsiteNiche[]; // Niches autorisées
  forbidden_keywords: string[]; // Mots-clés interdits
  content_requirements?: string; // Exigences de contenu
  
  // Statut
  status: 'active' | 'sold' | 'pending' | 'inactive';
  
  // Informations de création
  user_id?: string;
  created_at: string;
  updated_at: string;
  
  // Métadonnées
  meta_title?: string;
  meta_description?: string;
  slug: string;
  
  // Images
  images: string[];
  
  // Tags
  tags: string[];
}

// Interface pour une demande d'achat de lien
export interface LinkPurchaseRequest {
  id: string;
  link_listing_id: string;
  advertiser_name: string;
  advertiser_email: string;
  advertiser_phone?: string;
  advertiser_website?: string;
  
  // Détails de la demande
  proposed_anchor_text: string;
  target_url: string;
  message?: string;
  
  // Conditions proposées
  proposed_price?: number; // Si l'annonceur veut négocier
  proposed_duration: number; // Durée souhaitée en mois
  
  // Statut
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  
  // Informations de création
  created_at: string;
  updated_at: string;
  
  // Réponse de l'éditeur
  editor_response?: string;
  response_date?: string;
}

// Interface pour un utilisateur
export type UserRole = 'advertiser' | 'publisher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  website?: string;
  bio?: string;
  company_name?: string;
  company_size?: 'startup' | 'sme' | 'large' | 'agency';
  location?: string;
  created_at: string;
  updated_at: string;
  
  // Informations spécifiques aux annonceurs
  advertiser_info?: {
    industry: string;
    target_markets: string[];
    budget_range: 'low' | 'medium' | 'high' | 'enterprise';
    preferred_link_types: LinkType[];
  };
  
  // Informations spécifiques aux éditeurs
  publisher_info?: {
    total_websites: number;
    average_traffic: number;
    preferred_payment_methods: string[];
    response_time_hours: number;
  };
}

// Interface pour créer un site web
export interface CreateWebsiteData {
  title: string;
  description: string;
  url: string;
  category: WebsiteCategory;
  niche: WebsiteNiche;
  owner_status: OwnerStatus;
  metrics?: WebsiteMetrics;
  contact_info: {
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
  };
  logo?: string;
  screenshots: string[];
  meta_title?: string;
  meta_description?: string;
  slug: string;
  available_link_spots: number;
  average_response_time?: number;
  payment_methods: string[];
  languages: string[];
  content_quality: 'excellent' | 'good' | 'average' | 'poor';
  user_id?: string;
}

// Interface pour créer une annonce de lien
export interface CreateLinkListingData {
  website_id: string;
  title: string;
  description: string;
  target_url: string;
  anchor_text: string;
  link_type: LinkType;
  position: LinkPosition;
  price: number;
  currency: 'MAD' | 'EUR' | 'USD';
  minimum_contract_duration: number;
  max_links_per_page?: number;
  allowed_niches: WebsiteNiche[];
  forbidden_keywords: string[];
  content_requirements?: string;
  status?: 'active' | 'pending' | 'inactive';
  user_id?: string;
  meta_title?: string;
  meta_description?: string;
  slug: string;
  images: string[];
  tags: string[];
}

// Interface pour créer une demande d'achat
export interface CreateLinkPurchaseData {
  link_listing_id: string;
  advertiser_name: string;
  advertiser_email: string;
  advertiser_phone?: string;
  advertiser_website?: string;
  proposed_anchor_text: string;
  target_url: string;
  message?: string;
  proposed_price?: number;
  proposed_duration: number;
}

// Interface pour les filtres de recherche
export interface WebsiteFilterOptions {
  category?: WebsiteCategory;
  niche?: WebsiteNiche;
  min_traffic?: number;
  max_traffic?: number;
  min_domain_authority?: number;
  max_domain_authority?: number;
  search?: string;
  languages?: string[];
  content_quality?: 'excellent' | 'good' | 'average' | 'poor';
  available_spots?: boolean;
  user_id?: string;
}

export interface LinkListingFilterOptions {
  website_category?: WebsiteCategory;
  website_niche?: WebsiteNiche;
  link_type?: LinkType;
  position?: LinkPosition;
  min_price?: number;
  max_price?: number;
  currency?: 'MAD' | 'EUR' | 'USD';
  min_domain_authority?: number;
  max_domain_authority?: number;
  search?: string;
  allowed_niches?: WebsiteNiche[];
  status?: 'active' | 'sold' | 'pending' | 'inactive';
  user_id?: string;
}

// Interface pour les statistiques
export interface PlatformStats {
  total_websites: number;
  total_link_listings: number;
  total_purchases: number;
  total_revenue: number;
  active_advertisers: number;
  active_publishers: number;
  average_link_price: number;
  success_rate: number; // Pourcentage de demandes acceptées
}

// Interface pour les transactions
export interface Transaction {
  id: string;
  purchase_request_id: string;
  amount: number;
  currency: 'MAD' | 'EUR' | 'USD';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  completed_at?: string;
  
  // Informations des parties
  advertiser_id: string;
  publisher_id: string;
  link_listing_id: string;
  
  // Commission de la plateforme
  platform_fee: number;
  publisher_amount: number;
}

// Interface pour les avis et évaluations
export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string; // ID de celui qui laisse l'avis
  reviewed_id: string; // ID de celui qui reçoit l'avis
  rating: number; // 1-5 étoiles
  comment?: string;
  created_at: string;
  
  // Type d'avis
  review_type: 'advertiser_to_publisher' | 'publisher_to_advertiser';
}

// Interface pour les notifications
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  
  // Lien vers l'action
  action_url?: string;
  action_type?: 'link_purchase' | 'website_approval' | 'payment' | 'review';
}

// Interface pour les messages entre utilisateurs
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
  
  // Contexte du message
  related_purchase_request_id?: string;
  related_website_id?: string;
}

// Interface pour les catégories de blog
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

// Interface pour les articles de blog
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

// Interface pour créer un article de blog
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
  author_id?: string;
}

// Interface pour les histoires de succès
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

// Interface pour créer une histoire de succès
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