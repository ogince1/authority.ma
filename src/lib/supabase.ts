import { createClient } from '@supabase/supabase-js';
import { 
  BlogPost,
  CreateBlogPostData,
  BlogCategory,
  SuccessStory,
  CreateSuccessStoryData,
  UserRole,
  Website,
  CreateWebsiteData,
  WebsiteFilterOptions,
  LinkListing,
  CreateLinkListingData,
  LinkListingFilterOptions,
  LinkPurchaseRequest,
  CreateLinkPurchaseData,
  PlatformStats
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ===== AUTHENTIFICATION =====

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }

  // Vérifier le profil à la connexion
  if (data.user) {
    try {
      await ensureUserProfile(data.user.id);
    } catch (profileError) {
      console.error('Error ensuring user profile at login:', profileError);
    }
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name?: string, role: UserRole = 'advertiser') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
        role: role
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  console.log('User signup successful, profile will be created by trigger');
  return data;
};

// ===== GESTION DES UTILISATEURS =====

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - user doesn't exist
      return null;
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
};

export const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return await getUserProfile(user.id);
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    // Vérifier d'abord si l'utilisateur existe
    const existingProfile = await getUserProfile(userId);
    
    if (!existingProfile) {
      // Si l'utilisateur n'existe pas, le créer
      console.log('User profile not found, creating new profile...');
      return await ensureUserProfile(userId, profileData);
    }

    // Mettre à jour le profil existant
    const { data, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const isAdmin = async (): Promise<boolean> => {
  try {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const ensureUserProfile = async (userId: string, userData?: { name?: string; role?: UserRole }) => {
  try {
    const existingProfile = await getUserProfile(userId);
    if (existingProfile) {
      return existingProfile;
    }
  } catch (error) {
    // Profile doesn't exist, create it
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const profileData = {
    id: userId,
    name: userData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    email: user.email,
    role: userData?.role || user.user_metadata?.role || 'advertiser',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('users')
    .insert([profileData])
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
};

// ===== GESTION DES SITES WEB =====

export const getWebsites = async (filters?: WebsiteFilterOptions): Promise<Website[]> => {
  try {
    let query = supabase.from('websites').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.niche) {
      query = query.eq('niche', filters.niche);
    }
    if (filters?.min_traffic) {
      query = query.gte('metrics->monthly_traffic', filters.min_traffic);
    }
    if (filters?.max_traffic) {
      query = query.lte('metrics->monthly_traffic', filters.max_traffic);
    }
    if (filters?.min_domain_authority) {
      query = query.gte('metrics->domain_authority', filters.min_domain_authority);
    }
    if (filters?.max_domain_authority) {
      query = query.lte('metrics->domain_authority', filters.max_domain_authority);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.languages && filters.languages.length > 0) {
      query = query.overlaps('languages', filters.languages);
    }
    if (filters?.content_quality) {
      query = query.eq('content_quality', filters.content_quality);
    }
    if (filters?.available_spots) {
      query = query.gt('available_link_spots', 0);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching websites:', error);
    return [];
  }
};

export const getWebsiteBySlug = async (slug: string): Promise<Website | null> => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching website by slug:', error);
    throw error;
  }
};

export const getWebsiteById = async (id: string): Promise<Website | null> => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching website by id:', error);
    throw error;
  }
};

export const createWebsite = async (websiteData: CreateWebsiteData): Promise<Website> => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .insert([websiteData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating website:', error);
    throw error;
  }
};

export const updateWebsite = async (id: string, websiteData: Partial<CreateWebsiteData>): Promise<Website> => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .update(websiteData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating website:', error);
    throw error;
  }
};

export const deleteWebsite = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting website:', error);
    throw error;
  }
};

// ===== GESTION DES ANNONCES DE LIENS =====

