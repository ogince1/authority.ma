import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Lock, User, Eye, EyeOff, Users, TrendingUp, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmail, signUpWithEmail, resetPassword } from '../../lib/supabase';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  confirmPassword?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, onModeChange }) => {
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmailSent, setResetEmailSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<AuthFormData>();

  const password = watch('password');

  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, mode, reset]);

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(data.email, data.password, data.name, data.role);
        toast.success('Compte créé avec succès ! Vérifiez votre email.');
      } else {
        await signInWithEmail(data.email, data.password);
        toast.success('Connexion réussie !');
      }
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Erreur lors de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (data: { email: string }) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setResetEmailSent(true);
      toast.success('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Nom complet *
              </label>
              <input
                {...register('name', { 
                  required: mode === 'signup' ? 'Le nom est requis' : false 
                })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom complet"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-2" />
                Votre profil *
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    {...register('role', { required: mode === 'signup' ? 'Veuillez choisir un profil' : false })}
                    type="radio"
                    value="publisher"
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">Éditeur</div>
                      <div className="text-sm text-gray-600">Je veux vendre des liens sur mes sites web</div>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    {...register('role', { required: mode === 'signup' ? 'Veuillez choisir un profil' : false })}
                    type="radio"
                    value="advertiser"
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">Annonceur</div>
                      <div className="text-sm text-gray-600">Je veux acheter des liens pour mes sites</div>
                    </div>
                  </div>
                </label>
                

              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email *
            </label>
            <input
              {...register('email', {
                required: 'L\'email est requis',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalide'
                }
              })}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="h-4 w-4 inline mr-2" />
              Mot de passe *
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'Le mot de passe est requis',
                  minLength: {
                    value: 6,
                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: mode === 'signup' ? 'Veuillez confirmer votre mot de passe' : false,
                    validate: mode === 'signup' ? (value) => 
                      value === password || 'Les mots de passe ne correspondent pas' : undefined
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{mode === 'login' ? 'Connexion...' : 'Inscription...'}</span>
              </div>
            ) : (
              mode === 'login' ? 'Se connecter' : 'S\'inscrire'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mot de passe oublié ?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            <button
              onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Modal Reset Password */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {resetEmailSent ? 'Email envoyé' : 'Mot de passe oublié'}
              </h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {!resetEmailSent ? (
              <form onSubmit={handleSubmit(handleForgotPassword)} className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email *
                  </label>
                  <input
                    {...register('email', {
                      required: 'L\'email est requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide'
                      }
                    })}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Email envoyé !
                  </h3>
                  <p className="text-gray-600">
                    Nous avons envoyé un lien de réinitialisation à votre adresse email. 
                    Vérifiez votre boîte de réception et suivez les instructions.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Retour à la connexion
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AuthModal;