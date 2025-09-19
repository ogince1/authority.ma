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
      .in('status', ['active'])
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
      .in('status', ['active'])
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

    // Récupérer la catégorie du site web si website_id est fourni
    let websiteCategory = listingData.category;
    if (listingData.website_id && !listingData.category) {
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('category')
        .eq('id', listingData.website_id)
        .single();
      
      if (websiteError) {
        console.warn('Could not fetch website category:', websiteError);
      } else if (website) {
        websiteCategory = website.category;
        console.log(`Using website category: ${websiteCategory}`);
      }
    }

    // Ajouter l'user_id et la catégorie automatiquement
    const listingDataWithUser = {
      ...listingData,
      user_id: user.id,
      category: websiteCategory
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
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  action_type?: 'link_purchase' | 'website_approval' | 'payment' | 'review';
  action_id?: string;
  is_read?: boolean;
  target_user_id?: string;
}): Promise<any> => {
  try {
    // Utiliser la fonction RPC create_notification qui existe déjà
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: notificationData.user_id,
      p_title: `Notification ${notificationData.type}`,
      p_message: notificationData.message,
      p_type: notificationData.type,
      p_action_url: notificationData.action_id ? `/dashboard/action/${notificationData.action_id}` : null,
      p_action_type: notificationData.action_type || null
    });

    if (error) throw error;
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
  custom_content?: string;
  content_option?: 'platform' | 'custom';
  proposed_price: number;
  proposed_duration: number;
}): Promise<LinkPurchaseRequest> => {
  try {
    // Supprimer campaign_id des données avant insertion
    const { campaign_id, ...cleanRequestData } = requestData as any;
    
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .insert([cleanRequestData])
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
  page?: number;
  limit?: number;
}): Promise<{ data: LinkPurchaseRequest[]; total: number; totalPages: number }> => {
  try {
    let query = supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listing:link_listings(
          *,
          website:websites(*)
        ),
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

    // Compter le total d'éléments
    const { count, error: countError } = await supabase
      .from('link_purchase_requests')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;

    const total = count || 0;
    const limit = filters?.limit || 10;
    const page = filters?.page || 1;
    const totalPages = Math.ceil(total / limit);

    // Appliquer la pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw error;
    
    return {
      data: data || [],
      total,
      totalPages
    };
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

// ===== WORKFLOW DE CONFIRMATION DES LIENS =====

export const acceptPurchaseRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer la demande avec les détails du lien
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings!inner(title)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Demande non trouvée');
    }

    if (request.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    // Mettre à jour le statut à 'pending_confirmation'
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'pending_confirmation',
        response_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Créer une notification pour l'annonceur
    await createNotification({
      user_id: request.user_id,
      type: 'info',
      message: `Votre demande pour le lien "${request.link_listings?.title}" a été acceptée. Veuillez confirmer le placement.`,
      action_type: 'link_purchase',
      action_id: requestId
    });

    return { success: true };
  } catch (error) {
    console.error('Error accepting purchase request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'acceptation de la demande'
    };
  }
};

// Verrou global pour éviter les appels multiples
const confirmationLocks = new Set<string>();

