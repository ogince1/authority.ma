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
  PlatformStats,
  CreditTransaction,
  CreateCreditTransactionData,
  LinkPurchaseTransaction
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
      .in('status', ['active', 'pending_approval'])
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
      .in('status', ['active', 'pending_approval'])
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
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Ajouter l'user_id automatiquement et définir le statut à 'active'
    const websiteDataWithUser = {
      ...websiteData,
      user_id: user.id,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('websites')
      .insert([websiteDataWithUser])
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
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching link listings:', error);
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
      .eq('status', 'active')
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
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Ajouter l'user_id automatiquement
    const listingDataWithUser = {
      ...listingData,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('link_listings')
      .insert([listingDataWithUser])
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
    // Vérifier s'il y a des demandes d'achat liées à ce lien
    const { data: purchaseRequests, error: requestsError } = await supabase
      .from('link_purchase_requests')
      .select('id, status')
      .eq('link_listing_id', id);

    if (requestsError) {
      console.error('Error checking purchase requests:', requestsError);
      throw requestsError;
    }

    // Si le lien a des demandes d'achat, marquer comme inactive au lieu de supprimer
    if (purchaseRequests && purchaseRequests.length > 0) {
      console.log(`Link has ${purchaseRequests.length} purchase requests, marking as inactive instead of deleting`);
      
      const { error: updateError } = await supabase
        .from('link_listings')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      console.log('Link marked as inactive successfully');
    } else {
      // Si pas de demandes d'achat, supprimer directement
      const { error: deleteError } = await supabase
        .from('link_listings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      console.log('Link deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting link listing:', error);
    throw error;
  }
};

// ===== GESTION DES DEMANDES D'ACHAT =====



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

  const successRate = (totalRequests || 0) > 0 ? ((totalPurchases || 0) / (totalRequests || 1)) * 100 : 0;

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
    // Utiliser la fonction RPC create_notification qui a les permissions SECURITY DEFINER
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: notificationData.user_id,
      p_title: notificationData.title,
      p_message: notificationData.message,
      p_type: notificationData.type,
      p_action_url: notificationData.action_url || null,
      p_action_type: notificationData.action_type || null
    });

    if (error) throw error;
    
    // La fonction RPC retourne l'ID de la notification créée
    return { id: data };
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

// ===== FONCTIONS POUR LE SYSTÈME DE CAMPAGNES =====

import { 
  Campaign,
  CreateCampaignData,
  LinkOpportunity,
  RecommendationFilters,
  URLAnalysis,
  LinkOrder,
  CreateLinkOrderData,
  CampaignStats,
  CampaignRecommendations,
  CampaignFilterOptions
} from '../types';

// ===== GESTION DES CAMPAGNES =====

