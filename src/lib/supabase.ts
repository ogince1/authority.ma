import { createClient } from '@supabase/supabase-js';
import { 
  Project, 
  Proposal, 
  CreateProposalData, 
  CreateProjectData, 
  ProjectFilterOptions, 
  ProjectSubmission, 
  CreateProjectSubmissionData,
  FundraisingOpportunity,
  InvestmentInterest,
  CreateInvestmentInterestData,
  CreateFundraisingData,
  BlogPost,
  CreateBlogPostData,
  BlogCategory,
  SuccessStory,
  CreateSuccessStoryData,
  IndustrySector,
  UserRole
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth operations
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
      // Ne pas faire échouer la connexion pour un problème de profil
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

export const signUpWithEmail = async (email: string, password: string, name?: string, role: UserRole = 'entrepreneur') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
        role: role // Le trigger va utiliser cette donnée pour créer le profil
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  // Remove manual profile creation - let the trigger handle it
  // The trigger will automatically create the user profile
  console.log('User signup successful, profile will be created by trigger');

  return data;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Note: ensureUserProfile is defined later in the file with better implementation

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  return await ensureUserProfile(user.id);
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, ...profileData })
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    // Only log errors that are not expected "Auth session missing!" errors
    if (error.message !== 'Auth session missing!') {
      console.error('Error getting current user:', error);
    }
    return null;
  }

  return user;
};

export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  
  if (!user) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return !!data;
};

// Project operations
export const getProjects = async (filters?: ProjectFilterOptions): Promise<Project[]> => {
  // Use the new database function for better performance with complex filtering
  const { data, error } = await supabase.rpc('get_projects_by_filters', {
    p_project_type: filters?.project_type || null,
    p_category: filters?.category || null,
    p_real_category: filters?.real_category || null,
    p_industry_sector: filters?.industry_sector || null,
    p_min_price: filters?.minPrice || null,
    p_max_price: filters?.maxPrice || null,
    p_search: filters?.search || null,
    p_rental_option: filters?.rental_option || null,
    p_user_id: filters?.user_id || null,
    p_limit: 50,
    p_offset: 0
  });

  if (error) {
    console.error('Error fetching projects with new function:', error);
    
    // Fallback to old method if the new function fails
    let query = supabase
      .from('projects')
      .select('*');

    // Si un user_id est fourni, filtrer par user_id, sinon filtrer par status=active
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    } else {
      query = query.eq('status', 'active');
    }

    query = query.order('created_at', { ascending: false });

    // New filters
    if (filters?.project_type) {
      query = query.eq('project_type', filters.project_type);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.real_category) {
      query = query.eq('real_category', filters.real_category);
    }

    if (filters?.industry_sector) {
      query = query.eq('industry_sector', filters.industry_sector);
    }

    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.industryTags && filters.industryTags.length > 0) {
      query = query.overlaps('industry_tags', filters.industryTags);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.rental_option !== undefined) {
      query = query.eq('rental_option', filters.rental_option);
    }

    const { data: fallbackData, error: fallbackError } = await query;

    if (fallbackError) {
      console.error('Error fetching projects:', fallbackError);
      throw fallbackError;
    }

    return fallbackData || [];
  }

  return data || [];
};

export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return data;
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project by id:', error);
    return null;
  }

  return data;
};

export const createProposal = async (proposalData: CreateProposalData): Promise<Proposal> => {
  const { data, error } = await supabase
    .from('proposals')
    .insert([proposalData])
    .select()
    .single();

  if (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }

  return data;
};

// Admin operations
export const getAllProjects = async (filters?: ProjectFilterOptions): Promise<Project[]> => {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters for admin view
  if (filters?.project_type) {
    query = query.eq('project_type', filters.project_type);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.real_category) {
    query = query.eq('real_category', filters.real_category);
  }

  if (filters?.industry_sector) {
    query = query.eq('industry_sector', filters.industry_sector);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all projects:', error);
    throw error;
  }

  return data || [];
};