export const confirmLinkPlacement = async (
  requestId: string
): Promise<{ success: boolean; error?: string; transaction_id?: string }> => {
  // Vérifier si une confirmation est déjà en cours pour cette demande
  if (confirmationLocks.has(requestId)) {
    console.log(`🔒 [CONFIRMATION] Confirmation déjà en cours pour la demande: ${requestId.slice(0, 8)}...`);
    return { success: false, error: 'Confirmation déjà en cours' };
  }

  try {
    // Ajouter le verrou
    confirmationLocks.add(requestId);
    console.log(`🔒 [CONFIRMATION] Début de confirmation pour la demande: ${requestId.slice(0, 8)}...`);
    
    // Récupérer la demande avec les détails du lien
    const { data: request, error: requestError } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listings(title)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('Error fetching request:', requestError);
      throw new Error('Demande non trouvée');
    }

    if (request.status !== 'pending_confirmation') {
      console.log(`⚠️  [CONFIRMATION] Demande déjà traitée: ${request.status}`);
      throw new Error('Cette demande n\'est pas en attente de confirmation');
    }

    // Vérifier que la demande n'a pas expiré (48h)
    const deadline = new Date(request.accepted_at || request.response_date);
    deadline.setHours(deadline.getHours() + 48);
    
    if (new Date() > deadline) {
      throw new Error('Le délai de confirmation a expiré');
    }

    // Vérifier le solde de l'annonceur
    const { data: advertiser, error: advertiserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Annonceur non trouvé');
    }

    if (advertiser.balance < request.proposed_price) {
      throw new Error('Solde insuffisant pour confirmer cette demande');
    }

    // Calculer les montants
    const platformFee = request.proposed_price * 0.10; // 10% de commission
    const publisherAmount = request.proposed_price - platformFee;

    console.log(`💰 [CONFIRMATION] Calculs pour la demande ${requestId.slice(0, 8)}...`);
    console.log(`   Prix total: ${request.proposed_price} MAD`);
    console.log(`   Commission plateforme (10%): ${platformFee} MAD`);
    console.log(`   Montant éditeur: ${publisherAmount} MAD`);

    // Créer la transaction d'achat
    const { data: transaction, error: transactionError } = await supabase
      .from('link_purchase_transactions')
      .insert({
        purchase_request_id: requestId,
        advertiser_id: request.user_id,
        publisher_id: request.publisher_id,
        link_listing_id: request.link_listing_id,
        amount: request.proposed_price,
        platform_fee: platformFee,
        publisher_amount: publisherAmount,
        status: 'completed',
        payment_method: 'balance'
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    console.log(`✅ [CONFIRMATION] Transaction créée: ${transaction.id.slice(0, 8)}...`);

    // Note: Les soldes seront mis à jour automatiquement par les triggers
    // quand les credit_transactions seront insérées
    console.log(`💳 [CONFIRMATION] Les soldes seront mis à jour automatiquement par les triggers`);

    console.log(`📊 [CONFIRMATION] Solde annonceur: ${advertiser.balance} MAD`);
    console.log(`📊 [CONFIRMATION] Les triggers vont gérer automatiquement les soldes`);

    // Créer les transactions de crédit (les triggers calculent automatiquement balance_before et balance_after)
    console.log(`💳 [CONFIRMATION] Création des transactions - les triggers vont calculer les soldes automatiquement`);
    
    const { error: creditTransactionError } = await supabase
      .from('credit_transactions')
      .insert([
        {
          user_id: request.user_id,
          type: 'purchase',
          amount: request.proposed_price,
          description: 'Achat de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
          // balance_before et balance_after sont calculés automatiquement par les triggers
        },
        {
          user_id: request.publisher_id,
          type: 'deposit',
          amount: publisherAmount,
          description: 'Vente de lien',
          currency: 'MAD',
          status: 'completed',
          related_link_listing_id: request.link_listing_id,
          related_purchase_request_id: requestId,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
          // balance_before et balance_after sont calculés automatiquement par les triggers
        }
      ]);

    if (creditTransactionError) {
      console.log('⚠️  [CONFIRMATION] Erreur lors de la création des transactions de crédit:', creditTransactionError);
      // This is the error the user was previously reporting (42501 RLS)
    } else {
      console.log(`✅ [CONFIRMATION] Transactions de crédit créées avec succès`);
    }

    // Mettre à jour le statut de la demande (avec protection contre les appels multiples)
    console.log(`🔄 [CONFIRMATION] Mise à jour du statut de la demande: pending_confirmation → confirmed`);
    const { error: updateError } = await supabase
      .from('link_purchase_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('status', 'pending_confirmation'); // Protection contre les appels multiples

    if (updateError) {
      console.log(`❌ [CONFIRMATION] Erreur mise à jour statut: ${updateError.message}`);
      throw updateError;
    }
    console.log(`✅ [CONFIRMATION] Statut de la demande mis à jour avec succès`);

    // Créer une notification pour l'éditeur
    await createNotification({
      user_id: request.publisher_id,
      type: 'success',
      message: `Le placement du lien "${request.link_listings?.title}" a été confirmé. Le paiement a été effectué.`,
      action_type: 'payment',
      action_id: requestId,
      is_read: false
    });

    // Déclencher un événement pour mettre à jour les soldes dans l'interface (avec délai)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance-updated'));
        console.log('💰 [CONFIRMATION] Événement balance-updated déclenché (après délai)');
      }, 2000); // Attendre 2 secondes pour que les triggers finissent
    }

    // Les triggers s'occupent automatiquement de mettre à jour les soldes
    console.log(`✅ [CONFIRMATION] Les triggers vont automatiquement mettre à jour les soldes`);

    return {
      success: true,
      transaction_id: transaction.id
    };
  } catch (error) {
    console.error('Error confirming link placement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la confirmation du placement'
    };
  } finally {
    // Retirer le verrou
    confirmationLocks.delete(requestId);
    console.log(`🔓 [CONFIRMATION] Verrou retiré pour la demande: ${requestId.slice(0, 8)}...`);
  }
};

export const getPendingConfirmationRequests = async (userId: string): Promise<LinkPurchaseRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('link_purchase_requests')
      .select(`
        *,
        link_listing:link_listings(
          *,
          website:websites(*)
        ),
        publisher:users!link_purchase_requests_publisher_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending_confirmation')
      .order('response_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending confirmation requests:', error);
    return [];
  }
};

export const autoConfirmExpiredRequests = async (): Promise<{ confirmed: number; errors: string[] }> => {
  try {
    // Récupérer les demandes expirées (plus de 48h sans confirmation)
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const { data: expiredRequests, error: fetchError } = await supabase
      .from('link_purchase_requests')
      .select('*')
      .eq('status', 'pending_confirmation')
      .lt('response_date', fortyEightHoursAgo.toISOString());

    if (fetchError) throw fetchError;

    let confirmed = 0;
    const errors: string[] = [];

    // Traiter chaque demande expirée
    for (const request of expiredRequests || []) {
      try {
        const result = await confirmLinkPlacement(request.id);
        if (result.success) {
          confirmed++;
        } else {
          errors.push(`Demande ${request.id}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Demande ${request.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    return { confirmed, errors };
  } catch (error) {
    console.error('Error auto-confirming expired requests:', error);
    return { confirmed: 0, errors: [error instanceof Error ? error.message : 'Erreur inconnue'] };
  }
};