export const createCampaign = async (campaignData: CreateCampaignData): Promise<Campaign> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        ...campaignData,
        user_id: campaignData.user_id || user.id,
        status: 'draft',
        budget: campaignData.budget || 0,
        total_orders: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const getCampaigns = async (filters?: CampaignFilterOptions): Promise<Campaign[]> => {
  try {
    let query = supabase.from('campaigns').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.language) {
      query = query.eq('language', filters.language);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters?.budget_min) {
      query = query.gte('budget', filters.budget_min);
    }
    if (filters?.budget_max) {
      query = query.lte('budget', filters.budget_max);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%`);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calculer les vraies valeurs de total_spent et total_orders pour chaque campagne
    const campaignsWithRealData = await Promise.all(
      (data || []).map(async (campaign) => {
        try {
          // Récupérer les commandes de cette campagne
          const orders = await getCampaignOrders(campaign.id);
          
          // Récupérer les demandes d'achat de cette campagne
          const { data: requests, error: requestsError } = await supabase
            .from('link_purchase_requests')
            .select('*')
            .eq('campaign_id', campaign.id);
          
          if (requestsError) {
            console.error(`Error fetching purchase requests for campaign ${campaign.id}:`, requestsError);
          }
          
          // Calculer le montant réel dépensé (commandes terminées + demandes acceptées)
          const completedOrdersSpent = orders
            .filter(o => o.status === 'completed')
            .reduce((sum, order) => sum + (order.total_price || 0), 0);
          
          const acceptedRequestsSpent = (requests || [])
            .filter(r => r.status === 'accepted')
            .reduce((sum, request) => sum + (request.proposed_price || 0), 0);
          
          const realTotalSpent = completedOrdersSpent + acceptedRequestsSpent;
          
          // Calculer le nombre réel de commandes (commandes + demandes)
          const realTotalOrders = orders.length + (requests || []).length;
          
          return {
            ...campaign,
            total_spent: realTotalSpent,
            total_orders: realTotalOrders
          };
        } catch (error) {
          console.error(`Error calculating real data for campaign ${campaign.id}:`, error);
          // En cas d'erreur, retourner les valeurs par défaut
          return {
            ...campaign,
            total_spent: 0,
            total_orders: 0
          };
        }
      })
    );
    
    return campaignsWithRealData;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;
    
    // Calculer les vraies valeurs de total_spent et total_orders
    try {
      const orders = await getCampaignOrders(id);
      
      // Récupérer les demandes d'achat de cette campagne
      const { data: requests, error: requestsError } = await supabase
        .from('link_purchase_requests')
        .select('*')
        .eq('campaign_id', id);
      
      if (requestsError) {
        console.error(`Error fetching purchase requests for campaign ${id}:`, requestsError);
      }
      
      // Calculer le montant réel dépensé (commandes terminées + demandes acceptées)
      const completedOrdersSpent = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (order.total_price || 0), 0);
      
      const acceptedRequestsSpent = (requests || [])
        .filter(r => r.status === 'accepted')
        .reduce((sum, request) => sum + (request.proposed_price || 0), 0);
      
      const realTotalSpent = completedOrdersSpent + acceptedRequestsSpent;
      
      // Calculer le nombre réel de commandes (commandes + demandes)
      const realTotalOrders = orders.length + (requests || []).length;
      
      return {
        ...data,
        total_spent: realTotalSpent,
        total_orders: realTotalOrders
      };
    } catch (calcError) {
      console.error(`Error calculating real data for campaign ${id}:`, calcError);
      return {
        ...data,
        total_spent: 0,
        total_orders: 0
      };
    }
  } catch (error) {
    console.error('Error fetching campaign by id:', error);
    throw error;
  }
};

export const updateCampaign = async (id: string, campaignData: Partial<CreateCampaignData>): Promise<Campaign> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...campaignData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// ===== ANALYSE D'URL =====

export const analyzeURL = async (url: string): Promise<URLAnalysis> => {
  try {
    // Simulation d'analyse d'URL (à remplacer par un vrai service)
    const mockMetrics = {
      traffic: Math.floor(Math.random() * 10000),
      mc: Math.floor(Math.random() * 5000),
      dr: Math.floor(Math.random() * 100),
      cf: Math.floor(Math.random() * 100),
      tf: Math.floor(Math.random() * 100)
    };

    const categories = [
      'Computers/Internet/Web Design and Development',
      'Business/Marketing and Advertising',
      'Health/Alternative Medicine',
      'Shopping/Clothing and Accessories',
      'Recreation/Travel'
    ];

    const analysis: URLAnalysis = {
      url,
      metrics: mockMetrics,
      category: categories[Math.floor(Math.random() * categories.length)],
      analysis_status: 'completed',
      created_at: new Date().toISOString()
    };

    // Sauvegarder l'analyse dans la base de données
    const { data, error } = await supabase
      .from('url_analyses')
      .insert([analysis])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw error;
  }
};

// ===== RECOMMANDATIONS DE LIENS =====

export const getLinkRecommendations = async (
  campaignId: string,
  filters?: RecommendationFilters
): Promise<CampaignRecommendations> => {
  try {
    // Récupérer les liens existants (Articles Existants = Mes Liens Existants des éditeurs)
    const { data: linkListings, error: linkError } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `)
      .eq('status', 'active');

    if (linkError) throw linkError;

    // Récupérer les sites web (Nouveaux Articles = Mes Sites Web des éditeurs)
    const { data: websites, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('status', 'active');

    if (websiteError) throw websiteError;

    // Convertir les link_listings en LinkOpportunity pour les articles existants
    // (Mes Liens Existants des éditeurs = Articles Existants pour annonceurs)
    const existingArticles: LinkOpportunity[] = (linkListings || []).map((listing) => ({
      id: listing.id,
      campaign_id: campaignId,
      type: 'existing_article' as const,
      site_name: listing.website?.title || listing.title,
      site_url: listing.website?.url || listing.target_url,
      site_metrics: {
        dr: listing.website?.metrics?.domain_authority || Math.floor(Math.random() * 100),
        tf: listing.website?.metrics?.trust_flow || Math.floor(Math.random() * 100),
        cf: listing.website?.metrics?.citation_flow || Math.floor(Math.random() * 100),
        ps: 85 + Math.random() * 10, // Proximité sémantique simulée
        age: Math.floor(Math.random() * 60),
        outlinks: Math.floor(Math.random() * 50)
      },
      quality_type: (() => {
        const dr = listing.website?.metrics?.domain_authority || 0;
        if (dr >= 70) return 'gold';
        if (dr >= 40) return 'silver';
        return 'bronze';
      })() as any,
      theme: listing.website?.niche || listing.website_category || 'General',
      existing_article: {
        title: listing.title,
        url: listing.target_url,
        age: Math.floor(Math.random() * 24),
        outlinks: Math.floor(Math.random() * 30)
      },
      price: listing.price,
      currency: listing.currency,
      created_at: listing.created_at,
      updated_at: listing.updated_at
    }));

    // Créer des opportunités pour nouveaux articles basées sur les sites web
    // (Mes Sites Web des éditeurs = Nouveaux Articles pour annonceurs)
    const newArticles: LinkOpportunity[] = (websites || []).map((website) => ({
      id: website.id, // Utiliser l'ID du website directement (UUID valide)
      campaign_id: campaignId,
      type: 'new_article' as const,
      site_name: `${website.title} (Nouveau)`,
      site_url: website.url,
      site_metrics: {
        dr: website.metrics?.domain_authority || Math.floor(Math.random() * 100),
        tf: website.metrics?.trust_flow || Math.floor(Math.random() * 100),
        cf: website.metrics?.citation_flow || Math.floor(Math.random() * 100),
        ps: 85 + Math.random() * 10,
        focus: Math.floor(Math.random() * 100)
      },
      quality_type: (() => {
        const dr = website.metrics?.domain_authority || 0;
        if (dr >= 70) return 'gold';
        if (dr >= 40) return 'silver';
        return 'bronze';
      })() as any,
      theme: website.niche || website.category || 'General',
      new_article: {
        duration: '1 an',
        placement_info: 'Articles seront à 2 clics de la page d\'accueil'
      },
      // Prix basé sur l'autorité du site web
      price: (() => {
        const dr = website.metrics?.domain_authority || 0;
        if (dr >= 70) return 200; // Gold
        if (dr >= 40) return 120; // Silver
        return 80; // Bronze
      })(),
      currency: 'MAD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Appliquer les filtres
    let filteredExisting = existingArticles;
    let filteredNew = newArticles;

    if (filters) {
      if (filters.price_min) {
        filteredExisting = filteredExisting.filter(item => item.price >= filters.price_min!);
        filteredNew = filteredNew.filter(item => item.price >= filters.price_min!);
      }
      if (filters.price_max) {
        filteredExisting = filteredExisting.filter(item => item.price <= filters.price_max!);
        filteredNew = filteredNew.filter(item => item.price <= filters.price_max!);
      }
      if (filters.dr_min) {
        filteredExisting = filteredExisting.filter(item => item.site_metrics.dr! >= filters.dr_min!);
        filteredNew = filteredNew.filter(item => item.site_metrics.dr! >= filters.dr_min!);
      }
      if (filters.type) {
        filteredExisting = filteredExisting.filter(item => item.quality_type === filters.type);
        filteredNew = filteredNew.filter(item => item.quality_type === filters.type);
      }
      if (filters.ps_min) {
        filteredExisting = filteredExisting.filter(item => item.site_metrics.ps! >= filters.ps_min!);
        filteredNew = filteredNew.filter(item => item.site_metrics.ps! >= filters.ps_min!);
      }
    }

    const allOpportunities = [...filteredExisting, ...filteredNew];
    const prices = allOpportunities.map(item => item.price);

    return {
      existing_articles: filteredExisting,
      new_articles: filteredNew,
      total_opportunities: allOpportunities.length,
      average_price: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      price_range: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      }
    };
  } catch (error) {
    console.error('Error getting link recommendations:', error);
    throw error;
  }
};

// ===== COMMANDES DE LIENS =====

export const createLinkOrder = async (orderData: CreateLinkOrderData): Promise<LinkOrder> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase
      .from('link_orders')
      .insert([{
        ...orderData,
        advertiser_id: orderData.advertiser_id || user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating link order:', error);
    throw error;
  }
};

export const getLinkOrders = async (filters?: { campaign_id?: string; user_id?: string }): Promise<LinkOrder[]> => {
  try {
    let query = supabase.from('link_orders').select('*');

    if (filters?.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }
    if (filters?.user_id) {
      query = query.eq('advertiser_id', filters.user_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching link orders:', error);
    throw error;
  }
};

export const updateLinkOrderStatus = async (
  id: string,
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
): Promise<LinkOrder> => {
  try {
    const { data, error } = await supabase
      .from('link_orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating link order status:', error);
    throw error;
  }
};

// ===== STATISTIQUES DE CAMPAGNE =====

export const getCampaignStats = async (userId: string): Promise<CampaignStats> => {
  try {
    const campaigns = await getCampaigns({ user_id: userId });
    const orders = await getLinkOrders({ user_id: userId });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'approved').length;
    const totalSpent = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.total_price, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const topPerformingCampaigns = campaigns
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    return {
      total_campaigns: totalCampaigns,
      active_campaigns: activeCampaigns,
      total_spent: totalSpent,
      total_orders: totalOrders,
      average_order_value: averageOrderValue,
      top_performing_campaigns: topPerformingCampaigns
    };
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    throw error;
  }
};

// ===== FONCTIONS UTILITAIRES POUR LES CAMPAGNES =====

export const updateCampaignMetrics = async (campaignId: string, metrics: any): Promise<Campaign> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        extracted_metrics: metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating campaign metrics:', error);
    throw error;
  }
};

export const getCampaignOrders = async (campaignId: string): Promise<LinkOrder[]> => {
  try {
    return await getLinkOrders({ campaign_id: campaignId });
  } catch (error) {
    console.error('Error getting campaign orders:', error);
    throw error;
  }
};

export const calculateCampaignBudget = async (campaignId: string): Promise<{ spent: number; remaining: number }> => {
  try {
    const campaign = await getCampaignById(campaignId);
    const orders = await getCampaignOrders(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const spent = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.total_price, 0);

    return {
      spent,
      remaining: campaign.budget - spent
    };
  } catch (error) {
    console.error('Error calculating campaign budget:', error);
    throw error;
  }
};

// ===== SYSTÈME DE CRÉDIT/SOLDE =====

export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return 0;
  }
};