export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  // Auto-set project_type based on category if not provided
  if (!projectData.project_type) {
    const digitalCategories = ['mvp', 'startup', 'website', 'site_web_actif', 'domaine_site_trafic', 'startup_tech', 'application_mobile', 'plateforme_saas'];
    projectData.project_type = digitalCategories.includes(projectData.category) ? 'digital' : 'real';
  }

  // Ensure industry_sector is provided
  if (!projectData.industry_sector) {
    // Set default based on category
    const categoryToSector: Record<string, IndustrySector> = {
      'mvp': 'technologie',
      'startup': 'technologie',
      'startup_tech': 'technologie',
      'website': 'e-commerce',
      'site_web_actif': 'e-commerce',
      'domaine_site_trafic': 'e-commerce',
      'application_mobile': 'technologie',
      'plateforme_saas': 'technologie',
      'fonds_commerce': 'commerce',
      'local_commercial': 'commerce',
      'projet_industriel': 'industrie',
      'franchise': 'franchise',
      'restaurant_luxe': 'hotellerie',
      'salon_luxe': 'services',
      'immobilier': 'immobilier',
      'hotellerie': 'hotellerie',
      'industrie': 'industrie',
      'agriculture': 'agriculture',
      'energie': 'energie',
      'logistique': 'logistique',
      'mines': 'industrie',
      'art': 'art',
      'commerce': 'commerce'
    };
    
    projectData.industry_sector = categoryToSector[projectData.category] || 'services';
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return data;
};

export const updateProject = async (id: string, projectData: Partial<CreateProjectData>): Promise<Project> => {
  // Auto-update project_type if category changes
  if (projectData.category && !projectData.project_type) {
    const digitalCategories = ['mvp', 'startup', 'website', 'site_web_actif', 'domaine_site_trafic', 'startup_tech', 'application_mobile', 'plateforme_saas'];
    projectData.project_type = digitalCategories.includes(projectData.category) ? 'digital' : 'real';
  }

  const { data, error } = await supabase
    .from('projects')
    .update({ ...projectData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Project categories helper functions
export const getProjectCategories = async (): Promise<{
  digitalCategories: string[],
  realCategories: string[],
  industrySectors: string[]
}> => {
  // This could be fetched from DB enums, but for now we'll use hardcoded values
  // matching our migration
  return {
    digitalCategories: [
      'mvp', 'startup', 'website', 'site_web_actif', 'domaine_site_trafic', 
      'startup_tech', 'application_mobile', 'plateforme_saas'
    ],
    realCategories: [
      'fonds_commerce', 'local_commercial', 'projet_industriel', 'franchise',
      'restaurant_luxe', 'salon_luxe', 'immobilier', 'hotellerie', 'industrie',
      'agriculture', 'energie', 'logistique', 'mines', 'art', 'commerce'
    ],
    industrySectors: [
      'immobilier', 'artisanat', 'services', 'e-commerce', 'technologie', 'sante',
      'education', 'finance', 'tourisme', 'agriculture', 'industrie', 'energie',
      'logistique', 'art', 'franchise', 'hotellerie', 'commerce', 'marketing',
      'conseil', 'transport'
    ]
  };
};

// Statistics functions
export const getProjectStats = async (): Promise<{
  totalProjects: number,
  digitalProjects: number,
  realProjects: number,
  projectsBySector: Record<string, number>
}> => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('project_type, industry_sector')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching project stats:', error);
    return {
      totalProjects: 0,
      digitalProjects: 0,
      realProjects: 0,
      projectsBySector: {}
    };
  }

  const stats = {
    totalProjects: projects.length,
    digitalProjects: projects.filter(p => p.project_type === 'digital').length,
    realProjects: projects.filter(p => p.project_type === 'real').length,
    projectsBySector: {} as Record<string, number>
  };

  // Count by sector
  projects.forEach(project => {
    if (project.industry_sector) {
      stats.projectsBySector[project.industry_sector] = 
        (stats.projectsBySector[project.industry_sector] || 0) + 1;
    }
  });

  return stats;
};

export const getProposals = async (filters?: { user_id?: string }): Promise<Proposal[]> => {
  let query = supabase
    .from('proposals')
    .select('*');
    
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }

  return data || [];
};