// ===== RECOMMANDATIONS DE LIENS POUR ACHAT RAPIDE =====

export const getLinkRecommendations = async (type?: string): Promise<{
  websites: any[]; // Sites web comme headers d'accordéon
  link_listings: LinkListing[]; // Articles existants pour le contenu
}> => {
  try {
    // Récupérer les sites web (websites) comme headers d'accordéon
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (websitesError) throw websitesError;

    // Récupérer les articles existants (link_listings actifs)
    const { data: linkListings, error: listingsError } = await supabase
      .from('link_listings')
      .select(`
        *,
        website:websites(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (listingsError) throw listingsError;
    
    return {
      websites: websites || [],
      link_listings: linkListings || []
    };
  } catch (error) {
    console.error('Error getting link recommendations:', error);
    return {
      websites: [],
      link_listings: []
    };
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

// ===== SYNCHRONISATION DES CATÉGORIES =====

export const syncArticleCategoriesWithWebsites = async () => {
  try {
    console.log('🔄 Synchronisation des catégories des articles avec leurs sites web...');
    
    // Récupérer tous les articles avec leurs sites web
    const { data: articles, error: fetchError } = await supabase
      .from('link_listings')
      .select(`
        id,
        title,
        category,
        website_id,
        websites!inner(
          id,
          title,
          category
        )
      `);
    
    if (fetchError) {
      console.error('Error fetching articles for sync:', fetchError);
      throw fetchError;
    }
    
    if (!articles || articles.length === 0) {
      console.log('ℹ️ Aucun article trouvé pour la synchronisation');
      return { updated: 0, total: 0 };
    }

    // Identifier les articles avec des catégories différentes
    const mismatches = articles.filter(article => 
      article.category !== article.websites?.category
    );

    if (mismatches.length === 0) {
      console.log('✅ Tous les articles ont déjà la bonne catégorie');
      return { updated: 0, total: articles.length };
    }

    // Mettre à jour les catégories
    let updatedCount = 0;
    for (const article of mismatches) {
      const { error: updateError } = await supabase
        .from('link_listings')
        .update({ category: article.websites?.category })
        .eq('id', article.id);
      
      if (updateError) {
        console.error(`Error updating article ${article.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ Article "${article.title}" mis à jour: ${article.category} → ${article.websites?.category}`);
      }
    }

    console.log(`🎉 Synchronisation terminée: ${updatedCount}/${mismatches.length} articles mis à jour`);
    return { updated: updatedCount, total: articles.length };
    
  } catch (error) {
    console.error('Error syncing article categories:', error);
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
        status: 'pending_confirmation',
        placed_url: placedUrl,
        placed_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
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

// ===== FONCTIONS POUR LES SERVICES =====

// Récupérer tous les services disponibles
export const getServices = async (): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'available')
      .order('name');

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Récupérer un service par ID
export const getServiceById = async (serviceId: string): Promise<Service | null> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
};

// Créer une demande de service
export const createServiceRequest = async (requestData: {
  service_id: string;
  user_id: string;
  quantity: number;
  total_price: number;
  client_notes?: string;
}): Promise<ServiceRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([requestData])
      .select(`
        *,
        service:services(*),
        user:users(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating service request:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating service request:', error);
    return null;
  }
};

// Récupérer les demandes de services d'un utilisateur
export const getUserServiceRequests = async (userId: string): Promise<ServiceRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        service:services(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user service requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    return [];
  }
};

// Récupérer toutes les demandes de services (pour les admins)
export const getAllServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        service:services(*),
        user:users(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all service requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all service requests:', error);
    return [];
  }
};

// Mettre à jour le statut d'une demande de service (pour les admins)
export const updateServiceRequestStatus = async (
  requestId: string, 
  status: string, 
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating service request status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating service request status:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
};

// ===== FONCTIONS POUR LA GESTION DU SOLDE =====

// Ajouter ou retirer du solde utilisateur
export const addUserBalance = async (
  userId: string, 
  amount: number, 
  transactionType: string, 
  description: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
  try {
    // Récupérer le solde actuel
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + amount;

    // Vérifier que le solde ne devient pas négatif
    if (newBalance < 0) {
      return { success: false, error: 'Solde insuffisant' };
    }

    // Mettre à jour le solde
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Créer une transaction de crédit
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userId,
        amount: amount,
        transaction_type: transactionType,
        description: description,
        balance_before: currentBalance,
        balance_after: newBalance
      }]);

    if (transactionError) {
      console.error('Error creating credit transaction:', transactionError);
      // Ne pas faire échouer la transaction pour une erreur de log
    }

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error updating user balance:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du solde' };
  }
}; 