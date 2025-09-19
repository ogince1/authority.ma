import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, User, Mail, Phone, Globe, FileText, Briefcase, TrendingUp, Search, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser, updateUserProfile, getUserProfile } from '../../lib/supabase';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';
import PublisherPaymentSettings from './PublisherPaymentSettings';

interface ProfileFormData {
  name: string;
  role: UserRole;
  phone?: string;
  website?: string;
  bio?: string;
}

const UserProfile: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'profile' | 'payment'>('profile');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>();

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);
          
          if (userProfile) {
            reset({
              name: userProfile.name || '',
              role: userProfile.role || 'advertiser',
              phone: userProfile.phone || '',
              website: userProfile.website || '',
              bio: userProfile.bio || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const oldRole = profile?.role;
      
      await updateUserProfile(user.id, data);
      
      // Check if role changed
      if (oldRole && oldRole !== data.role) {
        toast.success('Profil mis à jour avec succès ! Votre dashboard sera mis à jour selon votre nouveau rôle.', {
          duration: 5000,
        });
      } else {
        toast.success('Profil mis à jour avec succès !');
      }
      
      // Refresh profile data
      const updatedProfile = await getUserProfile(user.id);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et de paiement</p>
      </div>

      {/* Onglets - Seulement pour les éditeurs */}
      {profile?.role === 'publisher' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Informations Personnelles
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'payment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Informations de Paiement
            </button>
          </div>
        </div>
      )}

      {/* Contenu selon l'onglet */}
      {(!profile?.role || profile?.role !== 'publisher' || activeTab === 'profile') && (
        <>
        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm"
        >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informations Personnelles</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              L'email ne peut pas être modifié
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Nom complet *
            </label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Votre nom complet"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="h-4 w-4 inline mr-2" />
              Rôle sur la plateforme *
            </label>
            
            {/* Role Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Comprendre les rôles :</div>
                  <ul className="text-xs space-y-1">
                    <li><strong>Éditeur :</strong> Vendre des liens sur vos sites web, gérer vos annonces</li>
                    <li><strong>Annonceur :</strong> Acheter des liens pour vos sites, explorer les opportunités</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  {...register('role', { required: 'Le rôle est requis' })}
                  type="radio"
                  value="publisher"
                  id="role-publisher"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="role-publisher" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Éditeur</div>
                    <div className="text-xs text-gray-500">Vendre des liens sur vos sites web</div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  {...register('role', { required: 'Le rôle est requis' })}
                  type="radio"
                  value="advertiser"
                  id="role-advertiser"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="role-advertiser" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Annonceur</div>
                    <div className="text-xs text-gray-500">Acheter des liens pour vos sites</div>
                  </div>
                </label>
              </div>
              

            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              💡 Changer votre rôle modifiera votre dashboard et les fonctionnalités disponibles.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Téléphone
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+212 6 00 00 00 00"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-2" />
              Site Web
            </label>
            <input
              {...register('website')}
              type="url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://monsite.com"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Biographie
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Parlez-nous de vous, votre expérience, vos projets..."
            />
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informations du Compte</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'inscription
              </label>
              <p className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dernière connexion
              </label>
              <p className="text-sm text-gray-900">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Première connexion'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      </>
      )}

      {/* Onglet Informations de Paiement - Seulement pour les éditeurs */}
      {profile?.role === 'publisher' && activeTab === 'payment' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PublisherPaymentSettings />
        </motion.div>
      )}
    </div>
  );
};

export default UserProfile;