export const updateProposalStatus = async (id: string, status: 'pending' | 'accepted' | 'rejected'): Promise<Proposal> => {
  const { data, error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating proposal status:', error);
    throw error;
  }

  return data;
};

// Project submission operations
export const createProjectSubmission = async (submissionData: CreateProjectSubmissionData): Promise<ProjectSubmission> => {
  const { data, error } = await supabase
    .from('project_submissions')
    .insert([submissionData])
    .select()
    .single();

  if (error) {
    console.error('Error creating project submission:', error);
    throw error;
  }

  return data;
};

export const getProjectSubmissions = async (filters?: { user_id?: string }): Promise<ProjectSubmission[]> => {
  let query = supabase
    .from('project_submissions')
    .select('*');
    
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching project submissions:', error);
    throw error;
  }

  return data || [];
};

export const updateProjectSubmissionStatus = async (
  id: string, 
  status: 'approved' | 'rejected', 
  adminNotes?: string
): Promise<ProjectSubmission> => {
  const currentUser = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('project_submissions')
    .update({ 
      status, 
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUser?.id
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating submission status:', error);
    throw error;
  }

  return data;
};

export const approveProjectSubmission = async (submissionId: string, adminNotes?: string): Promise<Project> => {
  // First get the submission
  const { data: submission, error: fetchError } = await supabase
    .from('project_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (fetchError) {
    console.error('Error fetching submission:', fetchError);
    throw fetchError;
  }

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Create project from submission
  const projectData: CreateProjectData = {
    title: submission.title,
    description: submission.description,
    category: submission.category,
    price: submission.price,
    demo_url: submission.demo_url,
    features: submission.features,
    tech_stack: submission.tech_stack,
    industry_tags: submission.industry_tags || [],
    images: [], // Will need to be added manually by admin
    slug: generateSlug(submission.title),
    contact_info: {
      email: submission.contact_email,
      phone: submission.contact_phone,
      website: submission.contact_website
    },
    // Propriétés manquantes
    project_type: submission.project_type || 'digital', // Utiliser le type de soumission ou par défaut
    industry_sector: submission.industry_sector || 'services', // Utiliser le secteur de soumission ou par défaut
    objective: submission.objective || 'Objectif à définir', // Valeur par défaut
    owner_status: submission.owner_status || 'En cours' // Valeur par défaut
  };

  // Create the project
  const project = await createProject(projectData);

  // Update submission status
  await updateProjectSubmissionStatus(submissionId, 'approved', adminNotes);

  return project;
};

// Fundraising operations
export const getFundraisingOpportunities = async (filters?: { user_id?: string }): Promise<FundraisingOpportunity[]> => {
  let query = supabase
    .from('fundraising_opportunities')
    .select('*');
    
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  } else {
    query = query.eq('status', 'active');
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching fundraising opportunities:', error);
    throw error;
  }

  return data || [];
};

export const getFundraisingOpportunityById = async (id: string): Promise<FundraisingOpportunity | null> => {
  const { data, error } = await supabase
    .from('fundraising_opportunities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching fundraising opportunity:', error);
    return null;
  }

  return data;
};

export const createInvestmentInterest = async (interestData: CreateInvestmentInterestData): Promise<InvestmentInterest> => {
  const { data, error } = await supabase
    .from('investment_interests')
    .insert([interestData])
    .select()
    .single();

  if (error) {
    console.error('Error creating investment interest:', error);
    throw error;
  }

  return data;
};

// Admin fundraising operations
export const getAllFundraisingOpportunities = async (): Promise<FundraisingOpportunity[]> => {
  const { data, error } = await supabase
    .from('fundraising_opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all fundraising opportunities:', error);
    throw error;
  }

  return data || [];
};

export const createFundraisingOpportunity = async (fundraisingData: CreateFundraisingData): Promise<FundraisingOpportunity> => {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User must be authenticated to create fundraising opportunities');
  }

  // If user_id is not provided, use current user's id
  // This allows admins to specify a different user_id if needed
  const dataWithUser = {
    ...fundraisingData,
    user_id: fundraisingData.user_id || currentUser.id
  };

  const { data, error } = await supabase
    .from('fundraising_opportunities')
    .insert([dataWithUser])
    .select()
    .single();

  if (error) {
    console.error('Error creating fundraising opportunity:', error);
    throw error;
  }

  return data;
};