export const createCreditTransaction = async (transactionData: CreateCreditTransactionData): Promise<CreditTransaction> => {
  try {
    // Récupérer le solde actuel de l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', transactionData.user_id)
      .single();

    if (userError) {
      console.error('Error fetching user balance:', userError);
      throw new Error('Impossible de récupérer le solde de l\'utilisateur');
    }

    const currentBalance = user.balance || 0;
    let newBalance = currentBalance;

    // Calculer le nouveau solde selon le type de transaction
    if (transactionData.type === 'deposit' || transactionData.type === 'refund') {
      newBalance = currentBalance + transactionData.amount;
    } else if (transactionData.type === 'withdrawal' || transactionData.type === 'purchase' || transactionData.type === 'commission') {
      newBalance = currentBalance - transactionData.amount;
      
      // Vérifier que le solde ne devient pas négatif
      if (newBalance < 0) {
        throw new Error('Solde insuffisant pour cette transaction');
      }
    }

    // Créer la transaction avec les soldes calculés
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        ...transactionData,
        currency: 'MAD',
        status: 'completed',
        balance_before: currentBalance,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Mettre à jour le solde de l'utilisateur
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', transactionData.user_id);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      // Ne pas faire échouer la transaction si la mise à jour du solde échoue
    }

    return transaction;
  } catch (error) {
    console.error('Error creating credit transaction:', error);
    throw error;
  }
};

