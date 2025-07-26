import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

// Types pour la synchronisation
interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: UserRole;
  };
  created_at: string;
}

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  details: {
    totalAuthUsers: number;
    totalPublicUsers: number;
    missingProfiles: number;
    createdProfiles: number;
    updatedProfiles: number;
    errors: string[];
  };
}

/**
 * Récupère tous les utilisateurs d'auth.users
 */
async function getAuthUsers(): Promise<AuthUser[]> {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Erreur lors de la récupération des utilisateurs auth:', error);
    return [];
  }
  
  return authUsers.users.map(user => ({
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
    created_at: user.created_at
  }));
}

/**
 * Récupère tous les utilisateurs de public.users
 */
async function getPublicUsers(): Promise<PublicUser[]> {
  const { data: publicUsers, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Erreur lors de la récupération des utilisateurs publics:', error);
    return [];
  }
  
  return publicUsers || [];
}

/**
 * Crée un profil dans public.users
 */
async function createUserProfile(authUser: AuthUser): Promise<boolean> {
  const profile = {
    id: authUser.id,
    name: authUser.user_metadata.name || authUser.email.split('@')[0],
    email: authUser.email,
    role: (authUser.user_metadata.role as UserRole) || 'entrepreneur',
    created_at: authUser.created_at,
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('users')
    .insert([profile]);
  
  if (error) {
    console.error('Erreur lors de la création du profil:', error);
    return false;
  }
  
  return true;
}

/**
 * Met à jour un profil dans public.users
 */
async function updateUserProfile(authUser: AuthUser, publicUser: PublicUser): Promise<boolean> {
  const updates: Partial<PublicUser> = {
    updated_at: new Date().toISOString()
  };
  
  // Mettre à jour le nom si nécessaire
  const expectedName = authUser.user_metadata.name || authUser.email.split('@')[0];
  if (publicUser.name !== expectedName) {
    updates.name = expectedName;
  }
  
  // Mettre à jour l'email si nécessaire
  if (publicUser.email !== authUser.email) {
    updates.email = authUser.email;
  }
  
  // Mettre à jour le rôle si nécessaire
  const expectedRole = (authUser.user_metadata.role as UserRole) || 'entrepreneur';
  if (publicUser.role !== expectedRole) {
    updates.role = expectedRole;
  }
  
  // Si aucune mise à jour n'est nécessaire
  if (Object.keys(updates).length === 1) { // Seulement updated_at
    return true;
  }
  
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', publicUser.id);
  
  if (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return false;
  }
  
  return true;
}

/**
 * Synchronise les utilisateurs entre auth.users et public.users
 */
export async function syncUsers(): Promise<SyncResult> {
  console.log('🔄 Début de la synchronisation des utilisateurs...');
  
  const result: SyncResult = {
    success: false,
    message: '',
    details: {
      totalAuthUsers: 0,
      totalPublicUsers: 0,
      missingProfiles: 0,
      createdProfiles: 0,
      updatedProfiles: 0,
      errors: []
    }
  };
  
  try {
    // Récupérer tous les utilisateurs
    const authUsers = await getAuthUsers();
    const publicUsers = await getPublicUsers();
    
    result.details.totalAuthUsers = authUsers.length;
    result.details.totalPublicUsers = publicUsers.length;
    
    console.log(`📊 Utilisateurs auth: ${authUsers.length}, Utilisateurs publics: ${publicUsers.length}`);
    
    // Créer un index des utilisateurs publics par ID
    const publicUsersMap = new Map(publicUsers.map(user => [user.id, user]));
    
    // Parcourir tous les utilisateurs auth
    for (const authUser of authUsers) {
      const publicUser = publicUsersMap.get(authUser.id);
      
      if (!publicUser) {
        // Profil manquant - créer
        console.log(`➕ Création du profil pour: ${authUser.email}`);
        const created = await createUserProfile(authUser);
        
        if (created) {
          result.details.createdProfiles++;
          result.details.missingProfiles++;
        } else {
          result.details.errors.push(`Impossible de créer le profil pour ${authUser.email}`);
        }
      } else {
        // Vérifier si une mise à jour est nécessaire
        const expectedName = authUser.user_metadata.name || authUser.email.split('@')[0];
        const expectedRole = (authUser.user_metadata.role as UserRole) || 'entrepreneur';
        
        if (publicUser.name !== expectedName || 
            publicUser.email !== authUser.email || 
            publicUser.role !== expectedRole) {
          
          console.log(`📝 Mise à jour du profil pour: ${authUser.email}`);
          const updated = await updateUserProfile(authUser, publicUser);
          
          if (updated) {
            result.details.updatedProfiles++;
          } else {
            result.details.errors.push(`Impossible de mettre à jour le profil pour ${authUser.email}`);
          }
        }
      }
    }
    
    // Déterminer le succès
    result.success = result.details.errors.length === 0;
    
    if (result.success) {
      result.message = `✅ Synchronisation terminée avec succès ! ${result.details.createdProfiles} profils créés, ${result.details.updatedProfiles} profils mis à jour.`;
    } else {
      result.message = `⚠️ Synchronisation terminée avec des erreurs. ${result.details.errors.length} erreurs rencontrées.`;
    }
    
    console.log(result.message);
    console.log('📊 Détails:', result.details);
    
    return result;
    
  } catch (error) {
    result.success = false;
    result.message = `❌ Erreur lors de la synchronisation: ${error}`;
    result.details.errors.push(`Erreur générale: ${error}`);
    
    console.error('Erreur de synchronisation:', error);
    return result;
  }
}

/**
 * Vérifie l'état de la synchronisation
 */
export async function checkSyncStatus(): Promise<{
  inSync: boolean;
  authUsers: number;
  publicUsers: number;
  missingProfiles: number;
  details: string[];
}> {
  console.log('🔍 Vérification de l\'état de synchronisation...');
  
  const authUsers = await getAuthUsers();
  const publicUsers = await getPublicUsers();
  
  const publicUsersMap = new Map(publicUsers.map(user => [user.id, user]));
  const missingProfiles: string[] = [];
  
  for (const authUser of authUsers) {
    if (!publicUsersMap.has(authUser.id)) {
      missingProfiles.push(authUser.email);
    }
  }
  
  const result = {
    inSync: missingProfiles.length === 0,
    authUsers: authUsers.length,
    publicUsers: publicUsers.length,
    missingProfiles: missingProfiles.length,
    details: missingProfiles
  };
  
  console.log('📊 État de synchronisation:', result);
  return result;
}

/**
 * Crée un utilisateur avec son profil public
 */
export async function createUserWithProfile(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'entrepreneur'
): Promise<{ success: boolean; message: string; user?: any }> {
  console.log(`👤 Création d'un utilisateur avec profil: ${email}`);
  
  try {
    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });
    
    if (authError) {
      return {
        success: false,
        message: `Erreur lors de la création de l'utilisateur: ${authError.message}`
      };
    }
    
    if (!authData.user) {
      return {
        success: false,
        message: 'Utilisateur non créé'
      };
    }
    
    // Créer le profil dans public.users
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError);
      // L'utilisateur auth existe mais pas le profil public
      return {
        success: false,
        message: `Utilisateur créé mais erreur lors de la création du profil: ${profileError.message}`
      };
    }
    
    return {
      success: true,
      message: 'Utilisateur et profil créés avec succès',
      user: authData.user
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erreur inattendue: ${error}`
    };
  }
}

/**
 * Récupère un utilisateur par email
 */
export async function getUserByEmail(email: string): Promise<PublicUser | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
  
  return user;
}

/**
 * Met à jour le rôle d'un utilisateur
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ 
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    return false;
  }
  
  return true;
}

/**
 * Obtient les statistiques des utilisateurs
 */
export async function getUserStats(): Promise<{
  total: number;
  entrepreneurs: number;
  investors: number;
  withoutEmail: number;
}> {
  const { data: users, error } = await supabase
    .from('users')
    .select('role, email');
  
  if (error || !users) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      total: 0,
      entrepreneurs: 0,
      investors: 0,
      withoutEmail: 0
    };
  }
  
  return {
    total: users.length,
    entrepreneurs: users.filter(u => u.role === 'entrepreneur').length,
    investors: users.filter(u => u.role === 'investor').length,
    withoutEmail: users.filter(u => !u.email).length
  };
}