export const getLinkListings = async (filters?: LinkListingFilterOptions): Promise<LinkListing[]> => {
  try {
    let query = supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `);

    if (filters?.website_category) {
      query = query.eq('website.category', filters.website_category);
    }
    if (filters?.website_niche) {
      query = query.eq('website.niche', filters.website_niche);
    }
    if (filters?.link_type) {
      query = query.eq('link_type', filters.link_type);
    }
    if (filters?.position) {
      query = query.eq('position', filters.position);
    }
    if (filters?.min_price) {
      query = query.gte('price', filters.min_price);
    }
    if (filters?.max_price) {
      query = query.lte('price', filters.max_price);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.min_domain_authority) {
      query = query.gte('website.metrics->domain_authority', filters.min_domain_authority);
    }
    if (filters?.max_domain_authority) {
      query = query.lte('website.metrics->domain_authority', filters.max_domain_authority);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.allowed_niches && filters.allowed_niches.length > 0) {
      query = query.overlaps('allowed_niches', filters.allowed_niches);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching link listings:', error);
    throw error;
  }
};

export const getLinkListingBySlug = async (slug: string): Promise<LinkListing | null> => {
  try {
    const { data, error } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching link listing by slug:', error);
    throw error;
  }
};

export const getLinkListingById = async (id: string): Promise<LinkListing | null> => {
  try {
    const { data, error } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching link listing by id:', error);
    throw error;
  }
};

export const createLinkListing = async (listingData: CreateLinkListingData): Promise<LinkListing> => {
  try {
    const { data, error } = await supabase
      .from('link_listings')
      .insert([listingData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating link listing:', error);
    throw error;
  }
};

export const updateLinkListing = async (id: string, listingData: Partial<CreateLinkListingData>): Promise<LinkListing> => {
  try {
    const { data, error } = await supabase
      .from('link_listings')
      .update(listingData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating link listing:', error);
    throw error;
  }
};

export const deleteLinkListing = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('link_listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting link listing:', error);
    throw error;
  }
};

// ===== GESTION DES DEMANDES D'ACHAT =====

export const createLinkPurchaseRequest = async (purchaseData: CreateLinkPurchaseData): Promise<LinkPurchaseRequest> => {
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .insert([{
        ...purchaseData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating link purchase request:', error);
    throw error;
  }
};

export const getLinkPurchaseRequests = async (filters?: { user_id?: string; link_listing_id?: string }): Promise<LinkPurchaseRequest[]> => {
  try {
    let query = supabase.from('link_purchase_requests').select('*');

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.link_listing_id) {
      query = query.eq('link_listing_id', filters.link_listing_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching link purchase requests:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching link purchase requests:', error);
    throw error;
  }
};

export const updateLinkPurchaseRequestStatus = async (
  id: string, 
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating',
  editorResponse?: string
): Promise<LinkPurchaseRequest> => {
  const updateData: any = { status };
  if (editorResponse) {
    updateData.editor_response = editorResponse;
    updateData.response_date = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('link_purchase_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .limit(1);

  if (error) {
    console.error('Error updating link purchase request status:', error);
    throw error;
  }

  return data[0];
};

// ===== STATISTIQUES DE LA PLATEFORME =====

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const [
    { count: totalWebsites },
    { count: totalLinkListings },
    { count: totalPurchases },
    { count: activeAdvertisers },
    { count: activePublishers }
  ] = await Promise.all([
    supabase.from('websites').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('link_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('link_purchase_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'advertiser'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'publisher')
  ]);

  // Calculer le prix moyen des liens
  const { data: priceData } = await supabase
    .from('link_listings')
    .select('price')
    .eq('status', 'active');

  const averageLinkPrice = priceData && priceData.length > 0 
    ? priceData.reduce((sum, item) => sum + item.price, 0) / priceData.length 
    : 0;

  // Calculer le taux de succès
  const { count: totalRequests } = await supabase
    .from('link_purchase_requests')
    .select('*', { count: 'exact', head: true });

  const successRate = totalRequests > 0 ? (totalPurchases / totalRequests) * 100 : 0;

  // Calculer le revenu total (approximatif)
  const { data: transactionData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', 'completed');

  const totalRevenue = transactionData 
    ? transactionData.reduce((sum, item) => sum + item.amount, 0) 
    : 0;

  return {
    total_websites: totalWebsites || 0,
    total_link_listings: totalLinkListings || 0,
    total_purchases: totalPurchases || 0,
    total_revenue: totalRevenue,
    active_advertisers: activeAdvertisers || 0,
    active_publishers: activePublishers || 0,
    average_link_price: averageLinkPrice,
    success_rate: successRate
  };
};

// ===== FONCTIONS POUR LES TRANSACTIONS =====

export const createTransaction = async (transactionData: {
  purchase_request_id: string;
  amount: number;
  currency: 'MAD' | 'EUR' | 'USD';
  payment_method: string;
  advertiser_id: string;
  publisher_id: string;
  link_listing_id: string;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        status: 'pending',
        platform_fee: transactionData.amount * 0.10, // 10% de commission
        publisher_amount: transactionData.amount * 0.90, // 90% pour l'éditeur
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getTransactions = async (filters?: {
  user_id?: string;
  status?: string;
  advertiser_id?: string;
  publisher_id?: string;
}): Promise<any[]> => {
  try {
    let query = supabase.from('transactions').select('*');

    if (filters?.user_id) {
      query = query.or(`advertiser_id.eq.${filters.user_id},publisher_id.eq.${filters.user_id}`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.advertiser_id) {
      query = query.eq('advertiser_id', filters.advertiser_id);
    }
    if (filters?.publisher_id) {
      query = query.eq('publisher_id', filters.publisher_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const updateTransactionStatus = async (
  id: string, 
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  completed_at?: string
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        completed_at: status === 'completed' ? (completed_at || new Date().toISOString()) : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// ===== FONCTIONS POUR LES NOTIFICATIONS =====

export const createNotification = async (notificationData: {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  action_type?: 'link_purchase' | 'website_approval' | 'payment' | 'review';
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notificationData,
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (userId: string, filters?: {
  read?: boolean;
  type?: string;
}): Promise<any[]> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (filters?.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// ===== FONCTIONS POUR LES MESSAGES =====

export const createMessage = async (messageData: {
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  related_purchase_request_id?: string;
  related_website_id?: string;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...messageData,
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

export const getMessages = async (userId: string, filters?: {
  conversation_with?: string;
  read?: boolean;
}): Promise<any[]> => {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (filters?.conversation_with) {
      query = query.or(`sender_id.eq.${filters.conversation_with},receiver_id.eq.${filters.conversation_with}`);
    }
    if (filters?.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const markMessageAsRead = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// ===== FONCTIONS POUR LES AVIS =====

export const createReview = async (reviewData: {
  transaction_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment?: string;
  review_type: 'advertiser_to_publisher' | 'publisher_to_advertiser';
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        ...reviewData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getReviews = async (filters?: {
  reviewed_id?: string;
  reviewer_id?: string;
  review_type?: string;
}): Promise<any[]> => {
  try {
    let query = supabase.from('reviews').select('*');

    if (filters?.reviewed_id) {
      query = query.eq('reviewed_id', filters.reviewed_id);
    }
    if (filters?.reviewer_id) {
      query = query.eq('reviewer_id', filters.reviewer_id);
    }
    if (filters?.review_type) {
      query = query.eq('review_type', filters.review_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

// ===== FONCTIONS UTILITAIRES =====

export const getUserStats = async (userId: string, role: UserRole): Promise<any> => {
  try {
    if (role === 'publisher') {
      const [
        { count: websites },
        { count: linkListings },
        { count: purchaseRequests },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('websites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('link_listings').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('link_purchase_requests').select('*', { count: 'exact', head: true }).eq('publisher_id', userId),
        supabase.from('transactions').select('publisher_amount').eq('publisher_id', userId).eq('status', 'completed')
      ]);

      const totalRevenue = transactions?.reduce((sum, t) => sum + t.publisher_amount, 0) || 0;

      return {
        websites: websites || 0,
        linkListings: linkListings || 0,
        purchaseRequests: purchaseRequests || 0,
        totalRevenue
      };
    } else if (role === 'advertiser') {
      const [
        { count: purchaseRequests },
        { count: activeLinks },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('link_purchase_requests').select('*', { count: 'exact', head: true }).eq('advertiser_id', userId),
        supabase.from('link_purchase_requests').select('*', { count: 'exact', head: true }).eq('advertiser_id', userId).eq('status', 'accepted'),
        supabase.from('transactions').select('amount').eq('advertiser_id', userId).eq('status', 'completed')
      ]);

      const totalSpent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      return {
        purchaseRequests: purchaseRequests || 0,
        activeLinks: activeLinks || 0,
        totalSpent
      };
    }

    return {};
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// ===== FONCTIONS POUR LE BLOG ET HISTOIRES DE SUCCÈS =====

export const getBlogPosts = async (filters?: { category?: string; status?: string; search?: string }): Promise<BlogPost[]> => {
  try {
    let query = supabase.from('blog_posts').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    throw error;
  }
};

export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching blog post by id:', error);
    throw error;
  }
};

export const getSuccessStories = async (filters?: { industry?: string; status?: string; search?: string }): Promise<SuccessStory[]> => {
  try {
    let query = supabase.from('success_stories').select('*');

    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching success stories:', error);
    throw error;
  }
};

export const getSuccessStoryBySlug = async (slug: string): Promise<SuccessStory | null> => {
  try {
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching success story by slug:', error);
    throw error;
  }
};

// ===== FONCTIONS POUR LES IMAGES =====

export const uploadImage = async (file: File, bucket: string = 'website-images'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadMultipleImages = async (files: FileList, bucket: string = 'website-images'): Promise<string[]> => {
  const uploadPromises = Array.from(files).map(file => uploadImage(file, bucket));
  return Promise.all(uploadPromises);
};

export const deleteImage = async (url: string, bucket: string = 'website-images'): Promise<void> => {
  try {
    const path = url.split('/').pop();
    if (!path) throw new Error('Invalid image URL');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}; 

export const deleteBlogPost = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
}; 

// ===== FONCTIONS MANQUANTES POUR LE BLOG ET SUCCESS STORIES =====

export const getBlogCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published');

    if (error) throw error;

    // Extraire les catégories uniques
    const categories = [...new Set(data?.map(post => post.category).filter(Boolean))];
    return categories;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }
};

export const getFeaturedSuccessStories = async (): Promise<SuccessStory[]> => {
  try {
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching featured success stories:', error);
    throw error;
  }
};

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    throw error;
  }
};

export const getAllSuccessStories = async (): Promise<SuccessStory[]> => {
  try {
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all success stories:', error);
    throw error;
  }
};

export const deleteSuccessStory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('success_stories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting success story:', error);
    throw error;
  }
};

// ===== FONCTIONS POUR CRÉER/MODIFIER BLOG ET SUCCESS STORIES =====

export const createBlogPost = async (postData: CreateBlogPostData): Promise<BlogPost> => {
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        ...postData,
        author_id: postData.author_id || user.id,
        status: postData.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

export const updateBlogPost = async (id: string, postData: Partial<CreateBlogPostData>): Promise<BlogPost> => {
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...postData,
        author_id: postData.author_id || user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
};

export const createSuccessStory = async (storyData: CreateSuccessStoryData): Promise<SuccessStory> => {
  try {
    const { data, error } = await supabase
      .from('success_stories')
      .insert([{
        ...storyData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating success story:', error);
    throw error;
  }
};

export const updateSuccessStory = async (id: string, storyData: Partial<CreateSuccessStoryData>): Promise<SuccessStory> => {
  try {
    const { data, error } = await supabase
      .from('success_stories')
      .update({
        ...storyData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating success story:', error);
    throw error;
  }
}; 