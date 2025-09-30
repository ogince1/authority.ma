import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, Users, TrendingUp, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { trackUserSignup } from '../utils/analytics';
import { signUpWithEmail } from '../lib/supabase';
import { UserRole } from '../types';
import { emailServiceClient } from '../utils/emailServiceClient';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const { user } = await signUpWithEmail(data.email, data.password, data.name, data.role);
      
      // Envoyer l'email de bienvenue selon le rôle
      if (user) {
        try {
          const templateKey = data.role === 'publisher' ? 'EDITOR_WELCOME' : 'ADVERTISER_WELCOME';
          const variables = {
            user_name: data.name,
            dashboard_url: `${window.location.origin}/dashboard`
          };

             await emailServiceClient.sendTemplateEmail(
            templateKey,
            data.email,
            variables,
            ['welcome', data.role, 'onboarding']
          );

          toast.success('Compte créé avec succès ! Email de bienvenue envoyé.');
        } catch (emailError) {
          console.error('Erreur envoi email bienvenue:', emailError);
          toast.success('Compte créé avec succès ! (Email de bienvenue en cours)');
        }
      } else {
        toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
      }
      
      trackUserSignup();
      navigate('/login');
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Inscription | Back.ma - Plateforme de Vente de Liens"
        description="Créez votre compte Back.ma pour acheter et vendre des liens de qualité sur des sites web marocains."
      />
      <Header />
      
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-full mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/logo-simple.svg" 
                  alt="Back.ma" 
                  className="h-16 w-auto"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Inscription
              </h2>
              <p className="text-gray-600">
                Créez votre compte pour rejoindre notre communauté
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Nom complet *
                </label>
                <input
                  {...register('name', { required: 'Le nom est requis' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-2" />
                  Votre profil *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      {...register('role', { required: 'Veuillez choisir un profil' })}
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
                      {...register('role', { required: 'Veuillez choisir un profil' })}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Veuillez confirmer votre mot de passe',
                      validate: (value) => value === password || 'Les mots de passe ne correspondent pas'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Inscription...</span>
                  </div>
                ) : (
                  'S\'inscrire'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;