export const getCreditTransactions = async (userId: string, filters?: {
  type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<CreditTransaction[]> => {
  try {
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return [];
  }
};

export const processLinkPurchase = async (
  purchaseRequestId: string
): Promise<{ success: boolean; error?: string; transaction_id?: string }> => {
  try {
    console.log('Calling process_link_purchase with:', { purchaseRequestId });
    
    // Récupérer d'abord les détails de la demande pour diagnostiquer
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', purchaseRequestId)
      .single();
    
    if (!requestError && request) {
      console.log('Purchase request details:', {
        id: request.id,
        proposed_price: request.proposed_price,
        user_id: request.user_id
      });
      
      // Vérifier le solde de l'utilisateur
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', request.user_id)
        .single();
      
      if (!userError && user) {
        console.log('User balance:', user.balance);
        console.log('Required amount:', request.proposed_price);
        console.log('Balance sufficient:', user.balance >= request.proposed_price);
      }
    }
    
    // Essayer d'abord la fonction SQL
    const { data, error } = await supabase.rpc('process_link_purchase', {
      p_purchase_request_id: purchaseRequestId,
      p_payment_method: 'balance'
    });

    console.log('RPC response:', { data, error });

    if (error) {
      console.error('RPC error details:', error);
      
      // Si la fonction SQL n'existe pas, utiliser la logique TypeScript
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.log('SQL function not found, using TypeScript fallback');
        return await processLinkPurchaseFallback(purchaseRequestId);
      }
      
      // Gérer les erreurs spécifiques
      if (error.message?.includes('Solde insuffisant')) {
        return {
          success: false,
          error: 'Solde insuffisant. Veuillez recharger votre compte.'
        };
      }
      
      throw error;
    }

    return {
      success: true,
      transaction_id: data?.transaction_id
    };
  } catch (error) {
    console.error('Error processing link purchase:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du traitement du paiement'
    };
  }
};

// Fonction de fallback en TypeScript
const processLinkPurchaseFallback = async (
  purchaseRequestId: string
): Promise<{ success: boolean; error?: string; transaction_id?: string }> => {
  try {
    console.log('Using TypeScript fallback for purchase processing');
    
    // Récupérer les détails de la demande
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('id', purchaseRequestId)
      .single();

    if (requestError || !request) {
      throw new Error('Demande non trouvée');
    }

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Utilisateur non trouvé');
    }

    if (advertiser.balance < request.proposed_price) {
      return {
        success: false,
        error: 'Solde insuffisant. Veuillez recharger votre compte.'
      };
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10; // 10% de commission
    const publisherAmount = request.proposed_price - platformFee;

    // Créer la transaction d'achat
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: purchaseRequestId,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: request.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        payment_method: 'manual'
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error('Erreur lors de la création de la transaction');
    }

    // Débiter l'annonceur
    const { error: debitError } = await supabase
      .from('users')
      .update({ balance: advertiser.balance - request.proposed_price })
      .eq('id', request.user_id);

    if (debitError) {
      throw new Error('Erreur lors du débit du compte');
    }

    // Créditer l'éditeur
    const { data: publisher, error: publisherError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.publisher_id)
      .single();

    if (publisherError || !publisher) {
      throw new Error('Éditeur non trouvé');
    }

    const { error: creditError } = await supabase
      .from('users')
      .update({ balance: publisher.balance + publisherAmount })
      .eq('id', request.publisher_id);

    if (creditError) {
      throw new Error('Erreur lors du crédit du compte éditeur');
    }

    // Créer les transactions de crédit
    await Promise.all([
      createCreditTransaction({
        user_id: request.user_id,
        type: 'purchase',
        amount: request.proposed_price,
        description: `Achat de lien - ${request.target_url}`,
        payment_method: undefined
      }),
      createCreditTransaction({
        user_id: request.publisher_id,
        type: 'deposit',
        amount: publisherAmount,
        description: `Vente de lien - ${request.target_url}`,
        payment_method: undefined
      })
    ]);

    // Marquer la demande comme acceptée
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({ 
        status: 'accepted',
        response_date: new Date().toISOString()
      })
      .eq('id', purchaseRequestId);

    if (updateError) {
      throw new Error('Erreur lors de la mise à jour de la demande');
    }

    return {
      success: true,
      transaction_id: transaction.id
    };
  } catch (error) {
    console.error('Fallback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du traitement du paiement'
    };
  }
};

