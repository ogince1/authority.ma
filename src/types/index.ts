// Types pour la plateforme de vente de liens au Maroc

// Types de sites web - Nouvelle catégorisation
export type WebsiteCategory = 
  | 'adults_only'
  | 'arts_entertainment'
  | 'auto_vehicles'
  | 'beauty_fashion_lifestyle'
  | 'business_consumer_services'
  | 'community_society'
  | 'computers_technology'
  | 'finance_economy'
  | 'food_drink'
  | 'gambling'
  | 'games'
  | 'health_wellness'
  | 'heavy_industry_engineering'
  | 'hobbies_leisure'
  | 'home_garden'
  | 'jobs_career'
  | 'law_government'
  | 'news_media'
  | 'pets_animals'
  | 'reference_education'
  | 'science_nature'
  | 'science_education'
  | 'shopping_deals'
  | 'sports_fitness'
  | 'travel_tourism'
  | 'various'
  | 'world_regional';

// Types de liens
export type LinkType = 'dofollow' | 'nofollow' | 'sponsored' | 'ugc';

// Types de positionnement
export type LinkPosition = 'header' | 'footer' | 'sidebar' | 'content' | 'menu' | 'popup';

// Types de niches
export type WebsiteNiche = 'immobilier' | 'sante' | 'beaute' | 'mode' | 'tech' | 'finance' | 'education' | 'voyage' | 'cuisine' | 'sport' | 'automobile' | 'lifestyle' | 'business' | 'actualites' | 'culture' | 'politique' | 'economie' | 'art' | 'musique' | 'cinema';

// Statut du propriétaire du site (supprimé du formulaire)
// export type OwnerStatus = 'professionnel' | 'particulier' | 'entreprise' | 'agence';

// Interface pour les métriques du site
export interface WebsiteMetrics {
  monthly_traffic?: number; // Trafic mensuel
  domain_authority?: number; // Trust Flow (0-100) - renommé pour correspondre au formulaire
  organic_keywords?: number; // Mots-clés organiques
}

// Interface pour un site web (éditeur)
export interface Website {
  id: string;
  title: string;
  description: string;
  url: string;
  category: WebsiteCategory;
  // Métriques du site
  metrics?: WebsiteMetrics;
  
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
  languages: string[]; // Langues du site
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
  
  // Statut
  status: 'active' | 'sold' | 'pending' | 'inactive';
  
  // Informations de création
  user_id?: string;
  created_at: string;
  updated_at: string;
  
  // Images
  images: string[];
  
  // Tags
  tags: string[];
}

// Interface pour une demande d'achat de lien
export interface LinkPurchaseRequest {
  id: string;
  link_listing_id: string;
  user_id: string; // ID de l'annonceur
  publisher_id: string; // ID de l'éditeur
  
  // Détails de la demande
  target_url: string;
  anchor_text: string;
  message?: string;
  
  // Contenu personnalisé
  custom_content?: string;
  content_option?: 'platform' | 'custom';
  
  // Champs pour la rédaction d'articles par la plateforme
  article_content?: string;
  article_title?: string;
  article_keywords?: string[];
  writer_name?: string;
  
  // Prix et conditions
  proposed_price: number;
  proposed_duration: number; // Durée en mois
  
  // Statut
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'pending_confirmation' | 'confirmed' | 'auto_confirmed';
  
  // Réponse de l'éditeur
  editor_response?: string;
  response_date?: string;
  
  // Informations de placement (quand acceptée)
  placed_url?: string;
  placed_at?: string;
  
  // Nouveaux champs pour le workflow
  accepted_at?: string;
  confirmation_deadline?: string;
  confirmed_at?: string;
  auto_confirmed_at?: string;
  payment_transaction_id?: string;
  
  // Informations de création
  created_at: string;
  updated_at: string;
  
  // Relations (pour les jointures)
  link_listing?: LinkListing;
  advertiser?: User; // Alias pour user_id
  publisher?: User;
  campaign?: Campaign;
}

export interface LinkPurchaseTransaction {
  id: string;
  purchase_request_id: string;
  advertiser_id: string;
  publisher_id: string;
  link_listing_id: string;
  
  // Détails financiers
  amount: number;
  currency: 'MAD' | 'EUR' | 'USD';
  platform_fee: number;
  publisher_amount: number;
  
  // Statut
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Informations de paiement
  payment_method?: string;
  payment_reference?: string;
  
  // Informations de création
  created_at: string;
  completed_at?: string;
  
  // Métadonnées
  metadata?: Record<string, any>;
  
  // Relations
  purchase_request?: LinkPurchaseRequest;
  advertiser?: User;
  publisher?: User;
  link_listing?: LinkListing;
}

// Interface pour un utilisateur
export type UserRole = 'advertiser' | 'publisher' | 'admin';

