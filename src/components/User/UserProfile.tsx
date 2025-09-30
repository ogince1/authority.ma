import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, User, Mail, Phone, Globe, FileText, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser, updateUserProfile, getUserProfile } from '../../lib/supabase';
// import EmailPreferences from './EmailPreferences';
import toast from 'react-hot-toast';
import PublisherPaymentSettings from './PublisherPaymentSettings';

interface ProfileFormData {
  name: string;
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
      await updateUserProfile(user.id, data);
      toast.success('Profil mis à jour avec succès !');
      
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

      {/* Onglets */}
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
          {profile?.role === 'publisher' && (
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
          )}
          <button
            onClick={() => setActiveTab('email')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'email'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Préférences Email
          </button>
        </div>
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'email' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Préférences Email</h2>
              <p className="text-gray-600">Gérez vos préférences de notification par email</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Emails de bienvenue</h3>
                  <p className="text-sm text-gray-600">Recevoir des emails de bienvenue et d'onboarding</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-green-600">Activé</span>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Notifications de commandes</h3>
                  <p className="text-sm text-gray-600">Être notifié des nouvelles commandes et de leur statut</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-green-600">Activé</span>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Emails marketing</h3>
                  <p className="text-sm text-gray-600">Recevoir des offres spéciales et des nouveautés (toujours activé)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-green-600">Activé</span>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 cursor-not-allowed opacity-75">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Informations importantes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Les emails de sécurité (réinitialisation de mot de passe) sont toujours envoyés</li>
              <li>• Les emails marketing sont toujours activés pour vous tenir informé des nouveautés</li>
              <li>• Vous pouvez modifier vos préférences à tout moment</li>
              <li>• Vous recevrez toujours les notifications critiques</li>
            </ul>
          </div>
        </div>
      ) : (!profile?.role || profile?.role !== 'publisher' || activeTab === 'profile') && (
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