export const updateFundraisingOpportunity = async (id: string, fundraisingData: Partial<CreateFundraisingData>): Promise<FundraisingOpportunity> => {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User must be authenticated to update fundraising opportunities');
  }

  // Remove user_id from update data if present to avoid conflicts
  const { user_id, ...updateData } = fundraisingData;

  const { data, error } = await supabase
    .from('fundraising_opportunities')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fundraising opportunity:', error);
    throw error;
  }

  return data;
};

export const deleteFundraisingOpportunity = async (id: string): Promise<void> => {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User must be authenticated to delete fundraising opportunities');
  }

  const { error } = await supabase
    .from('fundraising_opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting fundraising opportunity:', error);
    throw error;
  }
};

export const getInvestmentInterests = async (filters?: { user_id?: string }): Promise<InvestmentInterest[]> => {
  let query = supabase
    .from('investment_interests')
    .select('*');
    
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching investment interests:', error);
    throw error;
  }

  return data || [];
};

export const updateInvestmentInterestStatus = async (id: string, status: 'pending' | 'contacted' | 'rejected'): Promise<InvestmentInterest> => {
  const { data, error } = await supabase
    .from('investment_interests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating investment interest status:', error);
    throw error;
  }

  return data;
};

// Blog operations
export const getBlogPosts = async (filters?: { category?: string; status?: string; search?: string }): Promise<BlogPost[]> => {
  let query = supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    // By default, only show published posts for public
    query = query.eq('status', 'published');
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }

  return data || [];
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }

  return data;
};

export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }

  return data;
};

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all blog posts:', error);
    throw error;
  }

  return data || [];
};

export const createBlogPost = async (postData: CreateBlogPostData): Promise<BlogPost> => {
  const currentUser = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([{
      ...postData,
      author_id: currentUser?.id,
      published_at: postData.status === 'published' ? new Date().toISOString() : null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }

  return data;
};

export const updateBlogPost = async (id: string, postData: Partial<CreateBlogPostData>): Promise<BlogPost> => {
  const updateData: any = {
    ...postData,
    updated_at: new Date().toISOString()
  };

  // If changing status to published and no published_at date, set it
  if (postData.status === 'published') {
    const { data: currentPost } = await supabase
      .from('blog_posts')
      .select('published_at')
      .eq('id', id)
      .single();
    
    if (!currentPost?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }

  return data;
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

export const getBlogCategories = async (): Promise<BlogCategory[]> => {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }

  return data || [];
};

// Success Stories operations
export const getSuccessStories = async (filters?: { industry?: string; status?: string; search?: string }): Promise<SuccessStory[]> => {
  let query = supabase
    .from('success_stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    // By default, only show published stories for public
    query = query.eq('status', 'published');
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,story_content.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching success stories:', error);
    throw error;
  }

  return data || [];
};

export const getSuccessStoryBySlug = async (slug: string): Promise<SuccessStory | null> => {
  const { data, error } = await supabase
    .from('success_stories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching success story:', error);
    return null;
  }

  return data;
};

export const getFeaturedSuccessStories = async (): Promise<SuccessStory[]> => {
  const { data, error } = await supabase
    .from('success_stories')
    .select('*')
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching featured success stories:', error);
    throw error;
  }

  return data || [];
};

export const getAllSuccessStories = async (): Promise<SuccessStory[]> => {
  const { data, error } = await supabase
    .from('success_stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all success stories:', error);
    throw error;
  }

  return data || [];
};

export const createSuccessStory = async (storyData: CreateSuccessStoryData): Promise<SuccessStory> => {
  const { data, error } = await supabase
    .from('success_stories')
    .insert([storyData])
    .select()
    .single();

  if (error) {
    console.error('Error creating success story:', error);
    throw error;
  }

  return data;
};

export const updateSuccessStory = async (id: string, storyData: Partial<CreateSuccessStoryData>): Promise<SuccessStory> => {
  const { data, error } = await supabase
    .from('success_stories')
    .update({ ...storyData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating success story:', error);
    throw error;
  }

  return data;
};

export const deleteSuccessStory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('success_stories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting success story:', error);
    throw error;
  }
};