export const addFundsToBalance = async (
  userId: string,
  amount: number,
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'manual',
  paymentReference?: string
): Promise<CreditTransaction> => {
  try {
    return await createCreditTransaction({
      user_id: userId,
      type: 'deposit',
      amount: amount,
      description: `Rechargement de compte - ${paymentMethod}`,
      payment_method: paymentMethod,
      payment_reference: paymentReference
    });
  } catch (error) {
    console.error('Error adding funds to balance:', error);
    throw error;
  }
};

export const withdrawFunds = async (
  userId: string,
  amount: number,
  description: string
): Promise<CreditTransaction> => {
  try {
    return await createCreditTransaction({
      user_id: userId,
      type: 'withdrawal',
      amount: amount,
      description: description
    });
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
};

// ===== GESTION DES DEMANDES D'ACHAT =====

export const createLinkPurchaseRequest = async (requestData: {
  link_listing_id: string;
  user_id: string; // ID de l'annonceur
  publisher_id: string; // ID de l'éditeur
  target_url: string;
  anchor_text: string;
  message?: string;
  proposed_price: number;
  proposed_duration: number;
  campaign_id?: string; // ID de la campagne associée
}): Promise<LinkPurchaseRequest> => {
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating purchase request:', error);
    throw error;
  }
};

