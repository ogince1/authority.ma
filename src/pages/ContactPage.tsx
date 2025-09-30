import React from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Ici, vous pouvez ajouter la logique pour envoyer le formulaire
      console.log('Données du formulaire:', data);
      alert('Message envoyé avec succès !');
      reset();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      alert('Erreur lors de l\'envoi du message.');
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'contact@back.ma',
      link: 'mailto:contact@back.ma'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      content: '+212 5 20 23 23 75',
      link: 'tel:+212520232375'
    },
    {
      icon: MapPin,
      title: 'Adresse',
      content: 'Casablanca, Maroc',
      link: '#'
    },
    {
      icon: Clock,
      title: 'Horaires',
      content: 'Lun-Ven: 9h-18h',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Contact Back.ma - Support Netlinking Maroc | Aide & Assistance"
        description="Contactez l'équipe Back.ma pour toute question sur l'achat et la vente de liens SEO au Maroc. Support technique, commercial et assistance 24/7. Réponse garantie sous 24h."
        keywords="contact Back.ma, support netlinking, aide technique, assistance SEO, service client Maroc, questions liens, support plateforme"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Contactez-nous
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-blue-100 max-w-3xl mx-auto"
          >
            Notre équipe est là pour vous aider avec toutes vos questions concernant la vente de liens au Maroc.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name', { required: 'Le nom est requis' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', { 
                        required: 'L\'email est requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email invalide'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register('subject', { required: 'Le sujet est requis' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sujet de votre message"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register('message', { required: 'Le message est requis' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Votre message..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer le message
                </button>
              </form>
            </motion.div>
            
            {/* Contact Information */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Informations de contact</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Notre équipe est disponible pour répondre à toutes vos questions concernant la vente de liens au Maroc.
                </p>
              </div>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <info.icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{info.title}</h3>
                      <a 
                        href={info.link}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {info.content}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* FAQ Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions fréquentes</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Comment vendre des liens sur Back.ma ?</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Créez un compte éditeur, ajoutez vos sites web et publiez vos annonces de liens.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Quels types de liens sont acceptés ?</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Nous acceptons les liens dofollow, nofollow, sponsored et UGC de qualité.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Comment sont gérés les paiements ?</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Les paiements sont sécurisés et gérés via notre plateforme avec plusieurs options disponibles.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Quel est le délai de réponse ?</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Nous répondons à tous les messages dans les 24 heures, souvent plus rapidement.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Proposez-vous un support technique ?</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Oui, notre équipe technique est disponible pour vous aider avec la plateforme.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Support Sections */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">🛠️ Support Technique</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Problèmes avec la plateforme, bugs, questions techniques
                  </p>
                  <a href="mailto:tech@back.ma" className="text-blue-600 hover:underline text-sm font-medium">
                    tech@back.ma
                  </a>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">💼 Support Commercial</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Questions sur les services, tarifs, partenariats
                  </p>
                  <a href="mailto:commercial@back.ma" className="text-green-600 hover:underline text-sm font-medium">
                    commercial@back.ma
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ContactPage; 