// Image upload operations
export const uploadImage = async (file: File, bucket: string = 'project-images'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadMultipleImages = async (files: FileList, bucket: string = 'project-images'): Promise<string[]> => {
  const uploadPromises = Array.from(files).map(file => uploadImage(file, bucket));
  return Promise.all(uploadPromises);
};

export const deleteImage = async (url: string, bucket: string = 'project-images'): Promise<void> => {
  // Extract file path from URL
  const urlParts = url.split('/');
  const filePath = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// New utility functions for email-UUID mapping

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('user_email_mapping')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }

  return data;
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc('get_user_id_by_email', {
    user_email: email
  });

  if (error) {
    console.error('Error fetching user ID by email:', error);
    return null;
  }

  return data;
};

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase.rpc('get_user_profile_by_email', {
    user_email: email
  });

  if (error) {
    console.error('Error fetching user profile by email:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const getAllUsersWithEmails = async () => {
  const { data, error } = await supabase
    .from('user_email_mapping')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users with emails:', error);
    throw error;
  }

  return data || [];
};

// Nouvelles fonctions pour vérifier et synchroniser les profils utilisateur

/**
 * Vérifie le statut des profils utilisateur pour tous les utilisateurs authentifiés
 */
export const checkUserProfileStatus = async () => {
  const { data, error } = await supabase.rpc('check_user_profile_status');

  if (error) {
    console.error('Error checking user profile status:', error);
    throw error;
  }

  return data || [];
};

/**
 * Synchronise manuellement les profils utilisateur pour les utilisateurs qui n'en ont pas
 */
export const syncUserProfiles = async () => {
  const { data, error } = await supabase.rpc('sync_user_profiles');

  if (error) {
    console.error('Error syncing user profiles:', error);
    throw error;
  }

  return data || [];
};

/**
 * Vérifie si un utilisateur spécifique a un profil et le crée si nécessaire
 */
export const ensureUserProfile = async (userId: string, userData?: { name?: string; role?: UserRole }) => {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      console.log(`Creating missing profile for user ${userId}`);
      
      // Obtenir les informations de l'utilisateur depuis auth
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user || authUser.user.id !== userId) {
        // Fallback: créer un profil basique
        const profileData = {
          name: userData?.name || 'Utilisateur',
          role: userData?.role || 'entrepreneur',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return await updateUserProfile(userId, profileData);
      }
      
      // Créer le profil avec les données fournies ou par défaut
      const profileData = {
        name: userData?.name || authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Utilisateur',
        role: userData?.role || (authUser.user.user_metadata?.role as UserRole) || 'entrepreneur',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return await updateUserProfile(userId, profileData);
    }
    
    return profile;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
};

/**
 * Fonction utilitaire pour diagnostiquer les problèmes de profils utilisateur
 */
export const diagnoseUserProfiles = async () => {
  try {
    const status = await checkUserProfileStatus();
    const missingProfiles = status.filter((user: any) => !user.has_profile);
    
    console.log('=== DIAGNOSTIC DES PROFILS UTILISATEUR ===');
    console.log(`Total d'utilisateurs auth: ${status.length}`);
    console.log(`Utilisateurs avec profil: ${status.filter((user: any) => user.has_profile).length}`);
    console.log(`Utilisateurs sans profil: ${missingProfiles.length}`);
    
    if (missingProfiles.length > 0) {
      console.log('Utilisateurs sans profil:');
      missingProfiles.forEach((user: any) => {
        console.log(`- ${user.email} (${user.user_id})`);
      });
      
      console.log('Tentative de synchronisation automatique...');
      const synced = await syncUserProfiles();
      console.log(`Profils synchronisés: ${synced.length}`);
    }
    
    return {
      total: status.length,
      withProfile: status.filter((user: any) => user.has_profile).length,
      withoutProfile: missingProfiles.length,
      synced: missingProfiles.length
    };
  } catch (error) {
    console.error('Error diagnosing user profiles:', error);
    throw error;
  }
};