export const getLinkPurchaseRequests = async (filters?: {
  user_id?: string; // ID de l'annonceur
  publisher_id?: string; // ID de l'éditeur
  status?: string;
}): Promise<LinkPurchaseRequest[]> => {
  try {
    let query = supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listing:link_listings(*),
        advertiser:users!link_purchase_requests_user_id_fkey(*),
        publisher:users!link_purchase_requests_publisher_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.publisher_id) {
      query = query.eq('publisher_id', filters.publisher_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    throw error;
  }
};

export const updateLinkPurchaseRequestStatus = async (
  requestId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating',
  editorResponse?: string
): Promise<LinkPurchaseRequest> => {
  try {
    const updateData: any = { status };
    if (editorResponse) {
      updateData.editor_response = editorResponse;
      updateData.response_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('link_purchase_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating purchase request status:', error);
    throw error;
  }
};

export const getLinkPurchaseTransactions = async (filters?: {
  advertiser_id?: string;
  publisher_id?: string;
  status?: string;
}): Promise<LinkPurchaseTransaction[]> => {
  try {
    let query = supabase
      .from('link_purchase_transactions')
      .select(`
        *,
        purchase_request:link_purchase_requests(*),
        advertiser:users!link_purchase_transactions_advertiser_id_fkey(*),
        publisher:users!link_purchase_transactions_publisher_id_fkey(*),
        link_listing:link_listings(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.advertiser_id) {
      query = query.eq('advertiser_id', filters.advertiser_id);
    }
    if (filters?.publisher_id) {
      query = query.eq('publisher_id', filters.publisher_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching purchase transactions:', error);
    throw error;
  }
}; 

// ===== SYSTÈME DE MESSAGERIE =====

export const getUserConversations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_conversations', { user_uuid: userId });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    throw error;
  }
};

export const getConversationMessages = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select(`
        *,
        sender:users!conversation_messages_sender_id_fkey(id, name, email),
        receiver:users!conversation_messages_receiver_id_fkey(id, name, email)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
};

export const sendMessage = async (messageData: {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: 'text' | 'system' | 'notification' | 'file' | 'link';
  attachments?: any[];
  related_purchase_request_id?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: messageData.conversation_id,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        content: messageData.content,
        message_type: messageData.message_type || 'text',
        attachments: messageData.attachments || [],
        related_purchase_request_id: messageData.related_purchase_request_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId: string, userId: string) => {
  try {
    const { error } = await supabase
      .rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: userId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

export const getConversationById = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        purchase_request:link_purchase_requests(
          *,
          link_listing:link_listings(*),
          advertiser:users!link_purchase_requests_user_id_fkey(*),
          publisher:users!link_purchase_requests_publisher_id_fkey(*)
        ),
        advertiser:users!conversations_advertiser_id_fkey(*),
        publisher:users!conversations_publisher_id_fkey(*)
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

export const getUnreadMessageCount = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_conversations')
      .select('unread_count')
      .eq('other_user_id', userId);

    if (error) throw error;
    
    const totalUnread = data?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
    return totalUnread;
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return 0;
  }
};

// ===== FONCTIONS POUR L'ACCÈS DES ÉDITEURS =====

export const checkAdvertiserBalance = async (advertiserId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('check_advertiser_balance', { advertiser_id: advertiserId });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error checking advertiser balance:', error);
    throw error;
  }
};

export const getPurchaseRequestDetails = async (requestId: string) => {
  try {
    // Utiliser une requête directe au lieu de la fonction RPC
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .select(`
        id,
        link_listing_id,
        user_id,
        publisher_id,
        target_url,
        anchor_text,
        message,
        proposed_price,
        proposed_duration,
        status,
        editor_response,
        response_date,
        placed_url,
        placed_at,
        created_at,
        updated_at
      `)
      .eq('id', requestId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting purchase request details:', error);
    throw error;
  }
};

// ===== FONCTION POUR ACCEPTER UNE DEMANDE AVEC URL =====

export const acceptPurchaseRequestWithUrl = async (
  requestId: string, 
  placedUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Mettre à jour le statut et l'URL en une seule opération
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({ 
        status: 'accepted',
        placed_url: placedUrl,
        editor_response: 'Demande acceptée ! Le lien a été placé avec succès.'
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error accepting request:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting purchase request:', error);
    return { success: false, error: 'Erreur lors de l\'acceptation' };
  }
}; 