// Interfaces pour les services
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  minimum_quantity?: number;
  features: string[];
  status: 'available' | 'unavailable';
  category: string;
  estimated_delivery_days: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  service_id: string;
  user_id: string; // ID de l'annonceur
  quantity: number;
  total_price: number;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  client_notes?: string;
  placement_details?: string; // Détails du placement fournis par le client
  execution_notes?: string; // Notes d'exécution par l'admin
  result_report?: string; // Rapport final avec liens créés
  result_links?: string[]; // Liens créés par la plateforme
  article_content?: string; // Contenu de l'article rédigé par la plateforme
  article_title?: string; // Titre de l'article rédigé
  article_keywords?: string[]; // Mots-clés ciblés dans l'article
  writer_name?: string; // Nom du rédacteur (admin)
  created_at: string;
  updated_at: string;
  completed_at?: string;
  service?: Service;
  user?: User;
}

export interface ServiceCartItem {
  service_id: string;
  quantity: number;
  service?: Service;
}

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
  
  // Système de crédit/solde
  balance: number; // Solde en dirhams (MAD)
  credit_limit?: number; // Limite de crédit
  
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
  // Nouveaux champs pour l'achat rapide
  new_article_price?: number;
  is_new_article?: boolean;
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

// Interface pour les transactions de crédit
export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'commission';
  amount: number;
  currency: 'MAD';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  
  // Contexte de la transaction
  related_transaction_id?: string;
  related_link_listing_id?: string;
  related_purchase_request_id?: string;
  
  // Méthode de paiement (pour les dépôts)
  payment_method?: 'bank_transfer' | 'paypal' | 'stripe' | 'manual';
  payment_reference?: string;
  
  // Informations de création
  created_at: string;
  completed_at?: string;
  
  // Solde avant et après
  balance_before: number;
  balance_after: number;
}

// Interface pour créer une transaction de crédit
export interface CreateCreditTransactionData {
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'commission';
  amount: number;
  description: string;
  payment_method?: 'bank_transfer' | 'paypal' | 'stripe' | 'manual';
  payment_reference?: string;
  related_transaction_id?: string;
  related_link_listing_id?: string;
  related_purchase_request_id?: string;
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
  client_name: string;
  client_website: string;
  results_summary: string;
  metrics: Record<string, any>;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Interface pour créer une histoire de succès
export interface CreateSuccessStoryData {
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
  client_name: string;
  client_website: string;
  results_summary: string;
  metrics: Record<string, any>;
}

// ===== NOUVEAUX TYPES POUR LE SYSTÈME DE CAMPAGNES =====

// Métriques SEO avancées
export interface AdvancedSEOMetrics {
  dr?: number; // Domain Rating (Ahrefs)
  tf?: number; // Trust Flow (Majestic)
  cf?: number; // Citation Flow (Majestic)
  ttf?: number; // Topical Trust Flow
  ps?: number; // Proximité Sémantique (%)
  at?: number; // Authority Score
  pt?: number; // Page Trust
  radius?: number; // Radius thématique
  focus?: number; // Focus score (spécialisation)
  age?: number; // Âge du domaine/article (mois)
  outlinks?: number; // Nombre de liens sortants
  importance?: number; // Importance Google
}

// ===== SYSTÈME DE MESSAGERIE =====

export interface Conversation {
  id: string;
  purchase_request_id: string;
  advertiser_id: string;
  publisher_id: string;
  subject?: string;
  last_message_at: string;
  is_active: boolean;
  unread_count_advertiser: number;
  unread_count_publisher: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  purchase_request?: LinkPurchaseRequest;
  advertiser?: User;
  publisher?: User;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'system' | 'notification' | 'file' | 'link';
  is_read: boolean;
  read_at?: string;
  attachments: any[];
  related_purchase_request_id?: string;
  created_at: string;
  
  // Relations
  sender?: User;
  receiver?: User;
}

export interface UserConversation {
  conversation_id: string;
  purchase_request_id: string;
  other_user_id: string;
  subject?: string;
  last_message_at: string;
  unread_count: number;
  anchor_text: string;
  target_url: string;
  purchase_status: string;
  last_message_content?: string;
}

export interface CreateMessageData {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: 'text' | 'system' | 'notification' | 'file' | 'link';
  attachments?: any[];
  related_purchase_request_id?: string;
}

// Interface pour les demandes de services
export interface ServiceRequest {
  id: string;
  user_id: string;
  service_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'in_progress';
  admin_notes?: string;
  placement_details?: string;
  execution_notes?: string;
  result_report?: string;
  result_links?: Array<{
    url: string;
    anchor_text: string;
    page_title: string;
    placement_type: 'header' | 'footer' | 'content' | 'sidebar';
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  service?: {
    id: string;
    name: string;
    price: number;
  };
}